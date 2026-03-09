<script setup>
import { useLayout } from '@/layout/composables/layout';
import { entryService } from '@/service/entryService';
import { useAggregationStore } from '@/stores/aggregation.store';
import { useBookStore } from '@/stores/book.store';
import { useHeadStore } from '@/stores/head.store';
import { useProfileStore } from '@/stores/profile.store';
import { useSourceStore } from '@/stores/source.store';
import { useTagStore } from '@/stores/tag.store';
import { EntryType } from '@shared/enums';
import { formatUtil } from '@shared/utils';
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const { getPrimary, getSurface, isDarkTheme } = useLayout();
const profileStore = useProfileStore();
const bookStore = useBookStore();
const headStore = useHeadStore();
const sourceStore = useSourceStore();
const tagStore = useTagStore();
const aggregationStore = useAggregationStore();

const chartAggregationName = 'amounts_by_type_head_tag_month';
const chartAggregationState = aggregationStore.getAggregationState(chartAggregationName);

const tagId = computed(() => route.params.tagId);
const tagName = computed(() => tagStore.tagsMap[tagId.value]?.name || 'Tag');

let abortController = new AbortController();
const loadedMonthCount = ref(0);
const entriesByMonth = ref({});
const isLoadingMonth = ref(false);
const error = ref(null);

const POSITIVE_TYPES = new Set([EntryType.CREDIT.id, EntryType.INCOME.id, EntryType.REFUND.id, EntryType.RECEIPT.id]);

function getEntryNetAmount(entry) {
    return POSITIVE_TYPES.has(entry.type) ? entry.amount : -entry.amount;
}

function getNextMonth(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return month === 12 ? `${year + 1}-01` : `${year}-${String(month + 1).padStart(2, '0')}`;
}

function getMonthDateRange(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    const lastDay = new Date(year, month, 0).getDate();
    return { fromDate: `${monthStr}-01`, toDate: `${monthStr}-${String(lastDay).padStart(2, '0')}` };
}

// Filter aggregation data for current tagId, keyed by month
const tagMonthsMap = computed(() => {
    const map = {};
    if (!chartAggregationState.data.value) return map;
    for (const item of chartAggregationState.data.value) {
        if (item.id.tagId !== tagId.value) continue;
        const month = item.id.month;
        if (!map[month]) map[month] = { balance: 0, count: 0 };
        const sign = POSITIVE_TYPES.has(item.id.type) ? 1 : -1;
        map[month].balance += sign * item.amount;
        map[month].count += item.count;
    }
    return map;
});

// All months from earliest to latest (filling gaps), sorted ascending
const allMonthsAsc = computed(() => {
    const monthKeys = Object.keys(tagMonthsMap.value).sort();
    if (monthKeys.length === 0) return [];

    const months = [monthKeys[0]];
    for (let i = 1; i < monthKeys.length; i++) {
        let next = getNextMonth(months[months.length - 1]);
        while (next < monthKeys[i]) {
            months.push(next);
            next = getNextMonth(next);
        }
        months.push(monthKeys[i]);
    }
    return months;
});

// Cumulative ending balance per month (ascending order)
const cumulativeBalanceMap = computed(() => {
    const months = allMonthsAsc.value;
    const map = {};
    let cumulative = 0;
    for (const month of months) {
        cumulative += tagMonthsMap.value[month]?.balance || 0;
        map[month] = cumulative;
    }
    return map;
});

// All months in descending order (most recent first)
const allMonthsDesc = computed(() => [...allMonthsAsc.value].reverse());

// Visible months based on loadedMonthCount
const visibleMonths = computed(() => allMonthsDesc.value.slice(0, loadedMonthCount.value));

const hasMore = computed(() => loadedMonthCount.value < allMonthsDesc.value.length);

// Build display data for each visible month
const monthSections = computed(() => {
    return visibleMonths.value.map((month) => {
        const monthData = tagMonthsMap.value[month];
        const count = monthData?.count || 0;
        const endingBalance = cumulativeBalanceMap.value[month] ?? 0;
        const entries = entriesByMonth.value[month] || [];

        // Sort entries: date descending, then sortOrder descending
        const sorted = [...entries].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
        });

        // Compute running balance per entry (walk newest to oldest)
        let runningBalance = endingBalance;
        const rows = sorted.map((entry) => {
            const balance = runningBalance;
            runningBalance -= getEntryNetAmount(entry);
            return { ...entry, balance };
        });

        return {
            month,
            label: formatUtil.formatMonth(month),
            count,
            endingBalance,
            rows
        };
    });
});

async function fetchMonthEntries(month) {
    const profileId = profileStore.activeProfile?.id;
    if (!profileId) return;

    const { fromDate, toDate } = getMonthDateRange(month);
    try {
        const entries = await entryService.getTagEntries({ profileId, tagId: tagId.value, fromDate, toDate }, abortController.signal);
        entriesByMonth.value = { ...entriesByMonth.value, [month]: entries };
    } catch (err) {
        if (err.name !== 'CanceledError') {
            error.value = err.message;
        }
    }
}

async function loadMore() {
    if (!hasMore.value || isLoadingMonth.value) return;

    isLoadingMonth.value = true;
    error.value = null;

    const count = Math.min(3, allMonthsDesc.value.length - loadedMonthCount.value);
    for (let i = 0; i < count; i++) {
        const nextIndex = loadedMonthCount.value;
        loadedMonthCount.value++;
        const month = allMonthsDesc.value[nextIndex];
        const monthData = tagMonthsMap.value[month];

        if (monthData?.count > 0) {
            await fetchMonthEntries(month);
        }
    }

    isLoadingMonth.value = false;
}

async function loadInitial() {
    // Reset state
    abortController.abort();
    abortController = new AbortController();
    loadedMonthCount.value = 0;
    entriesByMonth.value = {};
    error.value = null;

    // Load initial 3 months
    await loadMore();
}

// Re-load when aggregation data becomes available or tagId changes
watch(
    [() => chartAggregationState.data.value, tagId],
    () => {
        loadInitial();
    },
    { immediate: true }
);

// Reset on profile change
watch(
    () => profileStore.activeProfile,
    () => {
        abortController.abort();
        abortController = new AbortController();
        loadedMonthCount.value = 0;
        entriesByMonth.value = {};
        error.value = null;
    }
);

function getEntryTypeName(typeId) {
    for (const key of Object.keys(EntryType)) {
        if (EntryType[key].id === typeId) return EntryType[key].name;
    }
    return typeId;
}

// Charts

const chartMode = ref('yearly');
const chartModeOptions = [
    { label: 'Yearly (FY)', value: 'yearly' },
    { label: 'Monthly', value: 'monthly' }
];

const DEBIT_CREDIT_TYPES = new Set([EntryType.DEBIT.id, EntryType.CREDIT.id]);
const INCOME_TYPES = new Set([EntryType.INCOME.id]);
const TAX_TYPES = new Set([EntryType.TAX.id]);
const EXPENSE_REFUND_TYPES = new Set([EntryType.EXPENSE.id, EntryType.REFUND.id]);

function buildMonthHeadMap(typeFilter, negate = false) {
    return computed(() => {
        const map = {};
        if (!chartAggregationState.data.value) return map;
        for (const item of chartAggregationState.data.value) {
            if (item.id.tagId !== tagId.value) continue;
            if (!typeFilter.has(item.id.type)) continue;
            const month = item.id.month;
            const headId = item.id.headId;
            let sign = POSITIVE_TYPES.has(item.id.type) ? 1 : -1;
            if (negate) sign = -sign;
            if (!map[month]) map[month] = {};
            map[month][headId] = (map[month][headId] || 0) + sign * item.amount;
        }
        return map;
    });
}

function getFinancialYear(monthStr) {
    const [year, month] = monthStr.split('-').map(Number);
    return month >= 4 ? `FY${year}` : `FY${year - 1}`;
}

function formatFinancialYear(fyKey) {
    const year = parseInt(fyKey.slice(2));
    return `FY ${year}-${String(year + 1).slice(2)}`;
}

function aggregateToYearly(monthHeadMapRef) {
    return computed(() => {
        const result = {};
        for (const [month, headAmounts] of Object.entries(monthHeadMapRef.value)) {
            const fy = getFinancialYear(month);
            if (!result[fy]) result[fy] = {};
            for (const [headId, amount] of Object.entries(headAmounts)) {
                result[fy][headId] = (result[fy][headId] || 0) + amount;
            }
        }
        return result;
    });
}

function buildChartData(monthHeadMap, yearlyHeadMap, sharedMonths, sharedYears) {
    return computed(() => {
        const isYearly = chartMode.value === 'yearly';
        const map = isYearly ? yearlyHeadMap.value : monthHeadMap.value;
        const periods = isYearly ? sharedYears.value : sharedMonths.value;
        const formatLabel = isYearly ? formatFinancialYear : formatUtil.formatMonth;

        if (periods.length === 0) return { labels: [], datasets: [] };

        const headIds = new Set();
        for (const headAmounts of Object.values(map)) {
            for (const headId of Object.keys(headAmounts)) headIds.add(headId);
        }
        const headsMap = headStore.headsMap;

        const datasets = [...headIds].map((headId) => {
            const head = headsMap[headId];
            return {
                label: head?.name || headId,
                data: periods.map((period) => map[period]?.[headId] || 0),
                backgroundColor: head?.color || '#94a3b8',
                borderWidth: 0
            };
        });

        return {
            labels: periods.map(formatLabel),
            datasets
        };
    });
}

const debitCreditMonthHeadMap = buildMonthHeadMap(DEBIT_CREDIT_TYPES, true);
const incomeMonthHeadMap = buildMonthHeadMap(INCOME_TYPES);
const taxMonthHeadMap = buildMonthHeadMap(TAX_TYPES);
const expenseRefundMonthHeadMap = buildMonthHeadMap(EXPENSE_REFUND_TYPES, true);

const debitCreditYearlyMap = aggregateToYearly(debitCreditMonthHeadMap);
const incomeYearlyMap = aggregateToYearly(incomeMonthHeadMap);
const taxYearlyMap = aggregateToYearly(taxMonthHeadMap);
const expenseRefundYearlyMap = aggregateToYearly(expenseRefundMonthHeadMap);

// Total (debit - credit) per head across all months
const debitCreditByHead = computed(() => {
    const totals = {};
    for (const headAmounts of Object.values(debitCreditMonthHeadMap.value)) {
        for (const [headId, amount] of Object.entries(headAmounts)) {
            totals[headId] = (totals[headId] || 0) + amount;
        }
    }
    const headsMap = headStore.headsMap;
    return Object.entries(totals)
        .map(([headId, amount]) => ({
            headId,
            name: headsMap[headId]?.name || headId,
            color: headsMap[headId]?.color || '#94a3b8',
            amount: -amount
        }))
        .sort((a, b) => b.amount - a.amount);
});

const debitCreditTotal = computed(() => debitCreditByHead.value.reduce((sum, item) => sum + item.amount, 0));

// Total income per head across all months
const incomeByHead = computed(() => {
    const totals = {};
    for (const headAmounts of Object.values(incomeMonthHeadMap.value)) {
        for (const [headId, amount] of Object.entries(headAmounts)) {
            totals[headId] = (totals[headId] || 0) + amount;
        }
    }
    const headsMap = headStore.headsMap;
    return Object.entries(totals)
        .map(([headId, amount]) => ({
            headId,
            name: headsMap[headId]?.name || headId,
            color: headsMap[headId]?.color || '#94a3b8',
            amount
        }))
        .sort((a, b) => b.amount - a.amount);
});

const incomeTotal = computed(() => incomeByHead.value.reduce((sum, item) => sum + item.amount, 0));

// Total tax per head across all months
const taxByHead = computed(() => {
    const totals = {};
    for (const headAmounts of Object.values(taxMonthHeadMap.value)) {
        for (const [headId, amount] of Object.entries(headAmounts)) {
            totals[headId] = (totals[headId] || 0) + amount;
        }
    }
    const headsMap = headStore.headsMap;
    return Object.entries(totals)
        .map(([headId, amount]) => ({
            headId,
            name: headsMap[headId]?.name || headId,
            color: headsMap[headId]?.color || '#94a3b8',
            amount
        }))
        .sort((a, b) => b.amount - a.amount);
});

const taxTotal = computed(() => taxByHead.value.reduce((sum, item) => sum + item.amount, 0));

// Total income - tax per head across all months
const incomeTaxByHead = computed(() => {
    const totals = {};
    for (const headAmounts of Object.values(incomeMonthHeadMap.value)) {
        for (const [headId, amount] of Object.entries(headAmounts)) {
            totals[headId] = (totals[headId] || 0) + amount;
        }
    }
    for (const headAmounts of Object.values(taxMonthHeadMap.value)) {
        for (const [headId, amount] of Object.entries(headAmounts)) {
            totals[headId] = (totals[headId] || 0) - amount;
        }
    }
    const headsMap = headStore.headsMap;
    return Object.entries(totals)
        .map(([headId, amount]) => ({
            headId,
            name: headsMap[headId]?.name || headId,
            color: headsMap[headId]?.color || '#94a3b8',
            amount
        }))
        .sort((a, b) => b.amount - a.amount);
});

const incomeTaxTotal = computed(() => incomeTaxByHead.value.reduce((sum, item) => sum + item.amount, 0));

// Total expense & refund per head across all months
const expenseRefundByHead = computed(() => {
    const totals = {};
    for (const headAmounts of Object.values(expenseRefundMonthHeadMap.value)) {
        for (const [headId, amount] of Object.entries(headAmounts)) {
            totals[headId] = (totals[headId] || 0) + amount;
        }
    }
    const headsMap = headStore.headsMap;
    return Object.entries(totals)
        .map(([headId, amount]) => ({
            headId,
            name: headsMap[headId]?.name || headId,
            color: headsMap[headId]?.color || '#94a3b8',
            amount
        }))
        .sort((a, b) => b.amount - a.amount);
});

const expenseRefundTotal = computed(() => expenseRefundByHead.value.reduce((sum, item) => sum + item.amount, 0));

// Shared month list across all charts, with gaps filled
const chartMonths = computed(() => {
    const allKeys = new Set([...Object.keys(debitCreditMonthHeadMap.value), ...Object.keys(incomeMonthHeadMap.value), ...Object.keys(taxMonthHeadMap.value), ...Object.keys(expenseRefundMonthHeadMap.value)]);
    const sorted = [...allKeys].sort();
    if (sorted.length === 0) return [];

    const months = [sorted[0]];
    for (let i = 1; i < sorted.length; i++) {
        let next = getNextMonth(months[months.length - 1]);
        while (next < sorted[i]) {
            months.push(next);
            next = getNextMonth(next);
        }
        months.push(sorted[i]);
    }
    return months;
});

const chartYears = computed(() => {
    const allKeys = new Set([...Object.keys(debitCreditYearlyMap.value), ...Object.keys(incomeYearlyMap.value), ...Object.keys(taxYearlyMap.value), ...Object.keys(expenseRefundYearlyMap.value)]);
    return [...allKeys].sort();
});

const debitCreditChartData = buildChartData(debitCreditMonthHeadMap, debitCreditYearlyMap, chartMonths, chartYears);
const incomeChartData = buildChartData(incomeMonthHeadMap, incomeYearlyMap, chartMonths, chartYears);
const taxChartData = buildChartData(taxMonthHeadMap, taxYearlyMap, chartMonths, chartYears);
const expenseRefundChartData = buildChartData(expenseRefundMonthHeadMap, expenseRefundYearlyMap, chartMonths, chartYears);

// Cumulative balance per head over time
const cumulativeChartData = computed(() => {
    const isYearly = chartMode.value === 'yearly';
    if (!chartAggregationState.data.value) return { labels: [], datasets: [] };

    // Build month -> head -> net amount (credit - debit only)
    const CUMULATIVE_TYPES = new Set([EntryType.DEBIT.id, EntryType.CREDIT.id]);
    const ALL_TYPES = new Set([EntryType.DEBIT.id, EntryType.CREDIT.id, EntryType.INCOME.id, EntryType.TAX.id]);
    const monthHeadNet = {};
    const monthAllNet = {};
    const allHeadIds = new Set();
    for (const item of chartAggregationState.data.value) {
        if (item.id.tagId !== tagId.value) continue;
        if (!ALL_TYPES.has(item.id.type)) continue;
        const month = item.id.month;
        const headId = item.id.headId;
        const sign = POSITIVE_TYPES.has(item.id.type) ? -1 : 1;
        if (!monthAllNet[month]) monthAllNet[month] = {};
        monthAllNet[month][headId] = (monthAllNet[month][headId] || 0) + sign * item.amount;
        allHeadIds.add(headId);
        if (CUMULATIVE_TYPES.has(item.id.type)) {
            if (!monthHeadNet[month]) monthHeadNet[month] = {};
            monthHeadNet[month][headId] = (monthHeadNet[month][headId] || 0) + sign * item.amount;
        }
    }

    const months = allMonthsAsc.value;
    if (months.length === 0) return { labels: [], datasets: [] };

    // Accumulate per head across ascending months
    const runningTotals = {};
    const cumulativeData = {};
    const runningTotalsAll = {};
    const cumulativeDataAll = {};
    for (const month of months) {
        const headAmounts = monthHeadNet[month] || {};
        const allAmounts = monthAllNet[month] || {};
        for (const headId of allHeadIds) {
            if (headAmounts[headId]) {
                runningTotals[headId] = (runningTotals[headId] || 0) + headAmounts[headId];
            }
            if (allAmounts[headId]) {
                runningTotalsAll[headId] = (runningTotalsAll[headId] || 0) + allAmounts[headId];
            }
        }
        cumulativeData[month] = { ...runningTotals };
        cumulativeDataAll[month] = { ...runningTotalsAll };
    }

    const headsMap = headStore.headsMap;

    function buildDatasets(periods, getValue, getValueAll) {
        const headDatasets = [...allHeadIds].map((headId) => {
            const head = headsMap[headId];
            return {
                label: head?.name || headId,
                data: periods.map((p) => getValue(p, headId)),
                borderColor: 'transparent',
                backgroundColor: head?.color || '#94a3b8',
                fill: false,
                tension: 0.4,
                borderWidth: 0,
                pointRadius: 0,
                pointHitRadius: 0,
                hidden: false
            };
        });
        const totalDataset = {
            label: 'Debit − Credit',
            data: periods.map((p) => [...allHeadIds].reduce((sum, hId) => sum + (getValue(p, hId) || 0), 0)),
            borderColor: '#6366f1',
            backgroundColor: '#6366f1',
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 3,
            borderDash: [6, 3]
        };
        const totalAllDataset = {
            label: 'Including Income & Tax',
            data: periods.map((p) => [...allHeadIds].reduce((sum, hId) => sum + (getValueAll(p, hId) || 0), 0)),
            borderColor: '#f59e0b',
            backgroundColor: '#f59e0b',
            fill: false,
            tension: 0.4,
            borderWidth: 3,
            pointRadius: 3
        };
        return [...headDatasets, totalDataset, totalAllDataset];
    }

    if (isYearly) {
        const fyLastMonth = {};
        for (const month of months) {
            fyLastMonth[getFinancialYear(month)] = month;
        }
        const fys = Object.keys(fyLastMonth).sort();
        return {
            labels: fys.map(formatFinancialYear),
            datasets: buildDatasets(
                fys,
                (fy, headId) => cumulativeData[fyLastMonth[fy]]?.[headId] || 0,
                (fy, headId) => cumulativeDataAll[fyLastMonth[fy]]?.[headId] || 0
            )
        };
    }

    return {
        labels: months.map(formatUtil.formatMonth),
        datasets: buildDatasets(
            months,
            (month, headId) => cumulativeData[month]?.[headId] || 0,
            (month, headId) => cumulativeDataAll[month]?.[headId] || 0
        )
    };
});

const chartOptions = ref(null);
const lineChartOptions = ref(null);

function getChartOptions() {
    const documentStyle = getComputedStyle(document.documentElement);
    const textColorSecondary = documentStyle.getPropertyValue('--text-color-secondary');
    const surfaceBorder = documentStyle.getPropertyValue('--surface-border');

    return {
        maintainAspectRatio: false,
        plugins: {
            legend: { display: true, position: 'bottom', labels: { usePointStyle: true, boxWidth: 8 } },
            tooltip: {
                callbacks: {
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

function getLineChartOptions() {
    const base = getChartOptions();
    return {
        ...base,
        plugins: {
            ...base.plugins,
            legend: {
                display: true,
                labels: {
                    usePointStyle: true,
                    boxWidth: 8,
                    filter: (item) => item.text === 'Debit − Credit' || item.text === 'Including Income & Tax'
                }
            },
            tooltip: {
                mode: 'index',
                intersect: false,
                filter: (item) => item.parsed.y !== 0,
                callbacks: {
                    label: (context) => `  ${context.dataset.label}: ${formatUtil.formatCurrency(context.parsed.y)}`
                },
                itemSort: (a, b) => {
                    const TOTAL_LABELS = new Set(['Debit − Credit', 'Including Income & Tax']);
                    const aIsTotal = TOTAL_LABELS.has(a.dataset.label);
                    const bIsTotal = TOTAL_LABELS.has(b.dataset.label);
                    if (aIsTotal && !bIsTotal) return 1;
                    if (!aIsTotal && bIsTotal) return -1;
                    if (aIsTotal && bIsTotal) return a.dataset.label === 'Debit − Credit' ? -1 : 1;
                    return Math.abs(b.parsed.y) - Math.abs(a.parsed.y);
                }
            }
        },
        scales: {
            x: { ...base.scales.x, stacked: false },
            y: { ...base.scales.y, stacked: false }
        }
    };
}

onMounted(() => {
    chartOptions.value = getChartOptions();
    lineChartOptions.value = getLineChartOptions();
});

watch([getPrimary, getSurface, isDarkTheme], () => {
    chartOptions.value = getChartOptions();
    lineChartOptions.value = getLineChartOptions();
});
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Common Title -->
        <div class="col-span-12">
            <div class="flex justify-between items-center">
                <div class="font-semibold text-2xl">{{ tagName }}</div>
                <SelectButton v-model="chartMode" :options="chartModeOptions" optionLabel="label" optionValue="value" :allowEmpty="false" />
            </div>
        </div>

        <!-- Debit - Credit by Head Summary -->
        <div v-if="debitCreditByHead.length" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Amount by Head <span class="text-muted-color text-sm font-normal">(Debit − Credit)</span></div>
                    <div class="font-semibold text-base" :class="debitCreditTotal >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">Total: {{ formatUtil.formatCurrency(Math.abs(debitCreditTotal)) }}</div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div v-for="item in debitCreditByHead" :key="item.headId" class="flex items-center gap-2 px-3 py-2 rounded-border bg-surface-100 dark:bg-surface-800">
                        <i class="pi pi-clipboard" :style="{ color: item.color }"></i>
                        <span class="font-medium text-sm">{{ item.name }}</span>
                        <span class="font-semibold text-sm" :class="item.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">{{ formatUtil.formatCurrency(Math.abs(item.amount)) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Income by Head Summary -->
        <div v-if="incomeByHead.length" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Amount by Head <span class="text-muted-color text-sm font-normal">(Income)</span></div>
                    <div class="font-semibold text-base" :class="incomeTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">Total: {{ formatUtil.formatCurrency(Math.abs(incomeTotal)) }}</div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div v-for="item in incomeByHead" :key="item.headId" class="flex items-center gap-2 px-3 py-2 rounded-border bg-surface-100 dark:bg-surface-800">
                        <i class="pi pi-clipboard" :style="{ color: item.color }"></i>
                        <span class="font-medium text-sm">{{ item.name }}</span>
                        <span class="font-semibold text-sm" :class="item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ formatUtil.formatCurrency(Math.abs(item.amount)) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tax by Head Summary -->
        <div v-if="taxByHead.length" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Amount by Head <span class="text-muted-color text-sm font-normal">(Tax)</span></div>
                    <div class="font-semibold text-base" :class="taxTotal >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">Total: {{ formatUtil.formatCurrency(Math.abs(taxTotal)) }}</div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div v-for="item in taxByHead" :key="item.headId" class="flex items-center gap-2 px-3 py-2 rounded-border bg-surface-100 dark:bg-surface-800">
                        <i class="pi pi-clipboard" :style="{ color: item.color }"></i>
                        <span class="font-medium text-sm">{{ item.name }}</span>
                        <span class="font-semibold text-sm" :class="item.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">{{ formatUtil.formatCurrency(Math.abs(item.amount)) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Expense & Refund by Head Summary -->
        <div v-if="expenseRefundByHead.length" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-4">
                    <div class="font-semibold text-xl">Amount by Head <span class="text-muted-color text-sm font-normal">(Expense & Refund)</span></div>
                    <div class="font-semibold text-base" :class="expenseRefundTotal >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">Total: {{ formatUtil.formatCurrency(Math.abs(expenseRefundTotal)) }}</div>
                </div>
                <div class="flex flex-wrap gap-4">
                    <div v-for="item in expenseRefundByHead" :key="item.headId" class="flex items-center gap-2 px-3 py-2 rounded-border bg-surface-100 dark:bg-surface-800">
                        <i class="pi pi-clipboard" :style="{ color: item.color }"></i>
                        <span class="font-medium text-sm">{{ item.name }}</span>
                        <span class="font-semibold text-sm" :class="item.amount >= 0 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">{{ formatUtil.formatCurrency(Math.abs(item.amount)) }}</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Cumulative by Head Line Chart -->
        <div v-if="Object.keys(debitCreditMonthHeadMap || {}).length > 0" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Cumulative by Head</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : cumulativeChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="cumulativeChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="line" :data="cumulativeChartData" :options="lineChartOptions" class="h-80" />
            </div>
        </div>

        <!-- Debit - Credit Chart -->
        <div v-if="Object.keys(debitCreditMonthHeadMap || {}).length > 0" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Debit - Credit</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : debitCreditChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="debitCreditChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="bar" :data="debitCreditChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Income Chart -->
        <div v-if="Object.keys(incomeMonthHeadMap || {}).length > 0" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Income</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : incomeChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="incomeChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="bar" :data="incomeChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Tax Chart -->
        <div v-if="Object.keys(taxMonthHeadMap || {}).length > 0" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Tax</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : taxChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="taxChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="bar" :data="taxChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Expense & Refund Chart -->
        <div v-if="Object.keys(expenseRefundMonthHeadMap || {}).length > 0" class="col-span-12">
            <div class="card">
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Expense & Refund</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : expenseRefundChartData.labels.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>
                <div v-else-if="expenseRefundChartData.labels.length === 0" class="mb-4">
                    <div class="text-center text-muted-color">No data available !</div>
                </div>
                <Chart v-else type="bar" :data="expenseRefundChartData" :options="chartOptions" class="h-80" />
            </div>
        </div>

        <!-- Entries -->
        <div class="col-span-12">
            <div class="card">
                <!-- Header -->
                <div class="flex justify-between items-center mb-6">
                    <div class="font-semibold text-xl">Entries</div>
                    <div class="flex items-center gap-2">
                        <span class="text-primary font-medium text-sm">
                            {{ chartAggregationState.isUpdating.value ? 'Updating ...' : chartAggregationState.isLoading.value ? 'Loading ...' : allMonthsAsc.length ? chartAggregationState.dataUpdatedTimeAgo.value : '' }}
                        </span>
                        <button
                            @click="chartAggregationState.error.value ? aggregationStore.fetchAggregation(chartAggregationName) : aggregationStore.triggerAggregationUpdate(chartAggregationName)"
                            :disabled="chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value"
                            :class="[
                                'p-1 rounded-border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed',
                                chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? '' : 'hover:bg-surface-100 dark:hover:bg-surface-800'
                            ]"
                            :title="chartAggregationState.error.value ? 'Retry' : 'Update'"
                        >
                            <i :class="['pi', chartAggregationState.isUpdating.value || chartAggregationState.isLoading.value ? 'pi-spinner animate-spin' : 'pi-refresh', 'text-sm!']"></i>
                        </button>
                    </div>
                </div>

                <!-- Error from aggregation -->
                <div v-if="chartAggregationState.error.value" class="mb-4">
                    <div class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">Error loading aggregation data</div>
                    <div class="text-red-500 dark:text-red-300 text-xs">{{ chartAggregationState.error.value }}</div>
                </div>

                <!-- Loading aggregation -->
                <div v-else-if="chartAggregationState.isLoading.value && allMonthsDesc.length === 0" class="text-center text-muted-color py-8">
                    <i class="pi pi-spinner animate-spin text-2xl mb-2"></i>
                    <div>Loading tag data...</div>
                </div>

                <!-- No data -->
                <div v-else-if="allMonthsDesc.length === 0" class="text-center text-muted-color py-8">No entries found for this tag.</div>

                <!-- Month sections -->
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[800px]">
                        <thead>
                            <tr class="text-left text-muted-color border-b border-surface-200 dark:border-surface-700">
                                <th class="py-2 px-2 font-medium">Date</th>
                                <th class="py-2 px-2 font-medium">Type</th>
                                <th class="py-2 px-2 font-medium">Book</th>
                                <th class="py-2 px-2 font-medium">Head</th>
                                <th class="py-2 px-2 font-medium">Source</th>
                                <th class="py-2 px-2 font-medium text-right">Amount</th>
                                <th class="py-2 px-2 font-medium">Note</th>
                                <th class="py-2 px-2 font-medium text-right">Balance</th>
                            </tr>
                        </thead>
                        <tbody v-for="section in monthSections" :key="section.month">
                            <!-- Month header -->
                            <tr class="bg-surface-100 dark:bg-surface-800">
                                <td colspan="8" class="py-2 px-3">
                                    <div class="flex justify-between items-center">
                                        <span class="font-medium text-sm">{{ section.label }}</span>
                                        <span class="font-semibold text-sm">{{ formatUtil.formatCurrency(section.endingBalance) }}</span>
                                    </div>
                                </td>
                            </tr>

                            <!-- Empty month placeholder -->
                            <tr v-if="section.count === 0">
                                <td colspan="8" class="text-center text-muted-color text-sm py-4">No entries this month</td>
                            </tr>

                            <!-- Entry rows -->
                            <tr v-for="row in section.rows" :key="row.id" class="border-b border-surface-100 dark:border-surface-800">
                                <td class="py-2 px-2">{{ formatUtil.formatDate(new Date(row.date)) }}</td>
                                <td class="py-2 px-2">{{ getEntryTypeName(row.type) }}</td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="bookStore.booksMap[row.bookId]">
                                        <i class="pi pi-book mr-1" :style="{ color: bookStore.booksMap[row.bookId].color }"></i>
                                        {{ bookStore.booksMap[row.bookId].name }}
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="headStore.headsMap[row.headId]">
                                        <i class="pi pi-clipboard mr-1" :style="{ color: headStore.headsMap[row.headId].color }"></i>
                                        {{ headStore.headsMap[row.headId].name }}
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="sourceStore.sourcesMap[row.sourceId]">
                                        <i class="pi pi-wallet mr-1" :style="{ color: sourceStore.sourcesMap[row.sourceId].color }"></i>
                                        {{ sourceStore.sourcesMap[row.sourceId].name }}
                                    </template>
                                    <template v-else>—</template>
                                </td>
                                <td class="py-2 px-2 text-right" :class="getEntryNetAmount(row) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'">
                                    {{ formatUtil.formatCurrency(row.amount) }}
                                </td>
                                <td class="py-2 px-2 text-muted-color truncate max-w-48">{{ row.note || '—' }}</td>
                                <td class="py-2 px-2 text-right font-medium">{{ formatUtil.formatCurrency(row.balance) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Error loading entries -->
                <div v-if="error" class="text-center text-red-600 dark:text-red-400 text-sm mb-4">{{ error }}</div>

                <!-- Load More button -->
                <div v-if="hasMore" class="text-center mt-4">
                    <Button label="Load More" icon="pi pi-arrow-down" :loading="isLoadingMonth" :disabled="isLoadingMonth" @click="loadMore" outlined />
                </div>
            </div>
        </div>
    </div>
</template>
