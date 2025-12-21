import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { TriggerState } from '@shared/enums';
import { useAuthStore } from '@/stores/auth.store';
import { fcmService } from '@/service/fcmService';
import { deviceService } from '@/service/deviceService';

export const useFcmStore = defineStore('fcm', () => {
    const toast = useToast();

    const authStore = useAuthStore();

    const prefix = import.meta.env.MODE !== 'prod' && import.meta.env.MODE !== 'gamma' ? 'test.' : '';
    const localStorageKey = `${prefix}fcm.deviceId`;

    // States
    const deviceId = ref(null);

    // Actions
    async function initialize() {
        const savedDeviceId = localStorage.getItem(localStorageKey);

        const fcmToken = await fcmService.getFcmToken();
        if (savedDeviceId) {
            await deviceService.updateDevice(savedDeviceId, fcmToken);
            deviceId.value = savedDeviceId;
        } else {
            const device = await deviceService.createDevice(fcmToken);
            deviceId.value = device.id;
            localStorage.setItem(localStorageKey, device.id);
        }

        fcmService.onMessage(async ({ notification, data }) => {
            if (data?.type === 'FCM_TOKEN_REFRESH') {
                const fcmToken = await fcmService.getFcmToken();
                await deviceService.updateDevice(deviceId.value, fcmToken);
            } else {
                const summary = notification.title;
                const detail = notification.body;
                let severity = 'info';
                let life = 3000;
                if (data.triggerState == TriggerState.FAILED.id) {
                    severity = 'error';
                    life = 5000;
                } else if (data.triggerState == TriggerState.COMPLETED.id) {
                    severity = 'success';
                    life = 5000;
                }
                toast.add({ severity, summary, detail, life });
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
