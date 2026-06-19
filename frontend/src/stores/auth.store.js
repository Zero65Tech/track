import { authService } from '@/service/authService';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, ref } from 'vue';

export const useAuthStore = defineStore('auth', () => {
    const toast = useToast();

    const prefix = ['prod', 'gamma'].includes(import.meta.env.MODE) ? 'auth' : 'test.auth';
    const localStorageKeys = {
        user: `${prefix}.user`,
        token: `${prefix}.token`
    };

    // States

    const isLoading = ref(true);
    const user = ref(null);
    const token = ref(null);
    const error = ref(null);

    // Getters

    const userName = computed(() => user.value?.displayName || user.value?.email || 'User');
    const isAuthenticated = computed(() => token.value !== null);

    // Actions

    async function initialize() {
        const savedUser = localStorage.getItem(localStorageKeys.user) || null;
        const savedToken = localStorage.getItem(localStorageKeys.token) || null;

        if (savedUser && savedToken) {
            user.value = JSON.parse(savedUser);
            token.value = savedToken;
        }

        authService.onAuthStateChanged(async (currentUser) => {
            if (currentUser) {
                const newToken = await authService.getIdToken();

                user.value = currentUser;
                token.value = newToken;

                localStorage.setItem(localStorageKeys.user, JSON.stringify(currentUser));
                localStorage.setItem(localStorageKeys.token, newToken);
            } else {
                user.value = null;
                token.value = null;
                localStorage.removeItem(localStorageKeys.user);
                localStorage.removeItem(localStorageKeys.token);
            }
            isLoading.value = false;
        });
    }

    async function refreshToken() {
        const newToken = await authService.getIdToken();
        token.value = newToken;
        localStorage.setItem(localStorageKeys.token, newToken);
    }

    async function loginWithGoogle() {
        isLoading.value = true;
        error.value = null;

        try {
            await authService.loginWithGoogle();
            // The onAuthStateChanged listener will handle updating the user and token states.
            toast.add({
                severity: 'success',
                summary: 'Signed in',
                detail: `Welcome, ${userName.value}!`,
                life: 3000
            });
        } catch (err) {
            isLoading.value = false;
            error.value = err.message;
            toast.add({
                severity: 'error',
                summary: 'Sign in failed',
                detail: error.value,
                life: 3000
            });
            console.log(err);
        }
    }

    async function logout() {
        isLoading.value = true;
        error.value = null;

        try {
            await authService.logout();
            // The onAuthStateChanged listener will handle updating the user and token states.
            toast.add({
                severity: 'success',
                summary: 'Signed out',
                detail: 'You have been successfully signed out.',
                life: 3000
            });
        } catch (err) {
            isLoading.value = false;
            error.value = err.message;
            toast.add({
                severity: 'error',
                summary: 'Sign out failed',
                detail: error.value,
                life: 3000
            });
            console.log(err);
        }
    }

    return {
        // State
        isLoading,
        user,
        token,
        error,

        // Getters
        userName,
        isAuthenticated,

        // Actions
        initialize,
        refreshToken,
        loginWithGoogle,
        logout
    };
});
