<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { useBookStore } from '@/stores/book.store';
import { EntryType } from '@shared/enums';
import { formatUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    entryTypes: {
        type: Array,
        required: true
    }
});

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const widgetContainer = ref(null);
let resizeObserver = null;

const bookStore = useBookStore();
const aggregationStore = useAggregationStore();

const aggregationName = 'amounts_by_type_book_month';
const aggregationState = aggregationStore.getAggregationState(aggregationName);

const numBars = ref(12);

const sortedMonths = computed(() => {
    const monthsSet = new Set();
    aggregationState.data.value.forEach((item) => monthsSet.add(item._id.month));
    return Array.from(monthsSet).sort();
});

const amountsByBookIdAndMonth = computed(() => {
    const result = {};
    aggregationState.data.value
        .filter((item) => props.entryTypes.includes(item._id.type))
        .forEach((item) => {
            const bookId = item._id.bookId;
            const month = item._id.month;
            if (!result[bookId]) {
                result[bookId] = {};
            }
            if ([EntryType.DEBIT.id, EntryType.INCOME.id, EntryType.EXPENSE.id].includes(item._id.type)) {
                result[bookId][month] = (result[bookId][month] || 0) + item.amount;
            } else {
                result[bookId][month] = (result[bookId][month] || 0) - item.amount;
            }
        });
    return result;
});

const moving12MonthsAverage = computed(() => {
    const NUM_MONTHS = 12;

    const totalAmountsByMonth = {};
    for (const amountsByMonth of Object.values(amountsByBookIdAndMonth.value)) {
        for (const [month, amount] of Object.entries(amountsByMonth)) {
            totalAmountsByMonth[month] = (totalAmountsByMonth[month] || 0) + amount;
        }
    }

    const movingAverages = [];
    for (let index = 0; index < sortedMonths.value.length; index++) {
        const startIndex = Math.max(0, index + 1 - NUM_MONTHS);
        const endIndex = index + 1;
        const movingAverage =
            sortedMonths.value
                .slice(startIndex, endIndex)
                .map((month) => totalAmountsByMonth[month])
                .reduce((a, b) => a + b, 0) /
            (endIndex - startIndex);
        movingAverages.push(movingAverage);
    }

    return movingAverages;
});

const chartData = computed(() => {
    const months = sortedMonths.value.slice(-numBars.value);
    const amounts = amountsByBookIdAndMonth.value;
    const movingAverages = moving12MonthsAverage.value.slice(-numBars.value);

    const lables = months.map(formatUtil.formatMonth);

    const datasets = [
        {
            label: 'Average (12M)',
            data: movingAverages,
            type: 'line',
            fill: false,
            tension: 0.4,
            borderWidth: 1,
            pointRadius: 2.5,
            pointHoverRadius: 4
        }
    ];

    for (const book of bookStore.books) {
        if (!amounts[book.id]) continue;
        const data = months.map((month) => amounts[book.id][month] || null);
        datasets.push({
            label: book.name,
            data,
            backgroundColor: book.color
        });
    }

    return { labels: lables, datasets };
});

const chartOptions = ref(null);

function getChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColor = documentStyle.getPropertyValue('--text-color');
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
                labels: {
                    fontColor: textColor
                }
            },
            tooltip: {
                filter: (item) => item.parsed.y !== null, // Only show items with non-zero values
                callbacks: {
                    label: (context) => context.dataset.label + ': ' + formatUtil.formatCurrency(context.parsed.y)
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textColorSecondary,
                    font: {
                        weight: 500
                    }
                },
                grid: {
                    display: false,
                    drawBorder: false
                }
            },
            y: {
                stacked: true,
                ticks: {
                    color: textColorSecondary,
                    callback: formatUtil.formatCurrencyNoDecimals
                },
                grid: {
                    color: surfaceBorder,
                    drawBorder: false
                }
            }
        }
    };
}

onMounted(() => {
    resizeObserver = new ResizeObserver(() => {
        numBars.value = Math.round((widgetContainer.value.offsetWidth - 2 * 28 - 60) / 40);
    });

    if (widgetContainer.value) {
        resizeObserver.observe(widgetContainer.value);
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
    <div class="col-span-12" ref="widgetContainer">
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <div class="font-semibold text-xl">{{ title }}</div>
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

            <Chart v-else type="bar" :data="chartData" :options="chartOptions" class="h-80" />
        </div>
    </div>
</template>
