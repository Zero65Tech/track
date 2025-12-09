import { createApp } from 'vue';
import App from './App.vue';
import router from './router';

import { createPinia } from 'pinia';

import Aura from '@primeuix/themes/aura';
import PrimeVue from 'primevue/config';
import ConfirmationService from 'primevue/confirmationservice';
import ToastService from 'primevue/toastservice';

import '@/assets/tailwind.css';
import '@/assets/styles.scss';

import { useAuthStore } from '@/stores/auth.store';
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
authStore.initialize();

// Initialize profile store
const profileStore = useProfileStore();
profileStore.initialize();

app.mount('#app');
