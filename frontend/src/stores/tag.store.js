import { tagService } from '@/service/tagService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useTagStore = defineStore('tag', () => {
    const profileStore = useProfileStore();

    let inFlightRequest = null;

    // States

    const isLoading = ref(false);
    const tags = ref([]);
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

            tags.value = [];

            const profileId = profileStore.activeProfile?.id;
            if (profileId) {
                await _fetchTags(profileId);
            } else {
                error.value = null;
            }
        }
    );

    async function _fetchTags(profileId) {
        isLoading.value = true;
        error.value = null;

        try {
            const apiResponseData = await tagService.getTags(profileId);
            tags.value = apiResponseData.tags;
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
        }
    }

    // Getters

    const tagsMap = computed(() => {
        const map = {};
        tags.value.forEach((tag) => {
            map[tag.id] = tag;
        });
        return map;
    });

    // Actions

    async function initialize() {
        const profileId = profileStore.activeProfile?.id;
        if (profileId) {
            await _fetchTags(profileId);
        }
    }

    return {
        // States
        isLoading,
        tags,
        error,

        // Getters
        tagsMap,

        // Actions
        initialize
    };
});
