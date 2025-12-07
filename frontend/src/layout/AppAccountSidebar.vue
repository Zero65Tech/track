<script setup>
import { computed } from 'vue';
import { useLayout } from '@/layout/composables/layout';
import { useAuthStore } from '@/stores/auth.store';

const { layoutState } = useLayout();
const authStore = useAuthStore();

const isAuthenticated = computed(() => authStore.isAuthenticated);
const userName = computed(() => authStore.userName);
const userEmail = computed(() => authStore.user?.email);
const userPhotoURL = computed(() => authStore.user?.photoURL);

const handleLoginClick = async () => {
    try {
        await authStore.loginWithGoogle();
        layoutState.accountSidebarActive = false;
    } catch (err) {
        console.error('Login error:', err);
    }
};

const handleLogoutClick = async () => {
    try {
        await authStore.logout();
        layoutState.accountSidebarActive = false;
    } catch (err) {
        console.error('Logout error:', err);
    }
};
</script>

<template>
    <div class="layout-account-sidebar">
        <!-- Authenticated User View -->
        <template v-if="isAuthenticated">
            <div class="user-profile-card">
                <div class="user-avatar">
                    <img v-if="userPhotoURL" :src="userPhotoURL" :alt="userName" class="avatar-image" />
                    <i v-else class="pi pi-user avatar-icon"></i>
                </div>
                <div class="user-info">
                    <p class="user-name">{{ userName }}</p>
                    <p class="user-email">{{ userEmail }}</p>
                </div>
            </div>

            <div class="account-actions">
                <button class="account-action-button" @click="handleLogoutClick">
                    <i class="pi pi-sign-out"></i>
                    <span>Logout</span>
                </button>
            </div>
        </template>

        <!-- Unauthenticated User View -->
        <template v-else>
            <div class="auth-prompt">
                <i class="pi pi-user-plus auth-icon"></i>
                <p class="auth-message">Sign in to your account</p>
            </div>

            <div class="account-actions">
                <button class="account-action-button login-button" @click="handleLoginClick" :disabled="authStore.isLoading">
                    <i class="pi pi-google"></i>
                    <span>{{ authStore.isLoading ? 'Signing in...' : 'Login with Google' }}</span>
                </button>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped></style>
