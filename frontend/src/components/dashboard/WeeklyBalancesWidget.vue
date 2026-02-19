<script setup>
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { dateUtil } from '@shared/utils';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const aggregationStore = useAggregationStore();
let intervalId = null;
let resizeObserver = null;

const aggregationName = 'amounts_by_week';
const aggState = aggregationStore.getAggregationState(aggregationName);

// Calculate number of data points based on widget width
const numDataPoints = ref(52);
const widgetContainer = ref(null);

const calculateDataPoints = () => {
    if (!widgetContainer.value) return;
    const width = widgetContainer.value.offsetWidth;
    // Roughly 30px per data point, accounting for padding
    const calculated = Math.max(12, Math.floor((width - 40) / 10));
    numDataPoints.value = Math.min(calculated, 104); // Cap at 104 weeks (2 years)
};

const chartOptions = ref(null);

const chartData = computed(() => {
    if (!aggState.data.value?.result || aggState.data.value.result.length === 0) {
        return null;
    }

    const allData = [...aggState.data.value.result];
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
            const date = new Date(item._id);
            return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' });
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

const formattedTimestamp = ref(aggState.data.value?.timestamp ? dateUtil.getFormattedTimeAgo(aggState.data.value.timestamp) : null);

function setChartOptions() {
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
                ticks: {
                    color: textColorSecondary,
                    callback: function (value) {
                        return new Intl.NumberFormat('en-IN', {
                            style: 'currency',
                            currency: 'INR',
                            minimumFractionDigits: 0,
                            maximumFractionDigits: 0
                        }).format(value);
                    }
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
                        const startFormatted = startDate.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
                        const endFormatted = endDate.toLocaleDateString('en-IN', { month: 'short', day: '2-digit', year: 'numeric' });
                        return [`${startFormatted} - ${endFormatted}`];
                    },
                    label: function (context) {
                        return (
                            'Closing Balance: ' +
                            new Intl.NumberFormat('en-IN', {
                                style: 'currency',
                                currency: 'INR',
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            }).format(context.parsed.y)
                        );
                    }
                }
            }
        }
    };
}

onMounted(() => {
    calculateDataPoints();
    chartOptions.value = setChartOptions();

    resizeObserver = new ResizeObserver(() => {
        calculateDataPoints();
    });

    if (widgetContainer.value) {
        resizeObserver.observe(widgetContainer.value);
    }

    intervalId = setInterval(() => {
        formattedTimestamp.value = dateUtil.getFormattedTimeAgo(aggState.data.value.timestamp);
    }, 60 * 1000);
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = setChartOptions();
});

onBeforeUnmount(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    }
    if (intervalId) {
        clearInterval(intervalId);
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
            <div v-if="aggState.error.value" class="mb-4">
                <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                <div class="text-red-500 dark:text-red-300 text-xs">{{ aggState.error.value }}</div>
            </div>

            <div v-else>
                <div class="flex items-center justify-between mb-4">
                    <div class="font-semibold text-xl">Closing Balances by Week</div>
                    <button
                        @click="aggState.error.value ? handleRetry() : handleUpdate()"
                        :disabled="aggState.isLoading.value || aggState.isUpdating.value"
                        class="p-2 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
                        :title="aggState.error.value ? 'Retry' : 'Re-calculate'"
                    >
                        <i :class="['pi', aggState.isUpdating.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                    </button>
                </div>

                <div v-if="aggState.isLoading.value" class="flex items-center justify-center h-80">
                    <div class="text-center">
                        <i class="pi pi-spin pi-spinner text-2xl text-primary mb-2"></i>
                        <div class="text-muted-color">Loading...</div>
                    </div>
                </div>

                <div v-else-if="!chartData || chartData.labels.length === 0" class="flex items-center justify-center h-80">
                    <div class="text-center text-muted-color">No weekly balance data available</div>
                </div>

                <div v-else>
                    <Chart type="line" :data="chartData" :options="chartOptions" class="h-80" />
                    <div class="text-xs text-muted-color text-right mt-2">{{ aggState.isUpdating.value ? 'Updating ...' : 'Updated ' + formattedTimestamp }}</div>
                </div>
            </div>
        </div>
    </div>
</template>
