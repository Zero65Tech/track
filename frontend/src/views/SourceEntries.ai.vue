<script setup>
import { useLayout } from '@/layout/composables/layout';
import { entryService } from '@/service/entryService';
import { useAggregationStore } from '@/stores/aggregation.store';
import { useBookStore } from '@/stores/book.store';
import { useHeadStore } from '@/stores/head.store';
import { useProfileStore } from '@/stores/profile.store';
import { useSourceStore } from '@/stores/source.store';
import { useTagStore } from '@/stores/tag.store';
import { EntryType } from '@shared/enums';
import { dateUtil, formatUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { getPrimary, getSurface, isDarkTheme } = useLayout();
const profileStore = useProfileStore();
const sourceStore = useSourceStore();
const bookStore = useBookStore();
const headStore = useHeadStore();
const tagStore = useTagStore();
const aggregationStore = useAggregationStore();

const aggregationName = 'balances_by_source_week';
const aggregationState = aggregationStore.getAggregationState(aggregationName);

const sourceId = computed(() => route.params.sourceId);
const sourceName = computed(() => sourceStore.sourcesMap[sourceId.value]?.name || 'Source');

let abortController = new AbortController();
const loadedWeekCount = ref(0);
const entriesByWeek = ref({});
const isLoadingWeek = ref(false);
const error = ref(null);

const POSITIVE_TYPES = new Set([EntryType.CREDIT.id, EntryType.INCOME.id, EntryType.REFUND.id, EntryType.RECEIPT.id]);

function getEntryNetAmount(entry) {
    if (entry.type === EntryType.TRANSFER.id) {
        return entry.sourceIdTo === sourceId.value ? entry.amount : -entry.amount;
    }
    return POSITIVE_TYPES.has(entry.type) ? entry.amount : -entry.amount;
}

// Filter aggregation data for current sourceId, keyed by week start
const sourceWeeksMap = computed(() => {
    const map = {};
    if (!aggregationState.data.value) return map;
    for (const item of aggregationState.data.value) {
        if (item.id.sourceId === sourceId.value) {
            map[item.id.week] = { balance: item.balance, count: item.count };
        }
    }
    return map;
});

// All weeks from earliest to latest (filling gaps), sorted ascending
const allWeeksAsc = computed(() => {
    const weekKeys = Object.keys(sourceWeeksMap.value).sort();
    if (weekKeys.length === 0) return [];

    const weeks = [weekKeys[0]];
    for (let i = 1; i < weekKeys.length; i++) {
        let last = weeks[weeks.length - 1];
        let next = dateUtil.getNext(last, 7);
        while (next < weekKeys[i]) {
            weeks.push(next);
            next = dateUtil.getNext(next, 7);
        }
        weeks.push(weekKeys[i]);
    }
    return weeks;
});

// Cumulative ending balance per week (ascending order)
const cumulativeBalanceMap = computed(() => {
    const weeks = allWeeksAsc.value;
    const map = {};
    let cumulative = 0;
    for (const week of weeks) {
        cumulative += sourceWeeksMap.value[week]?.balance || 0;
        map[week] = cumulative;
    }
    return map;
});

// All weeks in descending order (most recent first)
const allWeeksDesc = computed(() => [...allWeeksAsc.value].reverse());

// Visible weeks based on loadedWeekCount
const visibleWeeks = computed(() => allWeeksDesc.value.slice(0, loadedWeekCount.value));

const hasMore = computed(() => loadedWeekCount.value < allWeeksDesc.value.length);

// Build display data for each visible week
const weekSections = computed(() => {
    return visibleWeeks.value.map((weekStart) => {
        const weekEnd = dateUtil.getNext(weekStart, 6);
        const weekData = sourceWeeksMap.value[weekStart];
        const count = weekData?.count || 0;
        const endingBalance = cumulativeBalanceMap.value[weekStart] ?? 0;
        const entries = entriesByWeek.value[weekStart] || [];

        // Sort entries: date descending, then sortOrder descending
        const sorted = [...entries].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
        });

        // Compute running balance per entry (walk newest to oldest)
        let runningBalance = endingBalance;
        const rows = sorted.map((entry) => {
            const balance = runningBalance;
            runningBalance -= getEntryNetAmount(entry);
            return { ...entry, balance };
        });

        return {
            weekStart,
            weekEnd,
            label: `${formatUtil.formatDate(new Date(weekStart))} — ${formatUtil.formatDate(new Date(weekEnd))}`,
            count,
            endingBalance,
            rows
        };
    });
});

async function fetchWeekEntries(weekStart) {
    const profileId = profileStore.activeProfile?.id;
    if (!profileId) return;

    const weekEnd = dateUtil.getNext(weekStart, 6);
    try {
        const entries = await entryService.getSourceEntries({ profileId, sourceId: sourceId.value, fromDate: weekStart, toDate: weekEnd }, abortController.signal);
        entriesByWeek.value = { ...entriesByWeek.value, [weekStart]: entries };
    } catch (err) {
        if (err.name !== 'CanceledError') {
            error.value = err.message;
        }
    }
}

async function loadMore() {
    if (!hasMore.value || isLoadingWeek.value) return;

    isLoadingWeek.value = true;
    error.value = null;

    const nextIndex = loadedWeekCount.value;
    loadedWeekCount.value++;
    const weekStart = allWeeksDesc.value[nextIndex];
    const weekData = sourceWeeksMap.value[weekStart];

    if (weekData?.count > 0) {
        await fetchWeekEntries(weekStart);
    }

    isLoadingWeek.value = false;
}

async function loadInitial() {
    // Reset state
    abortController.abort();
    abortController = new AbortController();
    loadedWeekCount.value = 0;
    entriesByWeek.value = {};
    error.value = null;

    // Load initial 3 weeks
    const initialWeeks = Math.min(3, allWeeksDesc.value.length);
    for (let i = 0; i < initialWeeks; i++) {
        await loadMore();
    }
}

// Re-load when aggregation data becomes available or sourceId changes
watch(
    [() => aggregationState.data.value, sourceId],
    () => {
        loadInitial();
    },
    { immediate: true }
);

// Reset on profile change
watch(
    () => profileStore.activeProfile,
    () => {
        abortController.abort();
        abortController = new AbortController();
        loadedWeekCount.value = 0;
        entriesByWeek.value = {};
        error.value = null;
    }
);

function getEntryTypeName(typeId) {
    for (const key of Object.keys(EntryType)) {
        if (EntryType[key].id === typeId) return EntryType[key].name;
    }
    return typeId;
}

// Chart

const numDataPoints = ref(52);
const chartContainer = ref(null);
let resizeObserver = null;

const chartData = computed(() => {
    const weeks = allWeeksAsc.value.slice(-numDataPoints.value);
    const balanceMap = cumulativeBalanceMap.value;
    const documentStyle = getComputedStyle(document.documentElement);
    return {
        labels: weeks.map((week) => formatUtil.formatDate(new Date(week))),
        datasets: [
            {
                label: 'Closing Balance',
                data: weeks.map((week) => balanceMap[week]),
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                borderColor: documentStyle.getPropertyValue('--p-primary-500'),
                backgroundColor: documentStyle.getPropertyValue('--p-primary-100'),
                pointRadius: 2.5,
                pointHoverRadius: 4,
                pointBorderColor: '#ffffff',
                pointBackgroundColor: documentStyle.getPropertyValue('--p-primary-500')
            }
        ]
    };
});

const chartOptions = ref(null);

function getChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        const weekStart = context[0].label;
                        const startDate = new Date(weekStart);
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + 6);
                        return [`${formatUtil.formatDate(startDate)} - ${formatUtil.formatDate(endDate)}`];
                    },
                    label: (context) => 'Closing Balance: ' + formatUtil.formatCurrency(context.parsed.y)
                }
            }
        },
        scales: {
            x: {
                ticks: { color: textColorSecondary, font: { weight: 500 } },
                grid: { display: false, drawBorder: false }
            },
            y: {
                beginAtZero: true,
                ticks: { color: textColorSecondary, callback: formatUtil.formatCurrencyNoDecimals },
                grid: { color: surfaceBorder, drawBorder: false }
            }
        }
    };
}

onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
        if (chartContainer.value) {
            numDataPoints.value = Math.round((chartContainer.value.offsetWidth - 2 * 28 - 60) / 9.23);
        }
    });
    if (chartContainer.value) {
        resizeObserver.observe(chartContainer.value);
    }
    chartOptions.value = getChartOptions();
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = getChartOptions();
});

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Common Title -->
        <div class="col-span-12">
            <div class="font-semibold text-2xl">{{ sourceName }}</div>
        </div>

        <!-- Chart -->
        <div class="col-span-12" ref="chartContainer">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Closing Balances</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ aggregationState.isUpdating.value ? 'Updating ...' : aggregationState.isLoading.value ? 'Loading ...' : chartData.labels.length ? aggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="aggregationState.error.value ? aggregationStore.fetchAggregation(aggregationName) : aggregationStore.triggerAggregationUpdate(aggregationName)"
                            :disabled="aggregationState.isUpdating.value || aggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                aggregationState.isUpdating.value || aggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="aggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', aggregationState.isUpdating.value || aggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="aggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ aggregationState.error.value }}</div>
                </div>
                <div v-else-if="chartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="line" :data="chartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Entries -->
        <div class="col-span-12">
            <div class="card">
                <!-- Header -->
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Entries</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ aggregationState.isUpdating.value ? 'Updating ...' : aggregationState.isLoading.value ? 'Loading ...' : allWeeksAsc.length ? aggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="aggregationState.error.value ? aggregationStore.fetchAggregation(aggregationName) : aggregationStore.triggerAggregationUpdate(aggregationName)"
                            :disabled="aggregationState.isUpdating.value || aggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                aggregationState.isUpdating.value || aggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="aggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', aggregationState.isUpdating.value || aggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <!-- Error from aggregation -->
                <div v-if="aggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading aggregation data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ aggregationState.error.value }}</div>
                </div>

                <!-- Loading aggregation -->
                <div v-else-if="aggregationState.isLoading.value && allWeeksDesc.length === 0" class="text-center text-muted-color py-8">
                    <i class="pi pi-spinner animate-spin text-2xl mb-2"></i>
                    <div>Loading source data...</div>
                </div>

                <!-- No data -->
                <div v-else-if="allWeeksDesc.length === 0" class="text-center text-muted-color py-8">No entries found for this source.</div>

                <!-- Week sections -->
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr class="text-left text-muted-color border-b border-surface-200 dark:border-surface-700">
                                <th class="py-2 px-2 font-medium">Date</th>
                                <th class="py-2 px-2 font-medium">Type</th>
                                <th class="py-2 px-2 font-medium">Book</th>
                                <th class="py-2 px-2 font-medium">Head</th>
                                <th class="py-2 px-2 font-medium">Tag</th>
                                <th class="py-2 px-2 font-medium text-right">Amount</th>
                                <th class="py-2 px-2 font-medium">Note</th>
                                <th class="py-2 px-2 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody v-for="section in weekSections" :key="section.weekStart">
                            <!-- Week header -->
                            <tr class="bg-surface-100 dark:bg-surface-800">
                                <td colspan="8" class="py-2 px-3">
                                    <div class="flex justify-between items-center">
                                        <span class="font-medium text-sm">{{ section.label }}</span>
                                        <span class="font-semibold text-sm">{{ formatUtil.formatCurrency(section.endingBalance) }}</span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Empty week placeholder -->
                            <tr v-if="section.count === 0">
                                <td colspan="8" class="text-center text-muted-color text-sm py-4">No entries this week</td>
                            </tr>

                            <!-- Entry rows -->
                            <tr v-for="row in section.rows" :key="row.id" class="border-b border-surface-100 dark:border-surface-800">
                                <td class="py-2 px-2">{{ formatUtil.formatDate(new Date(row.date)) }}</td>
                                <td class="py-2 px-2">{{ getEntryTypeName(row.type) }}</td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="bookStore.booksMap[row.bookId]">
                                        <i class="pi pi-book mr-1" :style="{ color: bookStore.booksMap[row.bookId].color }"></i>
                                        {{ bookStore.booksMap[row.bookId].name }}
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="headStore.headsMap[row.headId]">
                                        <i class="pi pi-clipboard mr-1" :style="{ color: headStore.headsMap[row.headId].color }"></i>
                                        {{ headStore.headsMap[row.headId].name }}
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="tagStore.tagsMap[row.tagId]">
                                        <i class="pi pi-tag mr-1" :style="{ color: tagStore.tagsMap[row.tagId].color }"></i>
                                        {{ tagStore.tagsMap[row.tagId].name }}
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td class="py-2 px-2 text-right" :class="getEntryNetAmount(row) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                    {{ formatUtil.formatCurrency(row.amount) }}
                                </td>
                                <td class="py-2 px-2 text-muted-color truncate max-w-48">{{ row.note || '—' }}</td>
                                <td class="py-2 px-2 text-right font-medium">{{ formatUtil.formatCurrency(row.balance) }}</td>
                            </tr>
                        </tbody>
                    </table>

                    <!-- Error loading entries -->
                    <div v-if="error" class="text-center text-red-600 dark:text-red-400 text-sm mb-4">{{ error }}</div>

                    <!-- Load More button -->
                    <div v-if="hasMore" class="text-center mt-4">
                        <Button label="Load More" icon="pi pi-arrow-down" :loading="isLoadingWeek" :disabled="isLoadingWeek" @click="loadMore" outlined />
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
