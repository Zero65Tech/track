import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { deviceService } from '@/service/deviceService';
import { fcmService } from '@/service/fcmService';

import { useAuthStore } from '@/stores/auth.store';

export const useFcmStore = defineStore('fcm', () => {
    const authStore = useAuthStore();

    const localStorageKey = `${['prod', 'gamma'].includes(import.meta.env.MODE) ? '' : 'test.'}fcm.deviceId`;

    // States

    const deviceId = ref(null);

    // Internal Functions

    watch(
        () => authStore.isAuthenticated,
        (isAuthenticated) => {
            if (isAuthenticated && deviceId.value) {
                deviceService.claimDevice(deviceId.value);
            }
        }
    );

    // Actions

    async function initialize(fcmToken) {
        const savedDeviceId = localStorage.getItem(localStorageKey) || null;

        if (savedDeviceId) {
            await deviceService.updateDevice(savedDeviceId, fcmToken);
            deviceId.value = savedDeviceId;
        } else {
            const apiResponseData = await deviceService.createDevice(fcmToken);
            deviceId.value = apiResponseData.device.id;
            localStorage.setItem(localStorageKey, apiResponseData.device.id);
        }

        if (authStore.isAuthenticated) {
            await deviceService.claimDevice(deviceId.value);
        }

        fcmService.onFcmTokenRefresh(async (fcmToken) => {
            await deviceService.updateDevice(deviceId.value, fcmToken);
        });
    }

    return { initialize };
});
