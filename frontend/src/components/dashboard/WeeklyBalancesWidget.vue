<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { dateUtil, formatUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();

const widgetContainer = ref(null);
let resizeObserver = null;

const aggregationStore = useAggregationStore();

const aggregationName = 'amounts_by_week';
const aggregationState = aggregationStore.getAggregationState(aggregationName);

const numDataPoints = ref(52);

function formatDate(date) {
    return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
}

const chartData = computed(() => {
    if (!aggregationState.data.value || aggregationState.data.value.length === 0) {
        return null;
    }

    const allData = [...aggregationState.data.value];
    for (let i = 0; i < allData.length - 1; i++) {
        const nextDate = dateUtil.getNext(allData[i]._id, 7);
        if (allData[i + 1]._id !== nextDate) {
            allData.splice(i + 1, 0, { _id: nextDate, balance: allData[i].balance });
        } else {
            allData[i + 1] = { _id: nextDate, balance: allData[i].balance + allData[i + 1].balance };
        }
    }

    const data = allData.slice(-numDataPoints.value);
    const documentStyle = getComputedStyle(document.documentElement);
    return {
        labels: data.map((item) => {
            return formatDate(new Date(item._id));
        }),
        datasets: [
            {
                label: 'Closing Balance',
                data: data.map((item) => item.balance),
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
        scales: {
            x: {
                ticks: {
                    color: textColorSecondary
                },
                grid: {
                    color: surfaceBorder
                }
            },
            y: {
                beginAtZero: true,
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
            legend: {
                display: false
            },
            tooltip: {
                callbacks: {
                    title: function (context) {
                        const weekStart = context[0].label;
                        const startDate = new Date(weekStart);
                        const endDate = new Date(startDate);
                        endDate.setDate(endDate.getDate() + 6);
                        return [`${formatDate(startDate)} - ${formatDate(endDate)}`];
                    },
                    label: (context) => 'Closing Balance: ' + formatUtil.formatCurrency(context.parsed.y)
                }
            }
        }
    };
}

function calculateDataPoints() {
    if (widgetContainer.value) {
        return Math.max(13, Math.round((widgetContainer.value.offsetWidth - 2 * 28 - 60) / 10));
    } else {
        return numDataPoints.value;
    }
}

onMounted(() => {
    chartOptions.value = getChartOptions();
    numDataPoints.value = calculateDataPoints();

    resizeObserver = new ResizeObserver(() => {
        numDataPoints.value = calculateDataPoints();
    });

    if (widgetContainer.value) {
        resizeObserver.observe(widgetContainer.value);
    }
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = getChartOptions();
});

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
});

const handleRetry = async () => {
    await aggregationStore.fetchAggregation(aggregationName);
};

const handleUpdate = async () => {
    await aggregationStore.triggerAggregationUpdate(aggregationName);
};
</script>

<template>
    <div class="col-span-12" ref="widgetContainer">
        <div class="card">
            <div class="flex items-center justify-between mb-4">
                <div class="font-semibold text-xl">Closing Balances by Week</div>
                <button
                    @click="aggregationState.error.value ? handleRetry() : handleUpdate()"
                    :disabled="aggregationState.isUpdating.value || aggregationState.isLoading.value"
                    class="p-2 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                    :title="aggregationState.error.value ? 'Retry' : 'Re-calculate'"
                >
                    <i :class="['pi', aggregationState.isUpdating.value || aggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                </button>
            </div>

            <div v-if="aggregationState.error.value" class="mb-4">
                <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                <div class="text-red-500 dark:text-red-300 text-xs">{{ aggregationState.error.value }}</div>
            </div>

            <div v-else-if="!chartData && !aggregationState.isLoading.value" class="flex items-center justify-center h-80">
                <div class="text-center text-muted-color">No weekly balance data available</div>
            </div>

            <div v-else-if="!chartData && aggregationState.isLoading.value" class="flex items-center justify-center h-80">
                <div class="text-center">
                    <div class="text-muted-color">Loading ...</div>
                </div>
            </div>

            <div v-else-if="chartData && chartData.labels.length">
                <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
                <div v-if="aggregationState.isUpdating.value" class="text-xs text-muted-color text-right mt-2">Updating ...</div>
                <div v-else-if="aggregationState.isLoading.value" class="text-xs text-muted-color text-right mt-2">Loading ...</div>
                <div v-else class="text-xs text-muted-color text-right mt-2">Updated {{ aggregationState.dataUpdatedTimeAgo.value }}</div>
            </div>
        </div>
    </div>
</template>
