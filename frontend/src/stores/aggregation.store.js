import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { useProfileStore } from '@/stores/profile.store';
import { triggerService } from '@/service/triggerService';
import { aggregationService } from '@/service/aggregationService';

export const useAggregationStore = defineStore('aggregation', () => {
    const toast = useToast();
    const profileStore = useProfileStore();

    const PENDING_TRIGGER_TIMEOUT_MS = 60 * 1000;
    const pendingTriggerTimeouts = {};

    // States

    const aggregations = {}; // State structure: { aggregationName: { data, isUpdating, isLoading, error } }

    // Getters

    function getAggregationState(aggregationName) {
        if (!aggregations[aggregationName]) {
            aggregations[aggregationName] = {
                data: ref(null),
                isUpdating: ref(false),
                isLoading: ref(false),
                error: ref(null)
            };
            fetchAggregation(aggregationName);
        }
        return aggregations[aggregationName];
    }

    // Actions

    watch(
        () => profileStore.active?.id,
        () => {
            Object.keys(aggregations).forEach((key) => {
                delete aggregations[key];
            });
            // Clear all pending trigger timeouts
            Object.values(pendingTriggerTimeouts).forEach((timeoutId) => {
                clearTimeout(timeoutId);
            });
            Object.keys(pendingTriggerTimeouts).forEach((key) => {
                delete pendingTriggerTimeouts[key];
            });
        }
    );

    async function fetchAggregation(aggregationName) {
        const profileId = profileStore.active?.id;
        if (!profileId) {
            throw new Error('No profile selected');
        }

        const state = getAggregationState(aggregationName);
        state.isLoading.value = true;
        state.error.value = null;

        try {
            let { result, timestamp } = await aggregationService.getNamedAggregationResult(profileId, aggregationName);
            if (timestamp) timestamp = new Date(timestamp);
            state.data.value = { result, timestamp };
        } catch (err) {
            state.error.value = err.message;
            console.log(err);
        } finally {
            state.isLoading.value = false;
        }
    }

    async function triggerAggregationUpdate(aggregationName) {
        const profileId = profileStore.active?.id;
        if (!profileId) {
            throw new Error('No profile selected');
        }

        try {
            setPendingTrigger(aggregationName);
            await triggerService.createDataAggregationTrigger(profileId, aggregationName);
        } catch (err) {
            clearPendingTrigger(aggregationName);
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: err.message,
                life: 3000
            });
            console.log(err);
        }
    }

    function notifyTriggerFailed(aggregationName, message) {
        clearPendingTrigger(aggregationName);
        toast.add({
            severity: 'error',
            summary: 'Update failed',
            detail: message,
            life: 3000
        });
    }

    async function notifyTriggerCompleted(aggregationName) {
        clearPendingTrigger(aggregationName);
        await fetchAggregation(aggregationName);
    }

    function setPendingTrigger(aggregationName) {
        const state = getAggregationState(aggregationName);
        state.isUpdating.value = true;

        if (pendingTriggerTimeouts[aggregationName]) {
            clearTimeout(pendingTriggerTimeouts[aggregationName]);
        }

        pendingTriggerTimeouts[aggregationName] = setTimeout(() => {
            clearPendingTrigger(aggregationName);
        }, PENDING_TRIGGER_TIMEOUT_MS);
    }

    function clearPendingTrigger(aggregationName) {
        const state = getAggregationState(aggregationName);
        state.isUpdating.value = false;

        if (pendingTriggerTimeouts[aggregationName]) {
            clearTimeout(pendingTriggerTimeouts[aggregationName]);
            delete pendingTriggerTimeouts[aggregationName];
        }
    }

    return {
        // Getters
        getAggregationState,

        // Actions
        triggerAggregationUpdate,
        notifyTriggerCompleted,
        notifyTriggerFailed
    };
});
