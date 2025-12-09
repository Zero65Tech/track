<script setup>
import { ProfileState, ProfileAccess } from '@zero65/track';
import { useAuthStore } from '@/stores/auth.store';
import { useProfileStore } from '@/stores/profile.store';

const authStore = useAuthStore();
const profileStore = useProfileStore();

const handleLoginClick = async () => {
    try {
        await authStore.loginWithGoogle();
    } catch (err) {
        console.error('Login error:', err);
    }
};

const handleProfileClick = (profile) => {
    profileStore.setActive(profile);
};

const handleLogoutClick = async () => {
    try {
        await authStore.logout();
    } catch (err) {
        console.error('Logout error:', err);
    }
};

const getAccessBadgeClass = (access) => {
    if (access === 'owner') return 'pi-crown';
    if (access === 'editor') return 'pi-pencil';
    if (access === 'viewer') return 'pi-eye';
    return 'pi-question';
};

const getAccessTitle = (access) => {
    const accessObj = Object.values(ProfileAccess).find((a) => a.id === access);
    if (accessObj) {
        return `${accessObj.name}: ${accessObj.description}`;
    }
    return access;
};

const getProfileStateIcon = (state) => {
    if (state === ProfileState.ACTIVE.id) return 'pi-check-circle';
    if (state === ProfileState.TEMPLATE.id) return 'pi-star';
    if (state === ProfileState.DISABLED.id) return 'pi-lock';
    if (state === ProfileState.DELETED.id) return 'pi-trash';
    if (state === ProfileState.INACTIVE.id) return 'pi-spinner';
    return null;
};

const getStateDescription = (state) => {
    const stateObj = Object.values(ProfileState).find((s) => s.id === state);
    if (stateObj) {
        return `${stateObj.name}: ${stateObj.description}`;
    }
    return state;
};
</script>

<template>
    <div class="layout-account-sidebar">
        <!-- Authenticated User View: User Info -->
        <template v-if="authStore.isAuthenticated">
            <div class="user-profile-card">
                <div class="user-avatar">
                    <img v-if="authStore.user?.photoURL" :src="authStore.user?.photoURL" :alt="authStore.userName" class="avatar-image" />
                    <i v-else class="pi pi-user avatar-icon"></i>
                </div>
                <div class="user-info">
                    <p class="user-name">{{ authStore.userName }}</p>
                    <p class="user-email">{{ authStore.user?.email }}</p>
                </div>
            </div>
        </template>

        <template v-else>
            <div class="auth-prompt">
                <i class="pi pi-user-plus auth-icon"></i>
                <p class="auth-message">Sign in to get started</p>
            </div>
        </template>

        <!-- Profiles Section -->
        <div class="profiles-section">
            <!-- Accessible Profiles Section -->
            <div class="profiles-subsection">
                <!-- Header -->
                <div class="profiles-header">
                    <h3 class="profiles-title">My Profiles</h3>
                </div>

                <!-- Unauthenticated User View -->
                <template v-if="!authStore.isAuthenticated">
                    <div class="account-actions">
                        <button class="account-action-button login-button" @click="handleLoginClick" :disabled="authStore.isLoading">
                            <i class="pi pi-google"></i>
                            <span>{{ authStore.isLoading ? 'Signing in...' : 'Sign in with Google' }}</span>
                        </button>
                    </div>
                </template>

                <!-- Loading State -->
                <div v-else-if="profileStore.accessible.isLoading" class="profiles-loading">
                    <i class="pi pi-spin pi-spinner"></i>
                    <p class="loading-text">Loading your profiles...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="profileStore.accessible.error" class="profiles-error">
                    <i class="pi pi-exclamation-circle"></i>
                    <p class="error-text">{{ profileStore.accessible.error }}</p>
                    <button class="retry-button" @click="profileStore.fetchAccessibles">
                        <i class="pi pi-refresh"></i>
                        <span>Retry</span>
                    </button>
                </div>

                <!-- Empty State: No Profiles -->
                <div v-else-if="!profileStore.accessible.profiles.length" class="no-custom-profiles-prompt">
                    <i class="pi pi-folder-open prompt-icon"></i>
                    <p class="prompt-text">No profiles yet</p>
                    <p class="prompt-subtext">Start by creating a profile from a template below</p>
                </div>

                <ul v-else class="profiles-list">
                    <li v-for="profile in profileStore.accessible.profiles" :key="profile.id" class="profile-item">
                        <button :class="['profile-button', profileStore.active?.id === profile.id && 'profile-button-active']" @click="handleProfileClick(profile)">
                            <div class="profile-content">
                                <div class="profile-name-section">
                                    <i :class="['pi', getAccessBadgeClass(profile.access), 'access-icon']" :title="getAccessTitle(profile.access)"></i>
                                    <span class="profile-name">{{ profile.name }}</span>
                                    <i v-if="getProfileStateIcon(profile.state)" :class="['pi', getProfileStateIcon(profile.state), 'state-icon']" :title="getStateDescription(profile.state)"></i>
                                </div>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>

            <!-- Template Profiles Section -->
            <div class="profiles-subsection">
                <!-- Header -->
                <div class="profiles-header">
                    <h3 class="profiles-title">Templates</h3>
                </div>

                <!-- Loading State -->
                <div v-if="profileStore.template.isLoading" class="profiles-loading">
                    <i class="pi pi-spin pi-spinner"></i>
                    <p class="loading-text">Loading templates...</p>
                </div>

                <!-- Error State -->
                <div v-else-if="profileStore.template.error" class="profiles-error">
                    <i class="pi pi-exclamation-circle"></i>
                    <p class="error-text">{{ profileStore.template.error }}</p>
                    <button class="retry-button" @click="profileStore.fetchTemplates">
                        <i class="pi pi-refresh"></i>
                        <span>Retry</span>
                    </button>
                </div>

                <ul v-else-if="profileStore.template.profiles.length" class="profiles-list">
                    <li v-for="profile in profileStore.template.profiles" :key="profile.id" class="profile-item">
                        <button :class="['profile-button', profileStore.active?.id === profile.id && 'profile-button-active']" @click="handleProfileClick(profile)">
                            <div class="profile-content">
                                <div class="profile-name-section">
                                    <i :class="['pi', getAccessBadgeClass(profile.access), 'access-icon']" :title="getAccessTitle(profile.access)"></i>
                                    <span class="profile-name">{{ profile.name }}</span>
                                    <i v-if="getProfileStateIcon(profile.state)" :class="['pi', getProfileStateIcon(profile.state), 'state-icon']" :title="getStateDescription(profile.state)"></i>
                                </div>
                            </div>
                        </button>
                    </li>
                </ul>
            </div>
        </div>

        <!-- Authenticated User View: Sign Out Button -->
        <template v-if="authStore.isAuthenticated">
            <div class="account-actions">
                <button class="account-action-button" @click="handleLogoutClick">
                    <i class="pi pi-sign-out"></i>
                    <span>Sign out</span>
                </button>
            </div>
        </template>
    </div>
</template>

<style lang="scss" scoped>
.layout-account-sidebar {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1.5rem;

    .user-profile-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1rem;
        background-color: var(--surface-50);
        border-radius: var(--content-border-radius);

        .user-avatar {
            width: 48px;
            height: 48px;
            border-radius: 50%;
            overflow: hidden;
            background-color: var(--surface-hover);
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;

            .avatar-image {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .avatar-icon {
                font-size: 1.5rem;
                color: var(--text-color-secondary);
            }
        }

        .user-info {
            flex: 1;
            min-width: 0;

            .user-name {
                margin: 0;
                font-weight: 600;
                color: var(--text-color);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }

            .user-email {
                margin: 0.25rem 0 0;
                font-size: 0.875rem;
                color: var(--text-color-secondary);
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
        }
    }

    .profiles-section {
        display: flex;
        flex-direction: column;
        gap: 1rem;
        padding: 0.75rem 0;
        border-top: 1px solid var(--surface-border);
        border-bottom: 1px solid var(--surface-border);

        .profiles-loading {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 2rem 1rem;
            text-align: center;

            i {
                font-size: 1.75rem;
                color: var(--primary-color);
            }

            .loading-text {
                margin: 0;
                font-size: 0.875rem;
                color: var(--text-color-secondary);
            }
        }

        .profiles-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 1.5rem 1rem;
            text-align: center;
            background-color: rgba(239, 68, 68, 0.1);
            border-radius: var(--content-border-radius);
            border: 1px solid #ef4444;

            i {
                font-size: 1.75rem;
                color: #ef4444;
            }

            .error-text {
                margin: 0;
                font-size: 0.875rem;
                color: #ef4444;
            }

            .retry-button {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
                padding: 0.5rem 1rem;
                background-color: #ef4444;
                color: white;
                border: none;
                border-radius: var(--content-border-radius);
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color var(--element-transition-duration);

                i {
                    font-size: 0.875rem;
                    color: white;
                }

                &:hover {
                    background-color: #dc2626;
                }
            }
        }

        .profiles-subsection {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;

            .profiles-header {
                padding: 0 0.5rem;

                .profiles-title {
                    margin: 0;
                    font-size: 0.875rem;
                    font-weight: 600;
                    color: var(--text-color-secondary);
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                }

                .profiles-subtitle {
                    margin: 0.25rem 0 0;
                    font-size: 0.75rem;
                    color: var(--text-color-secondary);
                    font-weight: normal;
                    text-transform: none;
                    letter-spacing: normal;
                }
            }

            .profiles-list {
                list-style: none;
                margin: 0;
                padding: 0;
                display: flex;
                flex-direction: column;
                gap: 0.5rem;

                .profile-item {
                    display: flex;
                    position: relative;

                    .profile-button {
                        flex: 1;
                        width: 100%;
                        padding: 0.75rem;
                        background-color: transparent;
                        border: 1px solid var(--surface-border);
                        border-radius: var(--content-border-radius);
                        cursor: pointer;
                        transition: all var(--element-transition-duration);
                        text-align: left;
                        display: flex;
                        flex-direction: column;

                        &:hover:not(.profile-button-disabled):not(:disabled) {
                            background-color: var(--surface-hover);
                            border-color: var(--primary-color);
                        }

                        &.profile-button-active {
                            background-color: var(--surface-hover);
                            border-color: var(--primary-color);
                            color: var(--text-color);

                            .profile-name-section,
                            .profile-meta {
                                color: var(--text-color);
                            }

                            .profile-name {
                                color: var(--primary-color);
                                font-weight: 600;
                            }

                            .access-icon {
                                color: var(--primary-color);
                            }

                            .state-icon {
                                color: var(--primary-color);
                            }
                        }

                        .profile-content {
                            display: flex;
                            flex-direction: column;
                            gap: 0.5rem;
                            flex: 1;

                            .profile-name-section {
                                display: flex;
                                align-items: center;
                                justify-content: space-between;
                                gap: 0.5rem;
                                color: var(--text-color);

                                .profile-name {
                                    font-weight: 500;
                                    flex: 1;
                                    overflow: hidden;
                                    text-overflow: ellipsis;
                                    white-space: nowrap;
                                }

                                .access-icon {
                                    font-size: 0.875rem;
                                    flex-shrink: 0;
                                    color: var(--text-color-secondary);
                                    transition: color var(--element-transition-duration);
                                }
                            }
                        }
                    }

                    .state-icon {
                        font-size: 0.875rem;
                        flex-shrink: 0;
                        color: var(--text-color-secondary);
                        display: flex;
                        align-items: center;
                        justify-content: center;

                        &.pi-spinner {
                            animation: spin 2s linear infinite;
                        }

                        .profile-button-active & {
                            color: var(--primary-contrast-color);
                        }

                        .profile-button-readonly & {
                            color: #f59e0b;
                        }

                        .profile-button-disabled & {
                            color: #ef4444;
                        }
                    }

                    .access-icon {
                        .profile-button-active & {
                            color: var(--primary-color);
                        }
                    }
                }
            }
        }

        .no-custom-profiles-prompt {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            padding: 1.5rem 1rem;
            text-align: center;

            .prompt-icon {
                font-size: 1.75rem;
                color: var(--text-color-secondary);
            }

            .prompt-text {
                margin: 0;
                font-weight: 500;
                color: var(--text-color);
            }

            .prompt-subtext {
                margin: 0;
                font-size: 0.875rem;
                color: var(--text-color-secondary);
            }

            .create-profile-btn {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                margin-top: 0.5rem;
                padding: 0.5rem 1rem;
                background-color: var(--primary-color);
                color: var(--primary-contrast-color);
                border: none;
                border-radius: var(--content-border-radius);
                font-size: 0.875rem;
                font-weight: 500;
                cursor: pointer;
                transition: background-color var(--element-transition-duration);

                &:hover {
                    background-color: var(--primary-600);
                }
            }
        }
    }

    .account-actions {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;

        .account-action-button {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem 1rem;
            background-color: var(--surface-hover);
            border: 1px solid var(--surface-border);
            border-radius: var(--content-border-radius);
            color: var(--text-color);
            font-weight: 500;
            cursor: pointer;
            transition: all var(--element-transition-duration);

            &:hover:not(:disabled) {
                background-color: var(--surface-0);
                border-color: var(--primary-color);
                color: var(--primary-color);
            }

            &:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }

            i {
                font-size: 1rem;
            }

            &.login-button {
                background-color: var(--primary-color);
                border-color: var(--primary-color);
                color: var(--primary-contrast-color);

                &:hover:not(:disabled) {
                    background-color: var(--primary-600);
                    border-color: var(--primary-600);
                }
            }
        }
    }

    .auth-prompt {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 0.75rem;
        padding: 2rem 1rem;
        text-align: center;

        .auth-icon {
            font-size: 2rem;
            color: var(--text-color-secondary);
        }

        .auth-message {
            margin: 0;
            font-weight: 500;
            color: var(--text-color);
        }
    }
}

@keyframes spin {
    from {
        transform: rotate(0deg);
    }
    to {
        transform: rotate(360deg);
    }
}
</style>
