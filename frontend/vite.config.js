import { fileURLToPath, URL } from 'node:url';

import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import vueDevTools from 'vite-plugin-vue-devtools';

import { PrimeVueResolver } from '@primevue/auto-import-resolver';
import tailwindcss from '@tailwindcss/vite';
import Components from 'unplugin-vue-components/vite';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
    const { VITE_BACKEND_HOST } = loadEnv(mode, process.cwd(), '');
    return {
        optimizeDeps: {
            noDiscovery: true
        },
        plugins: [
            vue(),
            vueDevTools(),
            tailwindcss(),
            Components({
                resolvers: [PrimeVueResolver()]
            })
        ],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url))
            }
        },
        server: {
            proxy: {
                '/api': VITE_BACKEND_HOST
            }
        }
    };
});
