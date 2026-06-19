import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

import { TriggerState, TriggerType } from '@shared/enums';

import { aggregationService } from '@/service/aggregationService';
import { triggerService } from '@/service/triggerService';

import { useProfileStore } from '@/stores/profile.store';
import { useTriggerStore } from '@/stores/trigger.store';

export const useAggregationStore = defineStore('aggregation', () => {
    const toast = useToast();
    const profileStore = useProfileStore();
    const triggerStore = useTriggerStore();

    let abortController = new AbortController();

    function _stateKey(aggregationName, params = {}) {
        return `${aggregationName}:${JSON.stringify(params)}`;
    }

    // States

    const aggregations = {}; // State structure: { stateKey: { _timeoutId, _name, _params, data, dataTimestamp, isUpdating, isLoading, error } }

    // Getters

    function getAggregationState(aggregationName, params = {}) {
        const key = _stateKey(aggregationName, params);
        if (!aggregations[key]) {
            aggregations[key] = {
                _name: aggregationName,
                _params: params,
                data: ref([]),
                dataTimestamp: ref(null),
                isUpdateAvailable: (() => {
                    if (Object.keys(params).length === 0) {
                        // TODO: Check if there is any book with data update after the aggregation timestamp.
                        return computed(() => false);
                    } else if (params.type) {
                        // TODO: Check if the type has a data update after the aggregation timestamp.
                        return computed(() => false);
                    } else if (params.bookId) {
                        // TODO: Check if the book with bookId has a data update after the aggregation timestamp.
                        return computed(() => false);
                    } else if (params.headId) {
                        // TODO: Check if the head with headId has a data update after the aggregation timestamp.
                        return computed(() => false);
                    } else if (params.tagId) {
                        // TODO: Check if the tag with tagId has a data update after the aggregation timestamp.
                        return computed(() => false);
                    } else if (params.sourceId) {
                        // TODO: Check if the source with sourceId has a data update after the aggregation timestamp.
                        return computed(() => false);
                    } else {
                        throw new Error('Unexpected Scenario');
                    }
                })(),
                isUpdating: computed(
                    // prettier-ignore
                    () => triggerStore.triggers.find((trigger) =>
                        trigger.type === TriggerType.DATA_AGGREGATION.id
                            && _stateKey(trigger.aggregationName, trigger.aggregationParams) === key
                            && [TriggerState.QUEUED.id, TriggerState.RUNNING.id].includes(trigger.state)
                    ) !== undefined
                ),
                isRefreshAvailable: ref(false),
                isLoading: ref(false),
                error: ref(null)
            };

            if (profileStore.activeProfile) {
                fetchAggregation(key);
            }
        }
        return { key, ...aggregations[key] };
    }

    // Internal Functions

    watch(
        () => profileStore.activeProfile,
        () => {
            // Abort all in-flight requests
            abortController.abort();
            abortController = new AbortController();

            Object.entries(aggregations).forEach((entry) => {
                const [key, state] = entry;
                if (profileStore.activeProfile) {
                    fetchAggregation(key);
                } else {
                    state.data.value = null;
                    state.dataTimestamp.value = null;
                    state.isLoading.value = false;
                    state.error.value = null;
                }
            });
        }
    );

    triggerService.onAsyncResponse(async (profileId, trigger) => {
        if (profileId !== profileStore.activeProfile?.id) {
            return;
        }

        if (trigger.type !== TriggerType.DATA_AGGREGATION.id) {
            return;
        }

        const stateKey = _stateKey(trigger.aggregationName, trigger.aggregationParams);
        if (!aggregations[stateKey]) {
            return;
        }

        if (trigger.state === TriggerState.COMPLETED.id) {
            await fetchAggregation(stateKey);
        } else if (trigger.state === TriggerState.FAILED.id) {
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: trigger.message,
                life: 3000
            });
        }
    });

    // Actions

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
            const { result, timestamp } = await aggregationService.getAggregationResult(profileId, state._name, state._params);
            state.data.value = result;
            state.dataTimestamp.value = timestamp;
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
            await triggerService.createDataAggregationTrigger(profileId, state._name, state._params);
        } catch (err) {
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: err.message,
                life: 3000
            });
            console.log(err);
        }
    }

    return {
        // Getters
        getAggregationState,

        // Actions
        fetchAggregation,
        triggerAggregationUpdate
    };
});
