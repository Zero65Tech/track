import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { createPinia } from 'pinia';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/styles.scss';
import '@/assets/tailwind.css';

import { useAuthStore } from '@/stores/auth.store';
import { useBookStore } from '@/stores/book.store';
import { useFcmStore } from '@/stores/fcm.store';
import { useHeadStore } from '@/stores/head.store';
import { useProfileStore } from '@/stores/profile.store';
import { useSourceStore } from '@/stores/source.store';
import { useTagStore } from '@/stores/tag.store';

const app = createApp(App);
app.use(router);

const pinia = createPinia();
app.use(pinia);

app.use(PrimeVue, {
    theme: {
        preset: Aura,
        options: {
            darkModeSelector: '.app-dark'
        }
    }
});
app.use(ConfirmationService);
app.use(ToastService);

app.mount('#app');

// Initialize auth store
const authStore = useAuthStore();
/* await */ authStore.initialize();

// Initialize fcm store
const fcmStore = useFcmStore();
/* await */ fcmStore.initialize();

// Initialize profile store
const profileStore = useProfileStore();
/* await */ profileStore.initialize();

// Initialize book store
const bookStore = useBookStore();
/* await */ bookStore.initialize();

// Initialize head store
const headStore = useHeadStore();
/* await */ headStore.initialize();

// Initialize tag store
const tagStore = useTagStore();
/* await */ tagStore.initialize();

// Initialize source store
const sourceStore = useSourceStore();
/* await */ sourceStore.initialize();
