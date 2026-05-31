<script setup>
import AmountsByTypeBookMonthWidget from '@/components/dashboard/AmountsByTypeBookMonthWidget.vue';
import { useAggregationStore } from '@/stores/aggregation.store';
import BalancesByWeekWidget from '@/components/BalancesByWeekWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { EntryType } from '@shared/enums';

const aggregationStore = useAggregationStore();
const aggregationState = aggregationStore.getAggregationState('amounts_by_book');
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <BalancesByWeekWidget :aggregationState="aggregationState" />

        <AmountsByTypeBookMonthWidget title="Expenses - Refunds" :entry-types="[EntryType.EXPENSE.id, EntryType.REFUND.id]" />
        <AmountsByTypeBookMonthWidget title="Incomes - Taxes" :entry-types="[EntryType.INCOME.id, EntryType.TAX.id]" />
        <AmountsByTypeBookMonthWidget title="Debits - Credits" :entry-types="[EntryType.CREDIT.id, EntryType.DEBIT.id]" />
    </div>
</template>
