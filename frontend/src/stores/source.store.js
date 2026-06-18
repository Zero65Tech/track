import { sourceService } from '@/service/sourceService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useSourceStore = defineStore('source', () => {
    const profileStore = useProfileStore();

    let inFlightRequest = null;

    // States

    const isLoading = ref(false);
    const sources = ref([]);
    const error = ref(null);

    // Internal Functions

    watch(
        () => profileStore.activeProfile,
        async () => {
            // NOTE: This may not work as expected if the user switches profiles quickly,
            // but it should be good enough for now. We can improve this later if needed.
            if (inFlightRequest) {
                await inFlightRequest;
            }

            sources.value = [];

            const profileId = profileStore.activeProfile?.id;
            if (profileId) {
                await _fetchSources(profileId);
            } else {
                error.value = null;
            }
        }
    );

    async function _fetchSources(profileId) {
        isLoading.value = true;
        error.value = null;

        try {
            const apiResponseData = await sourceService.getSources(profileId);
            sources.value = apiResponseData.sources;
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
        }
    }

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
        const profileId = profileStore.activeProfile?.id;
        if (profileId) {
            await _fetchSources(profileId);
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
        initialize
    };
});
