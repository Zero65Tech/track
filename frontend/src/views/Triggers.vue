<script setup>
import { useBookStore } from '@/stores/book.store';
import { useHeadStore } from '@/stores/head.store';
import { useSourceStore } from '@/stores/source.store';
import { useTagStore } from '@/stores/tag.store';
import { useTriggerStore } from '@/stores/trigger.store';
import { TriggerState, TriggerType } from '@shared/enums';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

const triggerStore = useTriggerStore();
const bookStore = useBookStore();
const headStore = useHeadStore();
const tagStore = useTagStore();
const sourceStore = useSourceStore();

const loadMoreElementRef = ref(null);
const intersectionObserver = ref(null);

const displayTriggers = computed(() => triggerStore.triggers);
const isLoading = computed(() => triggerStore.isLoading);
const error = computed(() => triggerStore.error);

// Setup intersection observer for infinite scroll
onMounted(async () => {
    if (loadMoreElementRef.value) {
        intersectionObserver.value = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting && !isLoading.value && displayTriggers.value.length > 0) {
                        triggerStore.loadMore();
                    }
                });
            },
            { threshold: 0.1 }
        );

        intersectionObserver.value.observe(loadMoreElementRef.value);
    }
});

onBeforeUnmount(() => {
    if (intersectionObserver.value) {
        intersectionObserver.value.disconnect();
    }
});

function getTriggerTypeLabel(trigger) {
    const typeEnum = Object.values(TriggerType).find((t) => t.id === trigger.type);
    return typeEnum?.name || trigger.type;
}

function getTriggerDisplay(trigger) {
    let display = getTriggerTypeLabel(trigger);

    if (trigger.type === TriggerType.DATA_AGGREGATION.id) {
        const parts = [];

        if (trigger.aggregationName) {
            parts.push(trigger.aggregationName);
        }

        const params = getReadableAggregationParams(trigger.aggregationParams);
        const paramEntries = Object.entries(params);
        if (paramEntries.length > 0) {
            paramEntries.forEach(([key, value]) => {
                parts.push(`${key}: ${value}`);
            });
        }

        if (parts.length > 0) {
            display += ` (${parts.join(', ')})`;
        }
    }

    return display;
}

function getTriggerStatusColor(trigger) {
    if (trigger.state === TriggerState.COMPLETED.id) return 'text-green-600';
    if (trigger.state === TriggerState.RUNNING.id || trigger.state === TriggerState.QUEUED.id) return 'text-yellow-600';
    if (trigger.state === TriggerState.FAILED.id) return 'text-red-600';
    return 'text-gray-600';
}

function formatDate(date) {
    if (!date) return '';
    const dateObj = new Date(date);
    return `${dateObj.toLocaleString()}.${String(dateObj.getMilliseconds()).padStart(3, '0')}`;
}

function calculateDuration(createdAt, updatedAt) {
    if (!createdAt || !updatedAt) return '';
    const start = new Date(createdAt);
    const end = new Date(updatedAt);
    const durationMs = end - start;

    if (durationMs < 1000) return `${durationMs}ms`;

    const seconds = Math.floor(durationMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

function getReadableAggregationParams(params) {
    if (!params) return {};
    const readable = { ...params };
    if (readable.bookId) {
        const book = bookStore.booksMap[readable.bookId];
        readable.Book = book?.name || readable.bookId;
        delete readable.bookId;
    }
    if (readable.headId) {
        const head = headStore.headsMap[readable.headId];
        readable.Head = head?.name || readable.headId;
        delete readable.headId;
    }
    if (readable.tagId) {
        const tag = tagStore.tagsMap[readable.tagId];
        readable.Tag = tag?.name || readable.tagId;
        delete readable.tagId;
    }
    if (readable.sourceId) {
        const source = sourceStore.sourcesMap[readable.sourceId];
        readable.Source = source?.name || readable.sourceId;
        delete readable.sourceId;
    }
    return readable;
}
</script>

<template>
    <div class="space-y-4">
        <div class="flex justify-between items-center">
            <h1 class="text-3xl font-bold">Triggers</h1>
            <button @click="triggerStore.refresh" :disabled="isLoading" class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50">
                {{ isLoading ? 'Loading...' : 'Refresh' }}
            </button>
        </div>

        <div v-if="error" class="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            {{ error }}
        </div>

        <div v-if="displayTriggers.length === 0 && !isLoading" class="text-center py-12 text-gray-500">No triggers yet</div>

        <table v-else class="w-full border-collapse border border-gray-300">
            <thead class="bg-gray-100">
                <tr>
                    <th class="border border-gray-300 px-4 py-2 text-left font-semibold">Type</th>
                    <th class="border border-gray-300 px-4 py-2 text-center font-semibold">State</th>
                    <th class="border border-gray-300 px-4 py-2 text-center font-semibold">Created</th>
                    <th class="border border-gray-300 px-4 py-2 text-center font-semibold">Duration</th>
                </tr>
            </thead>
            <tbody>
                <template v-for="trigger in displayTriggers" :key="trigger.id">
                    <tr class="hover:bg-gray-50 border border-gray-300">
                        <td class="border border-gray-300 px-4 py-2">{{ getTriggerDisplay(trigger) }}</td>
                        <td class="border border-gray-300 px-4 py-2 text-center">
                            <span :class="['text-sm font-medium', getTriggerStatusColor(trigger)]">
                                {{ Object.values(TriggerState).find((s) => s.id === trigger.state)?.name || trigger.state }}
                            </span>
                        </td>
                        <td class="border border-gray-300 px-4 py-2 text-sm text-center">{{ formatDate(trigger.createdAt) }}</td>
                        <td class="border border-gray-300 px-4 py-2 text-sm text-center">{{ calculateDuration(trigger.createdAt, trigger.updatedAt) }}</td>
                    </tr>

                    <tr v-if="trigger.result" class="bg-gray-50">
                        <td colspan="4" class="border border-gray-300 px-4 py-2">
                            <span class="font-semibold">Result:</span>
                            <pre class="mt-2 overflow-auto max-h-32">{{ JSON.stringify(trigger.result, null, 2) }}</pre>
                        </td>
                    </tr>
                </template>
            </tbody>
        </table>

        <!-- Infinite scroll sentinel -->
        <div ref="loadMoreElementRef" class="py-8 text-center">
            <div v-if="isLoading" class="text-gray-600">Loading more triggers...</div>
            <div v-else-if="displayTriggers.length > 0" class="text-gray-500 text-sm">Scroll to load more</div>
        </div>
    </div>
</template>

<style scoped>
pre {
    font-family: 'Courier New', monospace;
    white-space: pre-wrap;
    word-wrap: break-word;
}
</style>
