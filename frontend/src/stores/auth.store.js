import { ref, computed } from 'vue';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { authService } from '@/service/authService';

export const useAuthStore = defineStore('auth', () => {
    const toast = useToast();

    const localStorageKeys = {
        user: 'auth.user',
        token: 'auth.token'
    };

    // States
    const isLoading = ref(false);
    const user = ref(null);
    const token = ref(null);
    const unsubscribe = ref(null);
    const error = ref(null);

    // Getters
    const isAuthenticated = computed(() => user.value !== null);
    const userName = computed(() => user.value?.displayName || user.value?.email || 'User');

    // Actions
    async function initialize() {
        // Restore user from localStorage if available
        const savedUser = localStorage.getItem(localStorageKeys.user);
        const savedToken = localStorage.getItem(localStorageKeys.token);

        if (savedUser && savedToken) {
            user.value = JSON.parse(savedUser);
            token.value = savedToken;
        }

        // Set up auth state listener
        unsubscribe.value = authService.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                user.value = currentUser;
                localStorage.setItem(localStorageKeys.user, JSON.stringify(currentUser));
                // Fetch fresh token when auth state changes
                authService.getIdToken().then((newToken) => {
                    token.value = newToken;
                    localStorage.setItem(localStorageKeys.token, newToken);
                });
            } else {
                user.value = null;
                token.value = null;
                localStorage.removeItem(localStorageKeys.user);
                localStorage.removeItem(localStorageKeys.token);
            }
        });
    }

    async function refreshToken() {
        try {
            const newToken = await authService.getIdToken();
            token.value = newToken;
            localStorage.setItem(localStorageKeys.token, newToken);
        } catch (err) {
            error.value = err.message;
            throw err;
        }
    }

    async function loginWithGoogle() {
        isLoading.value = true;
        error.value = null;

        try {
            const currentUser = await authService.loginWithGoogle();
            user.value = currentUser;

            // Get ID token
            const idToken = await authService.getIdToken();
            token.value = idToken;

            // Persist to localStorage
            localStorage.setItem(localStorageKeys.user, JSON.stringify(currentUser));
            localStorage.setItem(localStorageKeys.token, idToken);

            toast.add({
                // TODO: Consolidate toast handling
                severity: 'success',
                summary: 'Success',
                detail: `Welcome, ${currentUser.displayName || 'User'}!`,
                life: 3000
            });
        } catch (err) {
            error.value = err.message;
            toast.add({
                // TODO: Consolidate toast handling
                severity: 'error',
                summary: 'Sign in failed',
                detail: error.value,
                life: 3000
            });
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    async function logout() {
        isLoading.value = true;
        error.value = null;

        try {
            await authService.logout();

            user.value = null;
            token.value = null;
            localStorage.removeItem(localStorageKeys.user);
            localStorage.removeItem(localStorageKeys.token);

            toast.add({
                // TODO: Consolidate toast handling
                severity: 'success',
                summary: 'Signed out',
                detail: 'You have been successfully signed out.',
                life: 3000
            });
        } catch (err) {
            error.value = err.message;
            toast.add({
                // TODO: Consolidate toast handling
                severity: 'error',
                summary: 'Sign out failed',
                detail: error.value,
                life: 3000
            });
            throw err;
        } finally {
            isLoading.value = false;
        }
    }

    return {
        // State
        isLoading,
        user,
        token,
        error,

        // Getters
        isAuthenticated,
        userName,

        // Actions
        initialize,
        refreshToken,
        loginWithGoogle,
        logout
    };
});
