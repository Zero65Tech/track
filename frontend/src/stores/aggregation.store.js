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

    function _stateKey(aggregationName, params) {
        return `${aggregationName}:${JSON.stringify(params)}`;
    }

    // States

    const aggregations = {}; // State structure: { stateKey: { _name, _params, _inFlightRequest, data, dataTimestamp, isLoading, isRefreshAvailable, isUpdating, isUpdateAvailable, error } }

    function _isUpdating(stateKey) {
        return computed(
            // prettier-ignore
            () => triggerStore.triggers.find((trigger) =>
                trigger.type === TriggerType.DATA_AGGREGATION.id
                && _stateKey(trigger.aggregationName, trigger.aggregationParams) === stateKey
                && [TriggerState.QUEUED.id, TriggerState.RUNNING.id].includes(trigger.state)
            ) !== undefined
        );
    }

    function _isUpdateAvailable(aggregationName, aggregationParams) {
        if (Object.keys(aggregationParams).length === 0) {
            // TODO: Check if there is any book with data update after the aggregation timestamp.
            return computed(() => false);
        } else if (aggregationParams.type) {
            // TODO: Check if the type has a data update after the aggregation timestamp.
            return computed(() => false);
        } else if (aggregationParams.bookId) {
            // TODO: Check if the book with bookId has a data update after the aggregation timestamp.
            return computed(() => false);
        } else if (aggregationParams.headId) {
            // TODO: Check if the head with headId has a data update after the aggregation timestamp.
            return computed(() => false);
        } else if (aggregationParams.tagId) {
            // TODO: Check if the tag with tagId has a data update after the aggregation timestamp.
            return computed(() => false);
        } else if (aggregationParams.sourceId) {
            // TODO: Check if the source with sourceId has a data update after the aggregation timestamp.
            return computed(() => false);
        } else {
            throw new Error('Unexpected Scenario');
        }
    }

    // Getters

    function getAggregationState(aggregationName, aggregationParams = {}) {
        const key = _stateKey(aggregationName, aggregationParams);
        if (!aggregations[key]) {
            aggregations[key] = {
                _name: aggregationName,
                _params: aggregationParams,
                _inFlightRequest: null,
                data: ref([]),
                dataTimestamp: ref(null),
                isLoading: ref(false),
                isRefreshAvailable: ref(Boolean(profileStore.activeProfile)),
                isTriggering: ref(false),
                isUpdating: _isUpdating(key),
                isUpdateAvailable: _isUpdateAvailable(aggregationName, aggregationParams),
                error: ref(null)
            };
        }
        return { key, ...aggregations[key] };
    }

    // Internal Functions

    watch(
        () => profileStore.activeProfile,
        async () => {
            for (const state of Object.values(aggregations)) {
                if (state._inFlightRequest) {
                    await state._inFlightRequest;
                }
                state._inFlightRequest = null;
                state.data.value = [];
                state.dataTimestamp.value = null;
                state.isRefreshAvailable.value = Boolean(profileStore.activeProfile);
                state.error.value = null;
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

    async function _createDataAggregationTrigger(profileId, state) {
        state.isTriggering.value = true;
        state.error.value = null;

        try {
            await triggerService.createDataAggregationTrigger(profileId, state._name, state._params);
        } catch (err) {
            state.error.value = err.message;
            console.log(err);
        } finally {
            state.isTriggering.value = false;
        }
    }

    // Actions

    async function refreshAggregation(stateKey) {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            throw new Error('No profile selected');
        }

        const state = aggregations[stateKey];

        state.isRefreshAvailable.value = false;

        if (state.isLoading.value === true) {
            throw new Error(`A request already in-flight for ${stateKey}`);
        }

        state._inFlightRequest = _fetchAggregation(profileId, state);
    }

    async function triggerAggregationUpdate(stateKey) {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            throw new Error('No profile selected');
        }

        const state = aggregations[stateKey];

        if (state.isTriggering.value === true) {
            throw new Error('Trigger already in flight');
        }

        if (state.isUpdating.value === true) {
            throw new Error('Update already in progress');
        }

        state._inFlightRequest = _createDataAggregationTrigger(profileId, state);
    }

    return {
        // Getters
        getAggregationState,

        // Actions
        refreshAggregation,
        triggerAggregationUpdate
    };
});
