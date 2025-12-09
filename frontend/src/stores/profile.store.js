import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { ProfileAccess, ProfileState } from '@zero65/track';
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

    const active = ref(JSON.parse(localStorage.getItem(localStorageKey.value)) || null);

    // Actions
    async function fetchAccessibles() {
        accessible.isLoading.value = true;
        accessible.profiles.value = [];
        accessible.error.value = null;

        try {
            const profiles = await profileService.getAllAccessible();
            profiles.forEach(async (profile, index) => {
                await new Promise((resolve) => setTimeout(resolve, index * 100));
                accessible.profiles.value.push(profile);
            });

            // Sort
            const accessIds = Object.values(ProfileAccess).map((access) => access.id);
            const stateIds = Object.values(ProfileState).map((state) => state.id);
            accessible.profiles.value.sort((a, b) => {
                return stateIds.indexOf(a.state) - stateIds.indexOf(b.state) || accessIds.indexOf(a.access) - accessIds.indexOf(b.access);
            });
            if (active.value && !accessible.profiles.value.find((p) => p.id === active.value.id)) {
                setActive(null);
            }
            if (!active.value && accessible.profiles.value.length > 0) {
                setActive(accessible.profiles.value[0]);
            }
        } catch (err) {
            accessible.error.value = err.message;
            throw err;
        } finally {
            accessible.isLoading.value = false;
        }
    }

    async function fetchTemplates() {
        template.isLoading.value = true;
        template.profiles.value = [];
        template.error.value = null;

        try {
            const profiles = await profileService.getTemplatesBySystem();
            profiles.forEach(async (profile, index) => {
                await new Promise((resolve) => setTimeout(resolve, index * 100));
                template.profiles.value.push(profile);
            });
        } catch (err) {
            template.error.value = err.message;
            throw err;
        } finally {
            template.isLoading.value = false;
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
        fetchAccessibles,
        fetchTemplates,
        setActive
    };
});
