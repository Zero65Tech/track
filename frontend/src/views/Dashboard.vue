<script setup>
import AmountsByTypeBookMonthWidget from '@/components/dashboard/AmountsByTypeBookMonthWidget.vue';
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import WeeklyBalancesWidget from '@/components/dashboard/WeeklyBalancesWidget.vue';
import { EntryType } from '@shared/enums';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

        <WeeklyBalancesWidget />

        <AmountsByTypeBookMonthWidget title="Credits - Debits" :entry-types="[EntryType.CREDIT.id, EntryType.DEBIT.id]" />
        <AmountsByTypeBookMonthWidget title="Incomes - Taxes" :entry-types="[EntryType.INCOME.id, EntryType.TAX.id]" />
        <AmountsByTypeBookMonthWidget title="Expenses - Refunds" :entry-types="[EntryType.EXPENSE.id, EntryType.REFUND.id]" />

        <div class="col-span-12 xl:col-span-6">
            <RecentSalesWidget />
            <BestSellingWidget />
        </div>
        <div class="col-span-12 xl:col-span-6">
            <RevenueStreamWidget />
            <NotificationsWidget />
        </div>
    </div>
</template>
