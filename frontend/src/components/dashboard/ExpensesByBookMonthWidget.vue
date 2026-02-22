<script setup>
import { useAggregationStore } from '@/stores/aggregation.store';
import { useBookStore } from '@/stores/book.store';
import { EntryType } from '@shared/enums';
import { formatUtil } from '@shared/utils';
import Chart from 'primevue/chart';
import { computed, watch } from 'vue';

const bookStore = useBookStore();
const aggregationStore = useAggregationStore();

const aggregationName = 'amounts_by_type_book_month';
const aggregationState = aggregationStore.getAggregationState(aggregationName);

let resizeObserver = null;

const sortedMonths = computed(() => {
    const monthsSet = new Set();
    aggregationState.data.value.forEach((item) => monthsSet.add(item._id.month));
    return Array.from(monthsSet).sort().slice(-36);
});

const amountsByBookIdAndMonth = computed(() => {
    const result = {};
    aggregationState.data.value
        .filter((item) => sortedMonths.value.includes(item._id.month) && (item._id.type === EntryType.EXPENSE.id || item._id.type === EntryType.REFUND.id))
        .forEach((item) => {
            const bookId = item._id.bookId;
            const month = item._id.month;
            if (!result[bookId]) {
                result[bookId] = {};
            }
            result[bookId][month] = (result[bookId][month] || 0) + (item._id.type === EntryType.EXPENSE.id ? -item.balance : item.balance);
        });
    return result;
});

const getMonthName = (monthNumber) => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return monthNames[monthNumber - 1] || `Month ${monthNumber}`;
};

const chartData = computed(() => {
    const months = sortedMonths.value;
    const amounts = amountsByBookIdAndMonth.value;
    if (months.length === 0) {
        return { labels: [], datasets: [] };
    }

    const datasets = [];
    for (const book of bookStore.books) {
        if (!amounts[book.id]) {
            continue;
        }
        const data = months.map((month) => amounts[book.id][month] || 0);
        datasets.push({
            label: book.name,
            data,
            backgroundColor: book.color,
            borderColor: '#ffffff'
        });
    }

    const monthLabels = months.map(formatUtil.formatMonth);
    return { labels: monthLabels, datasets };
});

const chartOptions = computed(() => {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        scales: {
            x: {
                stacked: true,
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                ticks: {
                    color: textColorSecondary,
                    callback: formatUtil.formatCurrencyNoDecimals
                },
                grid: {
                    color: surfaceBorder
                }
            }
        },
        plugins: {
            tooltip: {
                filter: (item) => item.parsed.y !== 0, // Only show items with non-zero values
                callbacks: {
                    label: (context) => context.dataset.label + ': ' + formatUtil.formatCurrency(context.parsed.y)
                }
            }
        }
    };
});

function handleRetry() {
    if (aggregationState.error.value) {
        aggregationStore.fetchAggregation(aggregationName);
    } else {
        aggregationStore.triggerAggregationUpdate(aggregationName);
    }
}

// Watch for theme changes to update chart colors
watch(
    () => document.documentElement.classList.contains('dark'),
    () => {
        // Force reactivity for chart by reassigning options
        if (chartOptions.value) {
            chartOptions.value = { ...chartOptions.value };
        }
    }
);
</script>

<template>
    <div class="col-span-12">
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <div class="font-semibold text-xl">Expenses by Book (Monthly)</div>
                <div class="flex items-center gap-2">
                    <span class="text-primary font-medium text-sm">
                        {{ aggregationState.isLoading.value ? 'Loading ...' : aggregationState.isUpdating.value ? 'Updating ...' : aggregationState.dataUpdatedTimeAgo.value }}
                    </span>
                    <button
                        @click="handleRetry"
                        :disabled="aggregationState.isLoading.value || aggregationState.isUpdating.value"
                        :class="[
                            'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                            aggregationState.isLoading.value || aggregationState.isUpdating.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                        ]"
                        :title="aggregationState.error.value ? 'Retry' : 'Re-calculate'"
                    >
                        <i :class="['pi', aggregationState.isUpdating.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                    </button>
                </div>
            </div>

            <div v-if="aggregationState.error.value" class="mb-4">
                <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                <div class="text-red-500 dark:text-red-300 text-xs">{{ aggregationState.error.value }}</div>
            </div>

            <div v-else-if="aggregationState.isLoading.value" class="text-center py-8">
                <div class="text-muted-color">Loading data...</div>
            </div>

            <div v-else-if="!chartData.labels || chartData.labels.length === 0" class="text-center py-8">
                <div class="text-muted-color">No data available</div>
            </div>

            <Chart v-else type="bar" :data="chartData" :options="chartOptions" class="h-96" />
        </div>
    </div>
</template>
