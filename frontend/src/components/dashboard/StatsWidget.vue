<template>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Total Balance</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">{{ formattedBalance }}</div>
                </div>
                <div class="flex items-center justify-center bg-blue-100 dark:bg-blue-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-shopping-cart text-blue-500 text-xl!"></i>
                </div>
            </div>
            <div class="flex items-center justify-between gap-2">
                <span class="text-primary font-medium">{{ isLoading ? 'Loading...' : formattedTimestamp }} </span>
                <button @click="handleRefresh" :disabled="isLoading || isRefreshing" class="p-1 hover:bg-blue-50 dark:hover:bg-blue-400/10 rounded-border transition-colors disabled:opacity-50 disabled:cursor-not-allowed" title="Refresh data">
                    <i :class="['pi', isRefreshing ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-blue-500 text-sm!']"></i>
                </button>
            </div>
        </div>
    </div>
    <div class="col-span-12 lg:col-span-6 xl:col-span-3">
        <div class="card mb-0">
            <div class="flex justify-between mb-4">
                <div>
                    <span class="block text-muted-color font-medium mb-4">Revenue</span>
                    <div class="text-surface-900 dark:text-surface-0 font-medium text-xl">$2.100</div>
                </div>
                <div class="flex items-center justify-center bg-orange-100 dark:bg-orange-400/10 rounded-border" style="width: 2.5rem; height: 2.5rem">
                    <i class="pi pi-dollar text-orange-500 text-xl!"></i>
                </div>
            </div>
            <span class="text-primary font-medium">%52+ </span>
            <span class="text-muted-color">since last week</span>
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
<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useProfileStore } from '@/stores/profile.store';
import { useAggregationStore } from '@/stores/aggregation.store';
import { triggerService } from '@/service/triggerService';

const toast = useToast();
const profileStore = useProfileStore();
const aggregationStore = useAggregationStore();

const aggregationData = aggregationStore.getAggregationData('balances_by_book');
const isLoading = aggregationStore.isAggregationLoading('balances_by_book');
const isRefreshing = ref(false);
const currentTime = ref(new Date());
let intervalId = null;

const totalBalance = computed(() => {
    if (!aggregationData.value?.result) return 0;
    return aggregationData.value.result.reduce((sum, item) => sum + item.balance, 0);
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
    // Access currentTime to create dependency for reactivity
    currentTime.value;

    if (!aggregationData.value?.timestamp) return 'Never fetched';

    const fetchTime = new Date(aggregationData.value.timestamp);
    const now = new Date();
    const diffMs = now - fetchTime;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
});

async function handleRefresh() {
    if (!profileStore.active?.id) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: 'No active profile selected',
            life: 3000
        });
        return;
    }

    isRefreshing.value = true;
    try {
        await triggerService.createDataAggregationTrigger(profileStore.active.id, 'balances_by_book');
        toast.add({
            severity: 'success',
            summary: 'Success',
            detail: 'Refresh triggered successfully',
            life: 3000
        });
        // Optionally refetch the aggregation data
        await aggregationStore.fetchAggregation('balances_by_book');
    } catch (err) {
        toast.add({
            severity: 'error',
            summary: 'Error',
            detail: err.message || 'Failed to trigger refresh',
            life: 3000
        });
        console.error('Failed to trigger refresh:', err);
    } finally {
        isRefreshing.value = false;
    }
}

onMounted(async () => {
    try {
        await aggregationStore.fetchAggregation('balances_by_book');
    } catch (err) {
        console.error('Failed to fetch balances_by_book aggregation:', err);
    }

    // Update currentTime every second to refresh the relative timestamp
    intervalId = setInterval(() => {
        currentTime.value = new Date();
    }, 1000);
});

// Watch for profile changes and refetch aggregation
watch(
    () => profileStore.active?.id,
    async (newProfileId) => {
        if (newProfileId) {
            try {
                await aggregationStore.fetchAggregation('balances_by_book');
            } catch (err) {
                console.error('Failed to fetch balances_by_book aggregation:', err);
            }
        }
    }
);

onBeforeUnmount(() => {
    if (intervalId) {
        clearInterval(intervalId);
    }
});
</script>
