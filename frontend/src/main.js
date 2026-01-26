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
import { useFcmStore } from '@/stores/fcm.store';
import { useProfileStore } from '@/stores/profile.store';

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

// Initialize auth store
const authStore = useAuthStore();
/* await */ authStore.initialize();

// Initialize fcm store
const fcmStore = useFcmStore();
/* await */ fcmStore.initialize();

// Initialize profile store
const profileStore = useProfileStore();
/* await */ profileStore.initialize();

app.mount('#app');
