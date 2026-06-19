<script setup>
import { useAggregationRefresh } from '@/composables/useAggregationRefresh.ai';
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { colorUtil, dateUtil, formatUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const widgetContainer = ref(null);
let resizeObserver = null;

const props = defineProps({
    aggregationState: {
        type: Object,
        required: true
    },
    accentColor: {
        type: String,
        required: false
    }
});

const aggregationStore = useAggregationStore();
useAggregationRefresh(() => props.aggregationState);

const numDataPoints = ref(52);

const sortedWeeks = computed(() => {
    const weeksSet = new Set();
    props.aggregationState.data.value.forEach((item) => weeksSet.add(item.week));
    const weeks = Array.from(weeksSet).sort();
    for (let i = 0; i < weeks.length - 1; i++) {
        const nextWeek = dateUtil.getNext(weeks[i], 7);
        if (weeks[i + 1] !== nextWeek) {
            weeks.splice(i + 1, 0, nextWeek);
        }
    }
    return weeks;
});

const balancesByWeek = computed(() => {
    const weeks = sortedWeeks.value;

    const amounts = {};
    props.aggregationState.data.value.forEach((item) => {
        amounts[item.week] = (amounts[item.week] || 0) + item.amount;
    });

    for (let i = 1; i < weeks.length; i++) {
        amounts[weeks[i]] = amounts[weeks[i - 1]] + (amounts[weeks[i]] || 0);
    }

    return amounts;
});

const chartData = computed(() => {
    const weeks = sortedWeeks.value.slice(-numDataPoints.value);
    const dataMap = balancesByWeek.value;
    const documentStyle = getComputedStyle(document.documentElement);
    const primary = props.accentColor || documentStyle.getPropertyValue('--p-primary-500');
    const bg = colorUtil.hexToRgba(primary, 0.08);
    return {
        labels: weeks.map((week) => formatUtil.formatDate(week)),
        datasets: [
            {
                label: 'Closing Balance',
                data: weeks.map((week) => dataMap[week]),
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                borderColor: primary,
                backgroundColor: bg,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBorderColor: '#ffffff',
                pointBackgroundColor: primary
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
                <div class="font-semibold text-xl">Balance Trend</div>
                <div class="flex items-center gap-2">
                    <span class="text-primary font-medium text-sm">
                        {{ props.aggregationState.isUpdating.value ? 'Updating ...' : props.aggregationState.isLoading.value ? 'Loading ...' : '' }}
                    </span>
                    <button
                        @click="props.aggregationState.error.value ? aggregationStore.refreshAggregation(props.aggregationState.key) : aggregationStore.triggerAggregationUpdate(props.aggregationState.key)"
                        :disabled="props.aggregationState.isUpdating.value || props.aggregationState.isLoading.value"
                        :class="[
                            'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                            props.aggregationState.isUpdating.value || props.aggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                        ]"
                        :title="props.aggregationState.error.value ? 'Retry' : 'Update'"
                    >
                        <i :class="['pi', props.aggregationState.isUpdating.value || props.aggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                    </button>
                </div>
            </div>

            <div v-if="props.aggregationState.error.value" class="mb-4">
                <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                <div class="text-red-500 dark:text-red-300 text-xs">{{ props.aggregationState.error.value }}</div>
            </div>

            <div v-else-if="chartData.labels.length === 0" class="mb-4">
                <div class="text-center text-muted-color">No data available !</div>
            </div>

            <Chart v-else type="line" :data="chartData" :options="chartOptions" class="h-80" />
        </div>
    </div>
</template>
