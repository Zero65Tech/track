import { aggregationService } from '@/service/aggregationService';
import { triggerService } from '@/service/triggerService';
import { useProfileStore } from '@/stores/profile.store';
import { formatUtil } from '@shared/utils';
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

    function _stateKey(aggregationName, params) {
        return params ? `${aggregationName}:${JSON.stringify(params)}` : aggregationName;
    }

    // States

    const aggregations = {}; // State structure: { stateKey: { _timeoutId, _name, _params, data, dataTimestamp, dataUpdatedTimeAgo, isUpdating, isLoading, error } }

    // Getters

    function getAggregationState(aggregationName, params) {
        const key = _stateKey(aggregationName, params);
        if (!aggregations[key]) {
            aggregations[key] = {
                _timeoutId: null,
                _name: aggregationName,
                _params: params,
                data: ref([]),
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
                            aggregation.dataUpdatedTimeAgo.value = formatUtil.formatTimeAgo(aggregation.dataTimestamp.value);
                        }
                    });
                }, TIME_UPDATE_INTERVAL_MS);
            }

            if (profileStore.activeProfile) {
                fetchAggregation(key);
            }
        }
        return { key, ...aggregations[key] };
    }

    // Actions

    watch(
        () => profileStore.activeProfile,
        () => {
            // Abort all in-flight requests
            abortController.abort();
            abortController = new AbortController();

            Object.entries(aggregations).forEach((entry) => {
                const [key, state] = entry;
                _clearPendingTrigger(key);
                if (profileStore.activeProfile) {
                    fetchAggregation(key);
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

    async function fetchAggregation(stateKey) {
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

        const state = aggregations[stateKey];
        state.isLoading.value = true;
        state.error.value = null;

        try {
            const { result, timestamp } = await aggregationService.getNamedAggregationResult({ profileId, aggregationName: state._name, aggregationParams: state._params }, abortController.signal);
            state.data.value = result;
            state.dataTimestamp.value = timestamp;
            state.dataUpdatedTimeAgo.value = formatUtil.formatTimeAgo(timestamp);
        } catch (err) {
            state.error.value = err.message;
            console.log(err);
        } finally {
            state.isLoading.value = false;
        }
    }

    async function triggerAggregationUpdate(stateKey) {
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

        const state = aggregations[stateKey];

        try {
            _setPendingTrigger(stateKey);
            await triggerService.createDataAggregationTrigger(profileId, state._name, state._params);
        } catch (err) {
            _clearPendingTrigger(stateKey);
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: err.message,
                life: 3000
            });
            console.log(err);
        }
    }

    function notifyTriggerFailed(aggregationName, aggregationParams, message) {
        const stateKey = _stateKey(aggregationName, aggregationParams);
        if (aggregations[stateKey]) {
            _clearPendingTrigger(stateKey);
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: message,
                life: 3000
            });
        }
    }

    async function notifyTriggerCompleted(aggregationName, aggregationParams) {
        const stateKey = _stateKey(aggregationName, aggregationParams);
        if (aggregations[stateKey]) {
            _clearPendingTrigger(stateKey);
            await fetchAggregation(stateKey);
        }
    }

    function _setPendingTrigger(stateKey) {
        const state = aggregations[stateKey];
        state.isUpdating.value = true;

        if (state._timeoutId) {
            clearTimeout(state._timeoutId);
        }

        state._timeoutId = setTimeout(() => {
            _clearPendingTrigger(stateKey);
        }, PENDING_TRIGGER_TIMEOUT_MS);
    }

    function _clearPendingTrigger(stateKey) {
        const state = aggregations[stateKey];
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
