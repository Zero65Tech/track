<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useProfileStore } from '@/stores/profile.store';
import { useAggregationStore } from '@/stores/aggregation.store';

const profileStore = useProfileStore();
const aggregationStore = useAggregationStore();
const currentTime = ref(new Date());
let intervalId = null;

const AGGREGATIONS = [
    {
        name: 'balances_by_book',
        title: 'Balance by Book',
        icon: 'pi-shopping-cart',
        iconColor: 'text-blue-500',
        bgColor: 'bg-blue-100',
        hoverBg: 'hover:bg-blue-50',
        darkBgColor: 'dark:bg-blue-400/10',
        darkHoverBg: 'dark:hover:bg-blue-400/10'
    },
    {
        name: 'balances_by_source',
        title: 'Balance by Source',
        icon: 'pi-dollar',
        iconColor: 'text-orange-500',
        bgColor: 'bg-orange-100',
        hoverBg: 'hover:bg-orange-50',
        darkBgColor: 'dark:bg-orange-400/10',
        darkHoverBg: 'dark:hover:bg-orange-400/10'
    }
];

const aggregations = AGGREGATIONS.map((agg) => {
    const aggState = aggregationStore.getAggregationState(agg.name);

    const totalBalance = computed(() => {
        if (!aggState.data.value?.result) {
            return 0;
        }
        return aggState.data.value.result.reduce((sum, item) => sum + item.balance, 0);
    });

    const formattedBalance = computed(() => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(totalBalance.value);
    });

    const formattedTimestamp = computed(() => {
        if (!aggState.data.value?.timestamp) return '';

        const diffMs = currentTime.value - aggState.data.value.timestamp;

        const diffSeconds = Math.floor(diffMs / 1000);
        if (diffSeconds < 60) return 'Just now';

        const diffMinutes = Math.floor(diffSeconds / 60);
        if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;

        const diffHours = Math.floor(diffMinutes / 60);
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

        const diffDays = Math.floor(diffHours / 24);
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    });

    const handleRetry = async () => {
        await aggregationStore.fetchAggregation(agg.name);
    };

    const handleUpdate = async () => {
        await aggregationStore.triggerAggregationUpdate(agg.name);
    };

    return {
        ...agg,
        totalBalance,
        formattedBalance,
        formattedTimestamp,
        isUpdating: aggState.isUpdating,
        isLoading: aggState.isLoading,
        error: aggState.error,
        handleRetry,
        handleUpdate
    };
});

onMounted(() => {
    if (profileStore.active)
        for (const agg of AGGREGATIONS) {
            aggregationStore.fetchAggregation(agg.name);
        }

    intervalId = setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
});

watch(
    () => profileStore.active,
    (activeProfile) => {
        if (activeProfile)
            for (const agg of AGGREGATIONS) {
                aggregationStore.fetchAggregation(agg.name);
            }
    }
);

onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>

<template>
    <div v-for="agg in aggregations" :key="agg.name" class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div v-if="agg.error.value" class="mb-4">
                <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                <div class="text-red-500 dark:text-red-300 text-xs">{{ agg.error.value }}</div>
            </div>
            <div v-else class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">{{ agg.title }}</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ agg.formattedBalance.value }}</div>
                </div>
                <div :class="['flex items-center justify-center rounded-border', agg.bgColor, agg.darkBgColor]" style="width: 2.5rem; height: 2.5rem">
                    <i :class="['pi', agg.icon, agg.iconColor, 'text-xl!']"></i>
                </div>
            </div>
            <div class="flex items-center justify-between gap-2">
                <span class="text-primary font-medium">
                    {{ agg.isLoading.value ? 'Loading...' : agg.isUpdating.value ? 'Updating...' : agg.formattedTimestamp.value }}
                </span>
                <button
                    @click="agg.error.value ? agg.handleRetry() : agg.handleRefresh()"
                    :disabled="agg.isLoading.value || agg.isUpdating.value"
                    :class="['p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed', agg.hoverBg, agg.darkHoverBg]"
                    :title="agg.error.value ? 'Retry' : 'Re-calculate'"
                >
                    <i :class="['pi', agg.isUpdating.value ? 'pi-spinner animate-spin' : 'pi-refresh', agg.iconColor, 'text-sm!']"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Customers</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">28441</div>
                </div>
                <div class="flex items-center justify-center bg-cyan-100 dark:bg-cyan-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-users text-cyan-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-primary font-medium">520 </span>
            <span class="text-muted-color">newly registered</span>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Comments</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">152 Unread</div>
                </div>
                <div class="flex items-center justify-center bg-purple-100 dark:bg-purple-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-comment text-purple-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-primary font-medium">85 </span>
            <span class="text-muted-color">responded</span>
        </div>
    </div>
</template>
