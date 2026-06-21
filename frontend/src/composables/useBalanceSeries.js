import { computed } from 'vue';

export function useBalanceSeries(aggregationStateInput, periodKey, getNextPeriod) {
    const aggregationStateArr = Array.isArray(aggregationStateInput) ? aggregationStateInput : [aggregationStateInput];

    const sortedPeriods = computed(() => {
        const periodsSet = new Set();

        aggregationStateArr.forEach((aggregationState) => {
            aggregationState.data.value.forEach((item) => periodsSet.add(item[periodKey]));
        });

        const periods = Array.from(periodsSet).sort();
        for (let i = 0; i < periods.length - 1; i++) {
            const nextPeriod = getNextPeriod(periods[i]);
            if (periods[i + 1] !== nextPeriod) {
                periods.splice(i + 1, 0, nextPeriod);
            }
        }

        return periods;
    });

    const balancesByPeriodArr = computed(() => {
        const periods = sortedPeriods.value;

        return aggregationStateArr.map((aggregationState) => {
            const amounts = {};

            aggregationState.data.value.forEach((item) => {
                amounts[item[periodKey]] = (amounts[item[periodKey]] || 0) + item.amount;
            });

            for (let i = 1; i < periods.length; i++) {
                amounts[periods[i]] = amounts[periods[i - 1]] + (amounts[periods[i]] || 0);
            }

            return amounts;
        });
    });

    return Array.isArray(aggregationStateInput) ? { sortedPeriods, balancesByPeriodArr } : { sortedPeriods, balancesByPeriod: computed(() => balancesByPeriodArr.value[0]) };
}
