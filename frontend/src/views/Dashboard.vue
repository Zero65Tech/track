<script setup>
import BestSellingWidget from '@/components/dashboard/BestSellingWidget.vue';
import ExpensesByBookMonthWidget from '@/components/dashboard/ExpensesByBookMonthWidget.vue';
import NotificationsWidget from '@/components/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components/dashboard/StatsWidget.vue';
import WeeklyBalancesWidget from '@/components/dashboard/WeeklyBalancesWidget.vue';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <ExpensesByBookMonthWidget />

        <StatsWidget />

        <WeeklyBalancesWidget />

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
