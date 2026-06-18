import { headService } from '@/service/headService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useHeadStore = defineStore('head', () => {
    const profileStore = useProfileStore();

    let inFlightRequest = null;

    // States

    const isLoading = ref(false);
    const heads = ref([]);
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

            heads.value = [];

            const profileId = profileStore.activeProfile?.id;
            if (profileId) {
                await _fetchHeads(profileId);
            } else {
                error.value = null;
            }
        }
    );

    async function _fetchHeads(profileId) {
        isLoading.value = true;
        error.value = null;

        try {
            const apiResponseData = await headService.getHeads(profileId);
            heads.value = apiResponseData.heads;
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
        }
    }

    // Getters

    const headsMap = computed(() => {
        const map = {};
        heads.value.forEach((head) => {
            map[head.id] = head;
        });
        return map;
    });

    // Actions

    async function initialize() {
        const profileId = profileStore.activeProfile?.id;
        if (profileId) {
            await _fetchHeads(profileId);
        }
    }

    return {
        // States
        isLoading,
        heads,
        error,

        // Getters
        headsMap,

        // Actions
        initialize
    };
});
