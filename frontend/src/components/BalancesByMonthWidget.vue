<script setup>
import { useBalanceSeries } from '@/composables/useBalanceSeries';
import { useResponsiveDataPoints } from '@/composables/useResponsiveDataPoints';
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { colorUtil, formatUtil, monthUtil } from '@shared/utils';
import { computed, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

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

const { widgetContainer, numDataPoints } = useResponsiveDataPoints({
    initialValue: 60,
    pixelsPerPoint: 8 // Enough to fit in 10 x 12 points
});

const { sortedPeriods: sortedMonths, balancesByPeriod: balancesByMonth } = useBalanceSeries(props.aggregationState, 'month', (m) => monthUtil.getNext(m));

const chartData = computed(() => {
    const months = sortedMonths.value.slice(-numDataPoints.value);
    const dataMap = balancesByMonth.value;
    const documentStyle = getComputedStyle(document.documentElement);
    const primary = props.accentColor || documentStyle.getPropertyValue('--p-primary-500');
    const bg = colorUtil.hexToRgba(primary, 0.08);
    return {
        labels: months.map((month) => formatUtil.formatMonth(month)),
        datasets: [
            {
                label: 'Closing Balance',
                data: months.map((month) => dataMap[month]),
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
    chartOptions.value = getChartOptions();
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = getChartOptions();
});
</script>

<template>
    <div class="col-span-12" ref="widgetContainer">
        <div class="card">
            <div class="flex justify-between items-center mb-6">
                <div class="font-semibold text-xl">Balance Trend</div>
                <div class="flex items-center gap-2">
                    <button
                        @click="props.aggregationState.error.value ? aggregationStore.refreshAggregation(props.aggregationState.key) : aggregationStore.triggerAggregationUpdate(props.aggregationState.key)"
                        :disabled="props.aggregationState.isLoading.value || props.aggregationState.isTriggering.value || props.aggregationState.isUpdating.value"
                        :class="[
                            'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                            props.aggregationState.isLoading.value || props.aggregationState.isTriggering.value || props.aggregationState.isUpdating.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                        ]"
                        :title="props.aggregationState.error.value ? 'Refresh' : 'Update'"
                    >
                        <i :class="['pi', props.aggregationState.isLoading.value || props.aggregationState.isTriggering.value || props.aggregationState.isUpdating.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
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
