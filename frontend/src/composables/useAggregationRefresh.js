import { isRef, watch } from 'vue';

import { useAggregationStore } from '@/stores/aggregation.store';

export function useAggregationRefresh(aggregationState) {
    const aggregationStore = useAggregationStore();

    // TODO: Remove this whenever possible
    if (isRef(aggregationState)) {
        aggregationState = aggregationState.value;
    }

    watch(
        () => aggregationState.isRefreshAvailable.value,
        async (isRefreshAvailable) => {
            if (isRefreshAvailable === true) {
                await aggregationStore.refreshAggregation(aggregationState.key);
            }
        },
        { immediate: true }
    );
}
