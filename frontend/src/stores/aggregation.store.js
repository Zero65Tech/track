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

    function _stateKey(aggregationName, params = {}) {
        return `${aggregationName}:${JSON.stringify(params)}`;
    }

    // States

    const aggregations = {}; // State structure: { stateKey: { _name, _params, _inFlightRequest, data, dataTimestamp, isUpdateAvailable, isUpdating, isRefreshAvailable, isLoading, error } }

    function _isUpdateAvailable(aggregationName, params = {}) {
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
    }

    function _isUpdating(key) {
        return computed(
            // prettier-ignore
            () => triggerStore.triggers.find((trigger) =>
                trigger.type === TriggerType.DATA_AGGREGATION.id
                && _stateKey(trigger.aggregationName, trigger.aggregationParams) === key
                && [TriggerState.QUEUED.id, TriggerState.RUNNING.id].includes(trigger.state)
            ) !== undefined
        );
    }

    // Getters

    function getAggregationState(aggregationName, params = {}) {
        const key = _stateKey(aggregationName, params);
        if (!aggregations[key]) {
            aggregations[key] = {
                _name: aggregationName,
                _params: params,
                _inFlightRequest: null,
                data: ref([]),
                dataTimestamp: ref(null),
                isLoading: ref(false),
                isRefreshAvailable: ref(true),
                isUpdating: _isUpdating(key),
                isUpdateAvailable: _isUpdateAvailable(aggregationName, params),
                error: ref(null)
            };
        }
        return { key, ...aggregations[key] };
    }

    // Internal Functions

    watch(
        () => profileStore.activeProfile,
        async () => {
            for (const [key, state] of Object.entries(aggregations)) {
                if (state._inFlightRequest) {
                    await state._inFlightRequest;
                }
                delete aggregations[key];
            }
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
        const state = aggregations[stateKey];
        if (state === undefined) {
            return;
        }

        if (trigger.state === TriggerState.FAILED.id) {
            toast.add({
                severity: 'error',
                summary: 'Update failed',
                detail: trigger.message,
                life: 3000
            });
        } else if (trigger.state === TriggerState.COMPLETED.id) {
            state.isRefreshAvailable.value = true;
        }
    });

    async function _fetchAggregation(profileId, state) {
        state.isLoading.value = true;
        state.isRefreshAvailable.value = false;
        state.error.value = null;

        try {
            const apiResponseData = await aggregationService.getAggregationResult(profileId, state._name, state._params);
            state.data.value = apiResponseData.result;
            state.dataTimestamp.value = apiResponseData.timestamp;
        } catch (err) {
            state.error.value = err.message;
            console.log(err);
        } finally {
            state.isLoading.value = false;
        }
    }

    // Actions

    async function fetchAggregation(stateKey) {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            throw new Error('No profile selected');
        }

        const state = aggregations[stateKey];
        if (state.isLoading.value === true) {
            return state._inFlightRequest;
        }

        state._inFlightRequest = _fetchAggregation();
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
