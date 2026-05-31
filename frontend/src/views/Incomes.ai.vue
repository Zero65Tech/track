<script setup>
import BalancesByMonthWidget from '@/components/BalancesByMonthWidget.vue';
import { useAggregationStore } from '@/stores/aggregation.store';
import { EntryType } from '@shared/enums';

const aggregationStore = useAggregationStore();

const chartAggregationName = 'amounts_for_a_type';
const chartAggregationParams = { type: EntryType.INCOME.id };
const chartAggregationState = aggregationStore.getAggregationState(chartAggregationName, chartAggregationParams);
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Title -->
        <div class="col-span-12">
            <div class="font-semibold text-2xl">Incomes</div>
        </div>

        <!-- Income Chart -->
        <BalancesByMonthWidget :aggregationState="chartAggregationState" accentColor="#22c55e" />
    </div>
</template>
