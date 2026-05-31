<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { monthUtil, formatUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const widgetContainer = ref(null);
let resizeObserver = null;

const props = defineProps({
    aggregationState: {
        type: Object,
        required: true
    }
});

const aggregationStore = useAggregationStore();
const aggregationState = props.aggregationState;

const numDataPoints = ref(52);

const sortedMonths = computed(() => {
    const monthsSet = new Set();
    aggregationState.data.value.forEach((item) => monthsSet.add(item.month));
    const months = Array.from(monthsSet).sort();
    for (let i = 0; i < months.length - 1; i++) {
        const nextMonth = monthUtil.getNext(months[i]);
        if (months[i + 1] !== nextMonth) {
            months.splice(i + 1, 0, nextMonth);
        }
    }
    return months;
});

const cumulativeAmountsByMonth = computed(() => {
    const months = sortedMonths.value;

    const amounts = {};
    aggregationState.data.value.forEach((item) => {
        amounts[item.month] = (amounts[item.month] || 0) + item.amount;
    });

    for (let i = 1; i < months.length; i++) {
        amounts[months[i]] = amounts[months[i - 1]] + (amounts[months[i]] || 0);
    }

    return amounts;
});

const chartData = computed(() => {
    const months = sortedMonths.value.slice(-numDataPoints.value);
    const dataMap = cumulativeAmountsByMonth.value;
    const documentStyle = getComputedStyle(document.documentElement);
    return {
        labels: months.map((month) => formatUtil.formatMonth(month)),
        datasets: [
            {
                label: 'Closing Balance',
                data: months.map((week) => dataMap[week]),
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
                callbacks: {
                    // title: function (context) {
                    //     const weekStart = context[0].label;
                    //     const startDate = new Date(weekStart);
                    //     const endDate = new Date(startDate);
                    //     endDate.setDate(endDate.getDate() + 6);
                    //     return [`${formatUtil.formatDate(startDate)} - ${formatUtil.formatDate(endDate)}`];
                    // },
                    label: (context) => 'Closing Balance: ' + formatUtil.formatCurrency(context.parsed.y)
                }
            }
        },
        scales: {
            x: {
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
                beginAtZero: true,
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
        numDataPoints.value = Math.round((widgetContainer.value.offsetWidth - 2 * 28 - 60) / 9.23);
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
                <div class="font-semibold text-xl">Closing Balances (Books)</div>
                <div class="flex items-center gap-2">
                    <span class="text-primary font-medium text-sm">
                        {{ aggregationState.isUpdating.value ? 'Updating ...' : aggregationState.isLoading.value ? 'Loading ...' : chartData.labels.length ? aggregationState.dataUpdatedTimeAgo.value : '' }}
                    </span>
                    <button
                        @click="aggregationState.error.value ? aggregationStore.fetchAggregation(aggregationState.key) : aggregationStore.triggerAggregationUpdate(aggregationState.key)"
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
</template>
