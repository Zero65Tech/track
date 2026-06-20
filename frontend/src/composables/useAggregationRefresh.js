import { toValue, watch } from 'vue';

import { useAggregationStore } from '@/stores/aggregation.store';

export function useAggregationRefresh(aggregationState) {
    const aggregationStore = useAggregationStore();

    watch(
        () => {
            const state = toValue(aggregationState);
            return [state.key, state.isRefreshAvailable.value];
        },
        async ([stateKey, isRefreshAvailable]) => {
            if (isRefreshAvailable === true) {
                await aggregationStore.refreshAggregation(stateKey);
            }
        },
        { immediate: true }
    );
}
