import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useAuthStore } from '@/stores/auth.store';
import { fcmService } from '@/service/fcmService';
import { deviceService } from '@/service/deviceService';

export const useFcmStore = defineStore('fcm', () => {
    const authStore = useAuthStore();
    const localStorageKey = 'fcm.deviceId';

    // States
    const deviceId = ref(null);

    // Actions
    async function initialize() {
        const savedDeviceId = localStorage.getItem(localStorageKey);

        if (savedDeviceId) {
            deviceId.value = savedDeviceId;
        } else {
            const fcmToken = await fcmService.getFcmToken();
            const device = await deviceService.createDevice(fcmToken);
            deviceId.value = device.id;
            localStorage.setItem(localStorageKey, device.id);
        }

        fcmService.onMessage(async (message) => {
            console.log(message);
            if (message.data?.type === 'FCM_TOKEN_REFRESH') {
                const fcmToken = await fcmService.getFcmToken();
                await deviceService.updateDevice(deviceId.value, fcmToken);
            }
        });
    }

    watch(
        () => authStore.isAuthenticated,
        (isAuthenticated) => {
            if (isAuthenticated) {
                deviceService.claimDevice(deviceId.value);
            }
        }
    );

    return {
        // State
        deviceId,

        // Actions
        initialize
    };
});
