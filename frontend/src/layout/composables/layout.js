import { computed, reactive } from 'vue';

const layoutConfig = reactive({
    preset: 'Aura',
    primary: 'emerald',
    surface: null,
    darkTheme: false,
    menuMode: 'static'
});

const layoutState = reactive({
    activeMenuItem: null,
    menuHoverActive: false, // Use ?
    overlayMenuActive: false,
    staticMenuMobileActive: false,
    staticMenuDesktopInactive: false,
    profileSidebarVisible: false, // Not in use
    configSidebarVisible: false // Not in use
});

export function useLayout() {
    const getPrimary = computed(() => layoutConfig.primary);

    const getSurface = computed(() => layoutConfig.surface);

    const toggleDarkMode = () => {
        if (!document.startViewTransition) {
            executeDarkModeToggle();

            return;
        }

        document.startViewTransition(() => executeDarkModeToggle(event));
    };

    const executeDarkModeToggle = () => {
        layoutConfig.darkTheme = !layoutConfig.darkTheme;
        document.documentElement.classList.toggle('app-dark');
    };

    const isDarkTheme = computed(() => layoutConfig.darkTheme);

    const setActiveMenuItem = (item) => {
        layoutState.activeMenuItem = item.value || item;
    };

    const toggleMenu = () => {
        if (layoutConfig.menuMode === 'overlay') {
            layoutState.overlayMenuActive = !layoutState.overlayMenuActive;
        }

        if (window.innerWidth <= 991) {
            layoutState.staticMenuMobileActive = !layoutState.staticMenuMobileActive;
        } else {
            layoutState.staticMenuDesktopInactive = !layoutState.staticMenuDesktopInactive;
        }
    };

    const isSidebarActive = computed(() => layoutState.overlayMenuActive || layoutState.staticMenuMobileActive);

    return {
        layoutConfig,
        layoutState,
        getPrimary,
        getSurface,
        toggleDarkMode,
        isDarkTheme,
        setActiveMenuItem,
        toggleMenu,
        isSidebarActive
    };
}
