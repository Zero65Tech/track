<script setup>
import BalancesByMonthWidget from '@/components/BalancesByMonthWidget.vue';
import { useAggregationRefresh } from '@/composables/useAggregationRefresh.ai';
import { useLayout } from '@/layout/composables/layout';
import { useAggregationStore } from '@/stores/aggregation.store';
import { useBookStore } from '@/stores/book.store';
import { useHeadStore } from '@/stores/head.store';
import { useTagStore } from '@/stores/tag.store';
import { EntryType } from '@shared/enums';
import { formatUtil } from '@shared/utils';
import { computed, onMounted, ref, watch } from 'vue';

const { getPrimary, getSurface, isDarkTheme } = useLayout();
const aggregationStore = useAggregationStore();
const tagStore = useTagStore();
const bookStore = useBookStore();
const headStore = useHeadStore();

const chartAggregationName = 'amounts_for_a_type';
const chartAggregationParams = { type: EntryType.INCOME.id };
const chartAggregationState = aggregationStore.getAggregationState(chartAggregationName, chartAggregationParams);
useAggregationRefresh(chartAggregationState);

// Income data from aggregation
const incomeData = computed(() => chartAggregationState.data.value || []);

// Financial year helper
function getFinancialYear(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return month >= 4 ? `FY${year}` : `FY${year - 1}`;
}

// Group income by year and tag
const incomeByYearAndTag = computed(() => {
    const map = {};
    for (const item of incomeData.value) {
        const year = getFinancialYear(item.month);
        if (!map[year]) map[year] = {};
        if (!map[year][item.tagId]) {
            map[year][item.tagId] = {
                tagId: item.tagId,
                amount: 0
            };
        }
        map[year][item.tagId].amount += item.amount;
    }
    return map;
});

// All tags that have income
const allTags = computed(() => {
    const tagIds = new Set();
    for (const yearData of Object.values(incomeByYearAndTag.value)) {
        for (const tagId of Object.keys(yearData)) {
            tagIds.add(tagId);
        }
    }
    return Array.from(tagIds).sort();
});

// Years sorted
const allYears = computed(() => Object.keys(incomeByYearAndTag.value).sort());

// Group income by year and book
const incomeByYearAndBook = computed(() => {
    const map = {};
    for (const item of incomeData.value) {
        const year = getFinancialYear(item.month);
        if (!map[year]) map[year] = {};
        if (!map[year][item.bookId]) {
            map[year][item.bookId] = {
                bookId: item.bookId,
                amount: 0
            };
        }
        map[year][item.bookId].amount += item.amount;
    }
    return map;
});

// All books that have income
const allBooks = computed(() => {
    const bookIds = new Set();
    for (const yearData of Object.values(incomeByYearAndBook.value)) {
        for (const bookId of Object.keys(yearData)) {
            bookIds.add(bookId);
        }
    }
    return Array.from(bookIds).sort();
});

// Group income by year and head
const incomeByYearAndHead = computed(() => {
    const map = {};
    for (const item of incomeData.value) {
        const year = getFinancialYear(item.month);
        if (!map[year]) map[year] = {};
        if (!map[year][item.headId]) {
            map[year][item.headId] = {
                headId: item.headId,
                amount: 0
            };
        }
        map[year][item.headId].amount += item.amount;
    }
    return map;
});

// All heads that have income
const allHeads = computed(() => {
    const headIds = new Set();
    for (const yearData of Object.values(incomeByYearAndHead.value)) {
        for (const headId of Object.keys(yearData)) {
            headIds.add(headId);
        }
    }
    return Array.from(headIds).sort();
});

// Stacked bar chart data
const stackedChartData = computed(() => {
    const tags = allTags.value;
    const years = allYears.value;

    if (years.length === 0 || tags.length === 0) {
        return { labels: [], datasets: [] };
    }

    const colorPalette = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

    const datasets = tags.map((tagId, index) => {
        const tag = tagStore.tagsMap[tagId];
        return {
            label: tag?.name || tagId,
            data: years.map((year) => incomeByYearAndTag.value[year]?.[tagId]?.amount || 0),
            backgroundColor: colorPalette[index % colorPalette.length]
        };
    });

    return {
        labels: years,
        datasets
    };
});

// Stacked bar chart data for books
const stackedBookChartData = computed(() => {
    const books = allBooks.value;
    const years = allYears.value;

    if (years.length === 0 || books.length === 0) {
        return { labels: [], datasets: [] };
    }

    const colorPalette = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

    const datasets = books.map((bookId, index) => {
        const book = bookStore.booksMap[bookId];
        return {
            label: book?.name || bookId,
            data: years.map((year) => incomeByYearAndBook.value[year]?.[bookId]?.amount || 0),
            backgroundColor: book?.color || '#94a3b8'
        };
    });

    return {
        labels: years,
        datasets
    };
});

// Stacked bar chart data for heads
const stackedHeadChartData = computed(() => {
    const heads = allHeads.value;
    const years = allYears.value;

    if (years.length === 0 || heads.length === 0) {
        return { labels: [], datasets: [] };
    }

    const colorPalette = ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#06b6d4'];

    const datasets = heads.map((headId, index) => {
        const head = headStore.headsMap[headId];
        return {
            label: head?.name || headId,
            data: years.map((year) => incomeByYearAndHead.value[year]?.[headId]?.amount || 0),
            backgroundColor: colorPalette[index % colorPalette.length]
        };
    });

    return {
        labels: years,
        datasets
    };
});

// Chart options
const chartOptions = ref(null);

function getChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    filter: (context) => context.parsed.y !== 0,
                    label: (context) => `${context.dataset.label}: ${formatUtil.formatCurrency(context.parsed.y)}`
                }
            }
        },
        scales: {
            x: {
                stacked: true,
                ticks: { color: textColorSecondary, font: { weight: 500 } },
                grid: { display: false, drawBorder: false }
            },
            y: {
                stacked: true,
                ticks: { color: textColorSecondary, callback: formatUtil.formatCurrencyNoDecimals },
                grid: { color: surfaceBorder, drawBorder: false }
            }
        }
    };
}

onMounted(() => {
    chartOptions.value = getChartOptions();
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = getChartOptions();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Title -->
        <div class="col-span-12">
            <div class="font-semibold text-2xl">Incomes</div>
        </div>

        <!-- Income Chart -->
        <BalancesByMonthWidget :aggregationState="chartAggregationState" accentColor="#22c55e" />

        <!-- Income by Book (Stacked Bar Chart) -->
        <div v-if="allYears.length > 0" class="col-span-12">
            <div class="card">
                <div class="font-semibold text-xl mb-6">Income by Book (Yearly)</div>
                <Chart type="bar" :data="stackedBookChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Income by Tag (Stacked Bar Chart) -->
        <div v-if="allYears.length > 0" class="col-span-12">
            <div class="card">
                <div class="font-semibold text-xl mb-6">Income by Tag (Yearly)</div>
                <Chart type="bar" :data="stackedChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Income by Head (Stacked Bar Chart) -->
        <div v-if="allYears.length > 0" class="col-span-12">
            <div class="card">
                <div class="font-semibold text-xl mb-6">Income by Head (Yearly)</div>
                <Chart type="bar" :data="stackedHeadChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>
    </div>
</template>
