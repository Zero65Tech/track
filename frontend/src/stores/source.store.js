import { sourceService } from '@/service/sourceService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

export const useSourceStore = defineStore('source', () => {
    const toast = useToast();
    const profileStore = useProfileStore();
    let abortController = new AbortController();

    // States

    const isLoading = ref(false);
    const sources = ref([]);
    const error = ref(null);

    // Getters

    const sourcesMap = computed(() => {
        const map = {};
        sources.value.forEach((source) => {
            map[source.id] = source;
        });
        return map;
    });

    // Actions

    async function initialize() {
        if (profileStore.activeProfile) {
            await fetchSources();
        }
    }

    watch(
        () => profileStore.activeProfile,
        () => {
            // Abort all in-flight requests
            abortController.abort();
            abortController = new AbortController();
            if (profileStore.activeProfile) {
                fetchSources();
            } else {
                sources.value = [];
                error.value = null;
            }
        }
    );

    async function fetchSources() {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            toast.add({
                severity: 'error',
                summary: 'Refresh failed',
                detail: 'Kindly select a profile to fetch sources',
                life: 3000
            });
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            sources.value = await sourceService.getSources({ profileId }, abortController.signal);
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
        }
    }

    return {
        // States
        isLoading,
        sources,
        error,

        // Getters
        sourcesMap,

        // Actions
        initialize,
        fetchSources
    };
});
