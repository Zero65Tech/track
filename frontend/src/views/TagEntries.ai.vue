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
import { formatUtil } from '@shared/utils';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { getPrimary, getSurface, isDarkTheme } = useLayout();
const profileStore = useProfileStore();
const bookStore = useBookStore();
const headStore = useHeadStore();
const sourceStore = useSourceStore();
const tagStore = useTagStore();
const aggregationStore = useAggregationStore();

const chartAggregationName = 'amounts_by_type_head_tag_month';
const chartAggregationState = aggregationStore.getAggregationState(chartAggregationName);

const tagId = computed(() => route.params.tagId);
const tagName = computed(() => tagStore.tagsMap[tagId.value]?.name || 'Tag');

let abortController = new AbortController();
const loadedMonthCount = ref(0);
const entriesByMonth = ref({});
const isLoadingMonth = ref(false);
const error = ref(null);

const POSITIVE_TYPES = new Set([EntryType.CREDIT.id, EntryType.INCOME.id, EntryType.REFUND.id, EntryType.RECEIPT.id]);

function getEntryNetAmount(entry) {
    return POSITIVE_TYPES.has(entry.type) ? entry.amount : -entry.amount;
}

function getNextMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthDateRange(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return { fromDate: `${monthStr}-01`, toDate: `${monthStr}-${String(lastDay).padStart(2, '0')}` };
}

// Filter aggregation data for current tagId, keyed by month
const tagMonthsMap = computed(() => {
    const map = {};
    if (!chartAggregationState.data.value) return map;
    for (const item of chartAggregationState.data.value) {
        if (item.id.tagId !== tagId.value) continue;
        const month = item.id.month;
        if (!map[month]) map[month] = { balance: 0, count: 0 };
        const sign = POSITIVE_TYPES.has(item.id.type) ? 1 : -1;
        map[month].balance += sign * item.amount;
        map[month].count += item.count;
    }
    return map;
});

// All months from earliest to latest (filling gaps), sorted ascending
const allMonthsAsc = computed(() => {
    const monthKeys = Object.keys(tagMonthsMap.value).sort();
    if (monthKeys.length === 0) return [];

    const months = [monthKeys[0]];
    for (let i = 1; i < monthKeys.length; i++) {
        let next = getNextMonth(months[months.length - 1]);
        while (next < monthKeys[i]) {
            months.push(next);
            next = getNextMonth(next);
        }
        months.push(monthKeys[i]);
    }
    return months;
});

// Cumulative ending balance per month (ascending order)
const cumulativeBalanceMap = computed(() => {
    const months = allMonthsAsc.value;
    const map = {};
    let cumulative = 0;
    for (const month of months) {
        cumulative += tagMonthsMap.value[month]?.balance || 0;
        map[month] = cumulative;
    }
    return map;
});

// All months in descending order (most recent first)
const allMonthsDesc = computed(() => [...allMonthsAsc.value].reverse());

// Visible months based on loadedMonthCount
const visibleMonths = computed(() => allMonthsDesc.value.slice(0, loadedMonthCount.value));

const hasMore = computed(() => loadedMonthCount.value < allMonthsDesc.value.length);

// Build display data for each visible month
const monthSections = computed(() => {
    return visibleMonths.value.map((month) => {
        const monthData = tagMonthsMap.value[month];
        const count = monthData?.count || 0;
        const endingBalance = cumulativeBalanceMap.value[month] ?? 0;
        const entries = entriesByMonth.value[month] || [];

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
            month,
            label: formatUtil.formatMonth(month),
            count,
            endingBalance,
            rows
        };
    });
});

async function fetchMonthEntries(month) {
    const profileId = profileStore.activeProfile?.id;
    if (!profileId) return;

    const { fromDate, toDate } = getMonthDateRange(month);
    try {
        const entries = await entryService.getTagEntries({ profileId, tagId: tagId.value, fromDate, toDate }, abortController.signal);
        entriesByMonth.value = { ...entriesByMonth.value, [month]: entries };
    } catch (err) {
        if (err.name !== 'CanceledError') {
            error.value = err.message;
        }
    }
}

async function loadMore() {
    if (!hasMore.value || isLoadingMonth.value) return;

    isLoadingMonth.value = true;
    error.value = null;

    const count = Math.min(3, allMonthsDesc.value.length - loadedMonthCount.value);
    for (let i = 0; i < count; i++) {
        const nextIndex = loadedMonthCount.value;
        loadedMonthCount.value++;
        const month = allMonthsDesc.value[nextIndex];
        const monthData = tagMonthsMap.value[month];

        if (monthData?.count > 0) {
            await fetchMonthEntries(month);
        }
    }

    isLoadingMonth.value = false;
}

async function loadInitial() {
    // Reset state
    abortController.abort();
    abortController = new AbortController();
    loadedMonthCount.value = 0;
    entriesByMonth.value = {};
    error.value = null;

    // Load initial 3 months
    await loadMore();
}

// Re-load when aggregation data becomes available or tagId changes
watch(
    [() => chartAggregationState.data.value, tagId],
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
        loadedMonthCount.value = 0;
        entriesByMonth.value = {};
        error.value = null;
    }
);

function getEntryTypeName(typeId) {
    for (const key of Object.keys(EntryType)) {
        if (EntryType[key].id === typeId) return EntryType[key].name;
    }
    return typeId;
}

// Charts

const DEBIT_CREDIT_TYPES = new Set([EntryType.DEBIT.id, EntryType.CREDIT.id, EntryType.REFUND.id]);
const INCOME_TAX_TYPES = new Set([EntryType.INCOME.id, EntryType.TAX.id, EntryType.EXPENSE.id]);

function buildMonthHeadMap(typeFilter, negate = false) {
    return computed(() => {
        const map = {};
        if (!chartAggregationState.data.value) return map;
        for (const item of chartAggregationState.data.value) {
            if (item.id.tagId !== tagId.value) continue;
            if (!typeFilter.has(item.id.type)) continue;
            const month = item.id.month;
            const headId = item.id.headId;
            let sign = POSITIVE_TYPES.has(item.id.type) ? 1 : -1;
            if (negate) sign = -sign;
            if (!map[month]) map[month] = {};
            map[month][headId] = (map[month][headId] || 0) + sign * item.amount;
        }
        return map;
    });
}

function buildChartData(monthHeadMap) {
    return computed(() => {
        const map = monthHeadMap.value;
        const months = Object.keys(map).sort();
        const headIds = new Set();
        for (const headAmounts of Object.values(map)) {
            for (const headId of Object.keys(headAmounts)) headIds.add(headId);
        }
        const headsMap = headStore.headsMap;

        const datasets = [...headIds].map((headId) => {
            const head = headsMap[headId];
            return {
                label: head?.name || headId,
                data: months.map((month) => map[month]?.[headId] || 0),
                backgroundColor: head?.color || '#94a3b8',
                borderWidth: 0
            };
        });

        return {
            labels: months.map((month) => formatUtil.formatMonth(month)),
            datasets
        };
    });
}

const debitCreditMonthHeadMap = buildMonthHeadMap(DEBIT_CREDIT_TYPES, true);
const incomeExpenseMonthHeadMap = buildMonthHeadMap(INCOME_TAX_TYPES);

const debitCreditChartData = buildChartData(debitCreditMonthHeadMap);
const incomeExpenseChartData = buildChartData(incomeExpenseMonthHeadMap);

const chartOptions = ref(null);

function getChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: {
                callbacks: {
                    label: (context) => `${context.dataset.label}: ${formatUtil.formatCurrency(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: textColorSecondary, font: { weight: 500 } },
                grid: { display: false, drawBorder: false }
            },
            y: {
                stacked: true,
                ticks: { color: textColorSecondary, callback: formatUtil.formatCurrencyNoDecimals },
                grid: { color: surfaceBorder, drawBorder: false }
            }
        }
    };
}

onMounted(() => {
    chartOptions.value = getChartOptions();
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = getChartOptions();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Common Title -->
        <div class="col-span-12">
            <div class="font-semibold text-2xl">{{ tagName }}</div>
        </div>

        <!-- Debit - Credit Chart -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Debit - Credit</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : debitCreditChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="debitCreditChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="bar" :data="debitCreditChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Income - Tax Chart -->
        <div class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Income - Tax</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : incomeExpenseChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="incomeExpenseChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="bar" :data="incomeExpenseChartData" :options="chartOptions" class="h-80" />
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
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : allMonthsAsc.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <!-- Error from aggregation -->
                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading aggregation data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>

                <!-- Loading aggregation -->
                <div v-else-if="chartAggregationState.isLoading.value && allMonthsDesc.length === 0" class="text-center text-muted-color py-8">
                    <i class="pi pi-spinner animate-spin text-2xl mb-2"></i>
                    <div>Loading tag data...</div>
                </div>

                <!-- No data -->
                <div v-else-if="allMonthsDesc.length === 0" class="text-center text-muted-color py-8">No entries found for this tag.</div>

                <!-- Month sections -->
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr class="text-left text-muted-color border-b border-surface-200 dark:border-surface-700">
                                <th class="py-2 px-2 font-medium">Date</th>
                                <th class="py-2 px-2 font-medium">Type</th>
                                <th class="py-2 px-2 font-medium">Book</th>
                                <th class="py-2 px-2 font-medium">Head</th>
                                <th class="py-2 px-2 font-medium">Source</th>
                                <th class="py-2 px-2 font-medium text-right">Amount</th>
                                <th class="py-2 px-2 font-medium">Note</th>
                                <th class="py-2 px-2 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody v-for="section in monthSections" :key="section.month">
                            <!-- Month header -->
                            <tr class="bg-surface-100 dark:bg-surface-800">
                                <td colspan="8" class="py-2 px-3">
                                    <div class="flex justify-between items-center">
                                        <span class="font-medium text-sm">{{ section.label }}</span>
                                        <span class="font-semibold text-sm">{{ formatUtil.formatCurrency(section.endingBalance) }}</span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Empty month placeholder -->
                            <tr v-if="section.count === 0">
                                <td colspan="8" class="text-center text-muted-color text-sm py-4">No entries this month</td>
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
                                    <template v-if="sourceStore.sourcesMap[row.sourceId]">
                                        <i class="pi pi-wallet mr-1" :style="{ color: sourceStore.sourcesMap[row.sourceId].color }"></i>
                                        {{ sourceStore.sourcesMap[row.sourceId].name }}
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
                </div>

                <!-- Error loading entries -->
                <div v-if="error" class="text-center text-red-600 dark:text-red-400 text-sm mb-4">{{ error }}</div>

                <!-- Load More button -->
                <div v-if="hasMore" class="text-center mt-4">
                    <Button label="Load More" icon="pi pi-arrow-down" :loading="isLoadingMonth" :disabled="isLoadingMonth" @click="loadMore" outlined />
                </div>
            </div>
        </div>
    </div>
</template>
