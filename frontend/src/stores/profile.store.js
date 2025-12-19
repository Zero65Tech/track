import { ref, computed, watch } from 'vue';
import { defineStore } from 'pinia';
import { ProfileAccess, ProfileState } from '@shared/enums';
import { useAuthStore } from '@/stores/auth.store';
import { profileService } from '@/service/profileService';

export const useProfileStore = defineStore('profile', () => {
    const authStore = useAuthStore();

    const localStorageKey = computed(() => `profile.active.${authStore.user?.uid || 'guest'}`);

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

    const active = ref(null);

    // Actions
    async function initialize() {
        active.value = JSON.parse(localStorage.getItem(localStorageKey.value)) || null;
        fetchTemplates();
        if (authStore.isAuthenticated) {
            fetchAccessibles();
        }
    }

    watch(
        () => authStore.isAuthenticated,
        (isAuthenticated) => {
            active.value = JSON.parse(localStorage.getItem(localStorageKey.value)) || null;
            if (isAuthenticated) {
                fetchAccessibles();
            } else {
                accessible.profiles.value = [];
                accessible.error.value = null;
                autoSelectActive();
            }
        }
    );

    async function fetchAccessibles() {
        accessible.isLoading.value = true;
        accessible.profiles.value = [];
        accessible.error.value = null;

        try {
            const profiles = await profileService.getAllAccessible();

            // Sort
            const accessIds = Object.values(ProfileAccess).map((access) => access.id);
            const stateIds = Object.values(ProfileState).map((state) => state.id);
            profiles.sort((a, b) => {
                return stateIds.indexOf(a.state) - stateIds.indexOf(b.state) || accessIds.indexOf(a.access) - accessIds.indexOf(b.access);
            });

            for (let profile of profiles) {
                profile.access = Object.values(ProfileAccess).find((access) => access.id === profile.access);
                profile.state = Object.values(ProfileState).find((state) => state.id === profile.state);
            }

            accessible.profiles.value = profiles;
        } catch (err) {
            accessible.error.value = err.message;
            throw err;
        } finally {
            accessible.isLoading.value = false;
        }

        autoSelectActive();
    }

    async function fetchTemplates() {
        template.isLoading.value = true;
        template.error.value = null;

        try {
            const profiles = await profileService.getTemplatesBySystem();

            for (let profile of profiles) {
                profile.access = Object.values(ProfileAccess).find((access) => access.id === profile.access);
                profile.state = Object.values(ProfileState).find((state) => state.id === profile.state);
            }

            template.profiles.value = profiles;
        } catch (err) {
            template.error.value = err.message;
            throw err;
        } finally {
            template.isLoading.value = false;
        }

        autoSelectActive();
    }

    function autoSelectActive() {
        if (accessible.isLoading.value || template.isLoading.value) {
            return;
        }
        const profiles = [...accessible.profiles.value, ...template.profiles.value];
        if (!active.value || !profiles.find((p) => p.id === active.value.id)) {
            active.value = profiles[0];
        }
    }

    function setActive(profile) {
        active.value = profile;
        localStorage.setItem(localStorageKey.value, JSON.stringify(profile));
    }

    return {
        // States
        accessible,
        template,
        active,

        // Actions
        initialize,
        setActive
    };
});
