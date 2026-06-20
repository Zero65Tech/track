import { watch } from 'vue';

import { useAggregationStore } from '@/stores/aggregation.store';

export function useAggregationRefresh(aggregationState) {
    const aggregationStore = useAggregationStore();

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
