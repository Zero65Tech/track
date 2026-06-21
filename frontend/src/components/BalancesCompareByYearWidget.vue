<script setup>
import { usePeriodBalances } from '@/composables/usePeriodBalances';
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { colorUtil, formatUtil, monthUtil } from '@shared/utils';
import { computed, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const props = defineProps({
    primaryAggregationState: {
        type: Object,
        required: true
    },
    secondaryAggregationState: {
        type: Object,
        required: true
    },
    accentColor: {
        type: String,
        required: false
    }
});

const aggregationStore = useAggregationStore();

const { sortedPeriods: sortedMonths, balancesByPeriodArr } = usePeriodBalances([props.primaryAggregationState, props.secondaryAggregationState], 'month', monthUtil.getNext);

const chartData = computed(() => {
    const years = sortedMonths.value;
    const [primaryAmounts, secondaryAmounts] = balancesByPeriodArr.value;
    const documentStyle = getComputedStyle(document.documentElement);
    const primaryColor = props.accentColor || documentStyle.getPropertyValue('--p-primary-500');
    const secondaryColor = documentStyle.getPropertyValue('--p-secondary-500');
    const primaryBg = colorUtil.hexToRgba(primaryColor, 0.08);
    const secondaryBg = colorUtil.hexToRgba(secondaryColor, 0.08);
    return {
        labels: years.map((month) => formatUtil.formatMonth(month)),
        datasets: [
            {
                label: 'Primary Balance',
                data: years.map((month) => primaryAmounts[month]),
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                borderColor: primaryColor,
                backgroundColor: primaryBg,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBorderColor: '#ffffff',
                pointBackgroundColor: primaryColor
            },
            {
                label: 'Secondary Balance',
                data: years.map((month) => -secondaryAmounts[month]),
                fill: true,
                tension: 0.4,
                borderWidth: 1,
                borderColor: secondaryColor,
                backgroundColor: secondaryBg,
                pointRadius: 2,
                pointHoverRadius: 4,
                pointBorderColor: '#ffffff',
                pointBackgroundColor: secondaryColor
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
                display: true,
                labels: {
                    fontColor: textColor
                }
            },
            tooltip: {
                callbacks: {
                    label: (context) => context.dataset.label + ': ' + formatUtil.formatCurrency(context.parsed.y)
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
                        @click="props.primaryAggregationState.error.value ? aggregationStore.refreshAggregation(props.secondaryAggregationState.key) : aggregationStore.triggerAggregationUpdate(props.secondaryAggregationState.key)"
                        :disabled="props.primaryAggregationState.isLoading.value || props.primaryAggregationState.isTriggering.value || props.primaryAggregationState.isUpdating.value"
                        :class="[
                            'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                            props.primaryAggregationState.isLoading.value || props.primaryAggregationState.isTriggering.value || props.primaryAggregationState.isUpdating.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                        ]"
                        :title="props.primaryAggregationState.error.value ? 'Refresh' : 'Update'"
                    >
                        <i
                            :class="['pi', props.primaryAggregationState.isLoading.value || props.primaryAggregationState.isTriggering.value || props.primaryAggregationState.isUpdating.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"
                        ></i>
                    </button>
                </div>
            </div>

            <div v-if="props.primaryAggregationState.error.value" class="mb-4">
                <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                <div class="text-red-500 dark:text-red-300 text-xs">{{ props.primaryAggregationState.error.value }}</div>
            </div>

            <div v-else-if="chartData.labels.length === 0" class="mb-4">
                <div class="text-center text-muted-color">No data available !</div>
            </div>

            <Chart v-else type="line" :data="chartData" :options="chartOptions" class="h-80" />
        </div>
    </div>
</template>
