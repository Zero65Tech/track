<script setup>
import AmountsByTypeBookMonthWidget from '@/components/dashboard/AmountsByTypeBookMonthWidget.vue';
import BalancesByWeekWidget from '@/components/dashboard/BalancesByWeekWidget.vue';
import SourcesByWeekWidget from '@/components/dashboard/SourcesByWeekWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import { EntryType } from '@shared/enums';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <BalancesByWeekWidget />
        <SourcesByWeekWidget />

        <AmountsByTypeBookMonthWidget title="Expenses - Refunds" :entry-types="[EntryType.EXPENSE.id, EntryType.REFUND.id]" />
        <AmountsByTypeBookMonthWidget title="Incomes - Taxes" :entry-types="[EntryType.INCOME.id, EntryType.TAX.id]" />
        <AmountsByTypeBookMonthWidget title="Debits - Credits" :entry-types="[EntryType.CREDIT.id, EntryType.DEBIT.id]" />
    </div>
</template>
