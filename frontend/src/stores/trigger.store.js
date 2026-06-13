import { triggerService } from '@/service/triggerService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

export const useTriggerStore = defineStore('trigger', () => {
    const profileStore = useProfileStore();

    let inFlightRequest = null;

    // States

    const isLoading = ref(true);
    const triggers = ref([]);
    const error = ref(null);

    // Internal Functions

    async function _fetchTriggers(profileId, lastCreatedAt) {
        isLoading.value = true;
        error.value = null;

        try {
            const apiResponseData = await triggerService.getTriggers(profileId, lastCreatedAt);
            triggers.value.push(...apiResponseData.triggers);
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
        }
    }

    watch(
        () => profileStore.activeProfile,
        async () => {
            // NOTE: This may not work as expected if the user switches profiles quickly,
            // but it should be good enough for now. We can improve this later if needed.
            if (inFlightRequest) {
                await inFlightRequest;
            }

            triggers.value = [];

            const profileId = profileStore.activeProfile?.id;
            if (profileId) {
                inFlightRequest = _fetchTriggers(profileId);
            } else {
                error.value = null;
            }
        }
    );

    // Actions

    async function initialize() {
        const profileId = profileStore.activeProfile?.id;
        if (profileId) {
            inFlightRequest = _fetchTriggers(profileId);
        }
    }

    async function refresh() {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            console.error('No profile selected');
        } else if (isLoading.value) {
            console.error('Request already in flight');
        } else {
            triggers.value = [];
            inFlightRequest = _fetchTriggers(profileId);
        }
    }

    async function loadMore() {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            console.error('No profile selected');
        } else if (isLoading.value) {
            console.error('Request already in flight');
        } else if (triggers.value.length === 0) {
            console.error('No triggers to load more');
        } else {
            const lastTrigger = triggers.value[triggers.value.length - 1];
            const lastCreatedAt = lastTrigger ? lastTrigger.createdAt : null;
            inFlightRequest = _fetchTriggers(profileId, lastCreatedAt);
        }
    }

    return {
        // States
        isLoading,
        triggers,
        error,

        // Actions
        initialize,
        refresh,
        loadMore
    };
});
