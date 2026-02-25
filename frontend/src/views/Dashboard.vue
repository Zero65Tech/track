<script setup>
import BestSellingWidget from '@/components-demo/dashboard/BestSellingWidget.vue';
import NotificationsWidget from '@/components-demo/dashboard/NotificationsWidget.vue';
import RecentSalesWidget from '@/components-demo/dashboard/RecentSalesWidget.vue';
import RevenueStreamWidget from '@/components-demo/dashboard/RevenueStreamWidget.vue';
import StatsWidget from '@/components-demo/dashboard/StatsWidget.vue';
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <StatsWidget />

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
