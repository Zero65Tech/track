import { profileService } from '@/service/profileService';
import { useAuthStore } from '@/stores/auth.store';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useProfileStore = defineStore('profile', () => {
    const authStore = useAuthStore();

    const localStorageKey = computed(() => `profile.active.${authStore.user?.uid || 'guest'}`);
    let inFlightRequest = null;

    // States

    const accessible = {
        isLoading: ref(false),
        profiles: ref([]),
        error: ref(null)
    };

    const template = {
        isLoading: ref(false),
        profiles: ref([]),
        error: ref(null)
    };

    const activeProfile = ref(null);

    // Internal Functions

    watch(
        () => authStore.isAuthenticated,
        async (isAuthenticated) => {
            // NOTE: This may not work as expected if the user logs in/out quickly,
            // but it should be good enough for now. We can improve this later if needed.
            if (inFlightRequest) {
                await inFlightRequest;
            }

            accessible.profiles.value = [];
            activeProfile.value = JSON.parse(localStorage.getItem(localStorageKey.value)) || null;

            if (isAuthenticated) {
                inFlightRequest = _fetchAccessibles();
            } else {
                accessible.error.value = null;
                _autoSelectActive();
            }
        }
    );

    async function _fetchAccessibles() {
        accessible.isLoading.value = true;
        accessible.error.value = null;

        try {
            const apiResponseData = await profileService.getAllAccessible();
            accessible.profiles.value = apiResponseData.profiles;
        } catch (err) {
            accessible.error.value = err.message;
            console.log(err);
        } finally {
            accessible.isLoading.value = false;
        }

        _autoSelectActive();
    }

    async function _fetchTemplates() {
        template.isLoading.value = true;
        template.error.value = null;

        try {
            const apiResponseData = await profileService.getTemplatesBySystem();
            template.profiles.value = apiResponseData.profiles;
        } catch (err) {
            template.error.value = err.message;
            console.log(err);
        } finally {
            template.isLoading.value = false;
        }

        _autoSelectActive();
    }

    function _autoSelectActive() {
        if (accessible.isLoading.value || template.isLoading.value) {
            return;
        }

        const profiles = [...accessible.profiles.value, ...template.profiles.value];
        if (!activeProfile.value || !profiles.find((p) => p.id === activeProfile.value.id)) {
            activeProfile.value = profiles[0];
        }
    }

    // Actions

    async function initialize() {
        activeProfile.value = JSON.parse(localStorage.getItem(localStorageKey.value)) || null;
        _fetchTemplates();
        if (authStore.isAuthenticated) {
            inFlightRequest = _fetchAccessibles();
        }
    }

    async function refreshAccessibles() {
        if (!authStore.isAuthenticated) {
            throw new Error('Not authenticated');
        } else if (accessible.isLoading.value) {
            throw new Error('Request already in flight');
        } else {
            inFlightRequest = _fetchAccessibles();
        }
    }

    async function refreshTemplates() {
        if (template.isLoading.value) {
            throw new Error('Request already in flight');
        } else {
            _fetchTemplates();
        }
    }

    function setActive(profile) {
        activeProfile.value = profile;
        localStorage.setItem(localStorageKey.value, JSON.stringify(profile));
    }

    return {
        // States
        accessible,
        template,
        activeProfile,

        // Actions
        initialize,
        refreshAccessibles,
        refreshTemplates,
        setActive
    };
});
