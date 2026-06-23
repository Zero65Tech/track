<script setup>
import { onMounted, ref, watch } from 'vue';

import { EntryType } from '@shared/enums';
import { formatUtil } from '@shared/utils';

import { entryService } from '@/service/entryService';
import { useBookStore } from '@/stores/book.store';
import { useEntryStore } from '@/stores/entry.store';
import { useHeadStore } from '@/stores/head.store';
import { useProfileStore } from '@/stores/profile.store';
import { useSourceStore } from '@/stores/source.store';
import { useTagStore } from '@/stores/tag.store';

const profileStore = useProfileStore();
const bookStore = useBookStore();
const headStore = useHeadStore();
const tagStore = useTagStore();
const sourceStore = useSourceStore();
const entryStore = useEntryStore();

const entries = ref([]);
const isLoading = ref(false);
const error = ref(null);

let abortController = new AbortController();

function getEntryTypeName(typeId) {
    for (const key of Object.keys(EntryType)) {
        if (EntryType[key].id === typeId) return EntryType[key].name;
    }
    return typeId;
}

async function load() {
    abortController.abort();
    abortController = new AbortController();

    const profileId = profileStore.activeProfile?.id;
    if (!profileId) return;

    isLoading.value = true;
    error.value = null;

    try {
        const result = await entryService.getTodoEntries(
            { profileId },
            abortController.signal
        );
        entries.value = [...result].sort((a, b) => {
            if (a.date !== b.date) return b.date.localeCompare(a.date);
            return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
        });
    } catch (err) {
        if (err.name !== 'CanceledError') {
            error.value = err.message;
        }
    } finally {
        isLoading.value = false;
    }
}

onMounted(() => load());
watch(() => profileStore.activeProfile, () => load());
watch(() => entryStore.lastCreated, () => load());
</script>

<template>
    <div class="grid grid-cols-12 gap-8">
        <!-- Title -->
        <div class="col-span-12">
            <div class="font-semibold text-2xl">Todos</div>
        </div>

        <div class="col-span-12">
            <div class="card">
                <!-- Loading -->
                <div v-if="isLoading" class="text-center text-muted-color py-8">
                    <i class="pi pi-spinner animate-spin text-2xl mb-2"></i>
                    <div>Loading todos...</div>
                </div>

                <!-- Error -->
                <div v-else-if="error" class="text-red-600 dark:text-red-400 text-sm py-4">{{ error }}</div>

                <!-- Empty -->
                <div v-else-if="entries.length === 0" class="text-center text-muted-color py-8">
                    No todo entries found.
                </div>

                <!-- Table -->
                <div v-else class="overflow-x-auto">
                    <table class="w-full text-sm min-w-[900px]">
                        <thead>
                            <tr class="text-left text-muted-color border-b border-surface-200 dark:border-surface-700">
                                <th class="py-2 px-2 font-medium">Todo</th>
                                <th class="py-2 px-2 font-medium">Date</th>
                                <th class="py-2 px-2 font-medium">Type</th>
                                <th class="py-2 px-2 font-medium text-right">Amount</th>
                                <th class="py-2 px-2 font-medium">Note</th>
                                <th class="py-2 px-2 font-medium">Book</th>
                                <th class="py-2 px-2 font-medium">Head</th>
                                <th class="py-2 px-2 font-medium">Tag</th>
                                <th class="py-2 px-2 font-medium">Source</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in entries"
                                :key="row.id"
                                class="border-b border-surface-100 dark:border-surface-800"
                            >
                                <td class="py-2 px-2 font-medium max-w-60 truncate" :title="row.todo">{{ row.todo }}</td>
                                <td class="py-2 px-2 whitespace-nowrap">{{ formatUtil.formatDate(row.date) }}</td>
                                <td class="py-2 px-2 whitespace-nowrap">{{ getEntryTypeName(row.type) }}</td>
                                <td class="py-2 px-2 text-right whitespace-nowrap">{{ formatUtil.formatCurrency(row.amount) }}</td>
                                <td class="py-2 px-2 text-muted-color truncate max-w-48">{{ row.note || '—' }}</td>
                                <td class="py-2 px-2 text-muted-color">
                                    <template v-if="bookStore.booksMap[row.bookId]">
                                        <router-link :to="{ name: 'bookEntries', params: { bookId: row.bookId } }" class="inline-flex items-center gap-1 group">
                                            <i class="pi pi-book mr-1" :style="{ color: bookStore.booksMap[row.bookId].color }"></i>
                                            <span class="group-hover:underline">{{ bookStore.booksMap[row.bookId].name }}</span>
                                        </router-link>
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
                                    <template v-if="tagStore.tagsMap[row.tagId]">
                                        <router-link :to="{ name: 'tagEntries', params: { tagId: row.tagId } }" class="inline-flex items-center gap-1 group">
                                            <i class="pi pi-tag mr-1" :style="{ color: tagStore.tagsMap[row.tagId].color }"></i>
                                            <span class="group-hover:underline">{{ tagStore.tagsMap[row.tagId].name }}</span>
                                        </router-link>
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
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    </div>
</template>
