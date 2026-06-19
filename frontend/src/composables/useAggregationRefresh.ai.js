import { isRef, watch } from 'vue';

import { useAggregationStore } from '@/stores/aggregation.store';

function resolveAggregationState(aggregationState) {
    if (typeof aggregationState === 'function') {
        return aggregationState();
    }

    if (isRef(aggregationState)) {
        return aggregationState.value;
    }

    return aggregationState;
}

export function useAggregationRefresh(aggregationState) {
    const aggregationStore = useAggregationStore();

    watch(
        () => {
            const state = resolveAggregationState(aggregationState);
            return [state?.key, state?.isRefreshAvailable?.value];
        },
        async ([stateKey, isRefreshAvailable]) => {
            if (!stateKey || !isRefreshAvailable) {
                return;
            }

            try {
                await aggregationStore.refreshAggregation(stateKey);
            } catch (err) {
                console.log(err);
            }
        },
        { immediate: true }
    );
}
