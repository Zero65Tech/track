import { aggregationService } from '@/service/aggregationService';
import { triggerService } from '@/service/triggerService';
import { useProfileStore } from '@/stores/profile.store';
import { dateUtil } from '@shared/utils';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { ref, watch } from 'vue';

const PENDING_TRIGGER_TIMEOUT_MS = 60 * 1000;
const TIME_UPDATE_INTERVAL_MS = 60 * 1000;

export const useAggregationStore = defineStore('aggregation', () => {
    const toast = useToast();
    const profileStore = useProfileStore();
    let abortController = new AbortController();
    let globalIntervalId = null;

    // States

    const aggregations = {}; // State structure: { aggregationName: { data, dataTimestamp, dataUpdatedTimeAgo, isUpdating, isLoading, error, _timeoutId } }

    // Getters

    function getAggregationState(aggregationName) {
        if (!aggregations[aggregationName]) {
            aggregations[aggregationName] = {
                _timeoutId: null,
                data: ref(null),
                dataTimestamp: ref(null),
                dataUpdatedTimeAgo: ref(null),
                isUpdating: ref(false),
                isLoading: ref(false),
                error: ref(null)
            };

            if (!globalIntervalId) {
                globalIntervalId = setInterval(() => {
                    Object.values(aggregations).forEach((aggregation) => {
                        if (aggregation.dataTimestamp.value) {
                            aggregation.dataUpdatedTimeAgo.value = dateUtil.getFormattedTimeAgo(aggregation.dataTimestamp.value);
                        }
                    });
                }, TIME_UPDATE_INTERVAL_MS);
            }

            if (profileStore.activeProfile) {
                fetchAggregation(aggregationName);
            }
        }
        return aggregations[aggregationName];
    }

    // Actions

    watch(
        () => profileStore.activeProfile,
        () => {
            // Abort all in-flight requests
            abortController.abort();
            abortController = new AbortController();

            Object.keys(aggregations).forEach((aggregationName) => {
                const state = aggregations[aggregationName];
                _clearPendingTrigger(aggregationName);
                if (profileStore.activeProfile) {
                    fetchAggregation(aggregationName);
                } else {
                    state.data.value = null;
                    state.dataTimestamp.value = null;
                    state.dataUpdatedTimeAgo.value = null;
                    state.isLoading.value = false;
                    state.error.value = null;
                }
            });
        }
    );

    async function fetchAggregation(aggregationName) {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            toast.add({
                severity: 'error',
                summary: 'Refresh failed',
                detail: 'Kindly select a profile to fetch aggregation data',
                life: 3000
            });
            return;
        }

        const state = aggregations[aggregationName];
        state.isLoading.value = true;
        state.error.value = null;

        try {
            const { result, timestamp } = await aggregationService.getNamedAggregationResult({ profileId, aggregationName }, abortController.signal);
            state.data.value = result;
            state.dataTimestamp.value = timestamp;
            state.dataUpdatedTimeAgo.value = dateUtil.getFormattedTimeAgo(timestamp);
        } catch (err) {
            state.error.value = err.message;
            console.log(err);
        } finally {
            state.isLoading.value = false;
        }
    }

    async function triggerAggregationUpdate(aggregationName) {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: 'Kindly select a profile to trigger aggregation update',
                life: 3000
            });
            return;
        }

        try {
            _setPendingTrigger(aggregationName);
            await triggerService.createDataAggregationTrigger(profileId, aggregationName);
        } catch (err) {
            _clearPendingTrigger(aggregationName);
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
        _clearPendingTrigger(aggregationName);
        toast.add({
            severity: 'error',
            summary: 'Update failed',
            detail: message,
            life: 3000
        });
    }

    async function notifyTriggerCompleted(aggregationName) {
        _clearPendingTrigger(aggregationName);
        if (aggregations[aggregationName]) {
            await fetchAggregation(aggregationName);
        }
    }

    function _setPendingTrigger(aggregationName) {
        const state = aggregations[aggregationName];
        state.isUpdating.value = true;

        if (state._timeoutId) {
            clearTimeout(state._timeoutId);
        }

        state._timeoutId = setTimeout(() => {
            _clearPendingTrigger(aggregationName);
        }, PENDING_TRIGGER_TIMEOUT_MS);
    }

    function _clearPendingTrigger(aggregationName) {
        const state = aggregations[aggregationName];
        state.isUpdating.value = false;

        if (state._timeoutId) {
            clearTimeout(state._timeoutId);
            state._timeoutId = null;
        }
    }

    return {
        // Getters
        getAggregationState,

        // Actions
        fetchAggregation,
        triggerAggregationUpdate,
        notifyTriggerCompleted,
        notifyTriggerFailed
    };
});
