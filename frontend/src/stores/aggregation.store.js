import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { useProfileStore } from '@/stores/profile.store';
import { aggregationService } from '@/service/aggregationService';

export const useAggregationStore = defineStore('aggregation', () => {
    const profileStore = useProfileStore();

    // States

    const aggregations = ref({}); // State structure: { aggregationName: { data, isLoading, error } }

    // Getters

    function getAggregationState(aggregationName) {
        if (!aggregations.value[aggregationName]) {
            aggregations.value[aggregationName] = {
                data: null,
                isLoading: false,
                error: null
            };
        }
        return aggregations.value[aggregationName];
    }

    function getAggregationData(aggregationName) {
        return computed(() => {
            return getAggregationState(aggregationName).data;
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
            clearAllAggregations();
        }
    );

    async function fetchAggregation(aggregationName) {
        const profileId = profileStore.active?.id;
        if (!profileId) {
            throw new Error('No active profile selected');
        }

        const state = getAggregationState(aggregationName);

        state.isLoading = true;
        state.error = null;

        try {
            const result = await aggregationService.getNamedAggregationResult(profileId, aggregationName);
            state.data = result;
        } catch (err) {
            state.error = err.message;
            throw err;
        } finally {
            state.isLoading = false;
        }
    }

    function clearAllAggregations() {
        aggregations.value = {};
    }

    return {
        // State
        aggregations,

        // Getters
        getAggregationData,
        isAggregationLoading,
        getAggregationError,

        // Actions
        fetchAggregation,
        clearAllAggregations
    };
});
