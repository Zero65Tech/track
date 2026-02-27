import { headService } from '@/service/headService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

export const useHeadStore = defineStore('head', () => {
    const toast = useToast();
    const profileStore = useProfileStore();
    let abortController = new AbortController();

    // States

    const isLoading = ref(false);
    const heads = ref([]);
    const error = ref(null);

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
        if (profileStore.activeProfile) {
            await fetchHeads();
        }
    }

    watch(
        () => profileStore.activeProfile,
        () => {
            // Abort all in-flight requests
            abortController.abort();
            abortController = new AbortController();
            if (profileStore.activeProfile) {
                fetchHeads();
            } else {
                heads.value = [];
                error.value = null;
            }
        }
    );

    async function fetchHeads() {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            toast.add({
                severity: 'error',
                summary: 'Refresh failed',
                detail: 'Kindly select a profile to fetch heads',
                life: 3000
            });
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            heads.value = await headService.getHeads({ profileId }, abortController.signal);
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
        heads,
        error,

        // Getters
        headsMap,

        // Actions
        initialize,
        fetchHeads
    };
});
