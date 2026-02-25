<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { dateUtil, formatUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const widgetContainer = ref(null);
let resizeObserver = null;

const aggregationStore = useAggregationStore();

const aggregationName = 'balances_by_week';
const aggregationState = aggregationStore.getAggregationState(aggregationName);

const numDataPoints = ref(52);

const sortedWeeks = computed(() => {
    const weeksSet = new Set();
    aggregationState.data.value.forEach((item) => weeksSet.add(item.id));
    const weeks = Array.from(weeksSet).sort();
    for (let i = 0; i < weeks.length - 1; i++) {
        const nextWeek = dateUtil.getNext(weeks[i], 7);
        if (weeks[i + 1] !== nextWeek) {
            weeks.splice(i + 1, 0, nextWeek);
        }
    }
    return weeks;
});

const cumulativeAmountsByWeek = computed(() => {
    const weeks = sortedWeeks.value;

    const amounts = {};
    aggregationState.data.value.forEach((item) => {
        amounts[item.id] = item.balance;
    });

    for (let i = 1; i < weeks.length; i++) {
        amounts[weeks[i]] = amounts[weeks[i - 1]] + (amounts[weeks[i]] || 0);
    }

    return amounts;
});

const chartData = computed(() => {
    const weeks = sortedWeeks.value.slice(-numDataPoints.value);
    const dataMap = cumulativeAmountsByWeek.value;
    const documentStyle = getComputedStyle(document.documentElement);
    return {
        labels: weeks.map((week) => formatUtil.formatDate(new Date(week))),
        datasets: [
            {
                label: 'Closing Balance',
                data: weeks.map((week) => dataMap[week]),
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
</template>
