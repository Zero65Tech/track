<script setup>
import { useLayout } from '@/layout/composables/layout';
import { computed, ref, watch } from 'vue';
import AppFooter from './AppFooter.vue';
import AppSidebar from './AppSidebar.vue';
import AppAccountSidebar from './AppAccountSidebar.vue';
import AppTopbar from './AppTopbar.vue';

const { layoutConfig, layoutState, isSidebarActive, isAccountSidebarActive } = useLayout();

const outsideClickListener = ref(null);

watch([isSidebarActive, isAccountSidebarActive], ([sidebarActive, accountSidebarActive]) => {
    if (sidebarActive || accountSidebarActive) {
        bindOutsideClickListener();
    } else {
        unbindOutsideClickListener();
    }
});

const containerClass = computed(() => {
    return {
        'layout-overlay': layoutConfig.menuMode === 'overlay',
        'layout-static': layoutConfig.menuMode === 'static',
        'layout-static-inactive': layoutState.staticMenuDesktopInactive && layoutConfig.menuMode === 'static',
        'layout-overlay-active': layoutState.overlayMenuActive,
        'layout-mobile-active': layoutState.staticMenuMobileActive,

        'layout-account-sidebar-active': layoutState.accountSidebarActive
    };
});

function bindOutsideClickListener() {
    if (!outsideClickListener.value) {
        outsideClickListener.value = (event) => {
            if (isOutsideClicked(event)) {
                layoutState.menuHoverActive = false;
                layoutState.overlayMenuActive = false;
                layoutState.staticMenuMobileActive = false;
                layoutState.accountSidebarActive = false;
            }
        };
        document.addEventListener('click', outsideClickListener.value);
    }
}

function unbindOutsideClickListener() {
    if (outsideClickListener.value) {
        document.removeEventListener('click', outsideClickListener.value);
        outsideClickListener.value = null;
    }
}

function isOutsideClicked(event) {
    const sidebarEl = document.querySelector('.layout-sidebar');
    const accountSidebarEl = document.querySelector('.layout-account-sidebar');
    const topbarMenuButtonEl = document.querySelector('.layout-menu-button');
    const topbarAccountButtonEl = document.querySelector('.layout-account-button');

    return !(
        (sidebarEl && (sidebarEl.isSameNode(event.target) || sidebarEl.contains(event.target))) ||
        (topbarMenuButtonEl && (topbarMenuButtonEl.isSameNode(event.target) || topbarMenuButtonEl.contains(event.target))) ||
        (accountSidebarEl && (accountSidebarEl.isSameNode(event.target) || accountSidebarEl.contains(event.target))) ||
        (topbarAccountButtonEl && (topbarAccountButtonEl.isSameNode(event.target) || topbarAccountButtonEl.contains(event.target)))
    );
}
</script>

<template>
    <div class="layout-wrapper" :class="containerClass">
        <app-topbar></app-topbar>
        <app-sidebar></app-sidebar>
        <app-account-sidebar></app-account-sidebar>
        <div class="layout-main-container">
            <div class="layout-main">
                <router-view></router-view>
            </div>
            <app-footer></app-footer>
        </div>
        <div class="layout-mask animate-fadein"></div>
    </div>
    <Toast />
</template>
