import { ref, computed, watch } from 'vue';
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

    const aggregations = ref({}); // State structure: { aggregationName: { data, isUpdating, isLoading, error } }

    // Getters

    function getAggregationState(aggregationName) {
        if (!aggregations.value[aggregationName]) {
            aggregations.value[aggregationName] = {
                data: null,
                isUpdating: false,
                isLoading: false,
                error: null
            };
            fetchAggregation(aggregationName);
        }
        return aggregations.value[aggregationName];
    }

    function getAggregationData(aggregationName) {
        return computed(() => {
            return getAggregationState(aggregationName).data;
        });
    }

    function isAggregationUpdating(aggregationName) {
        return computed(() => {
            return getAggregationState(aggregationName).isUpdating;
        });
    }

    function isAggregationLoading(aggregationName) {
        return computed(() => {
            return getAggregationState(aggregationName).isLoading;
        });
    }

    function getAggregationError(aggregationName) {
        return computed(() => {
            return getAggregationState(aggregationName).error;
        });
    }

    // Actions

    watch(
        () => profileStore.active?.id,
        () => {
            aggregations.value = {};
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
        state.isLoading = true;
        state.error = null;

        try {
            state.data = await aggregationService.getNamedAggregationResult(profileId, aggregationName);
        } catch (err) {
            state.error = err.message;
            console.log(err);
        } finally {
            state.isLoading = false;
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
        state.isUpdating = true;

        if (pendingTriggerTimeouts[aggregationName]) {
            clearTimeout(pendingTriggerTimeouts[aggregationName]);
        }

        pendingTriggerTimeouts[aggregationName] = setTimeout(() => {
            clearPendingTrigger(aggregationName);
        }, PENDING_TRIGGER_TIMEOUT_MS);
    }

    function clearPendingTrigger(aggregationName) {
        const state = getAggregationState(aggregationName);
        state.isUpdating = false;

        if (pendingTriggerTimeouts[aggregationName]) {
            clearTimeout(pendingTriggerTimeouts[aggregationName]);
            delete pendingTriggerTimeouts[aggregationName];
        }
    }

    return {
        // Getters
        getAggregationData,
        isAggregationLoading,
        isAggregationUpdating,
        getAggregationError,

        // Actions
        triggerAggregationUpdate,
        notifyTriggerCompleted,
        notifyTriggerFailed
    };
});
