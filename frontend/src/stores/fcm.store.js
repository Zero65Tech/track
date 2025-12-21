import { ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { TriggerState } from '@shared/enums';
import { useAuthStore } from '@/stores/auth.store';
import { useProfileStore } from '@/stores/profile.store';
import { useAggregationStore } from '@/stores/aggregation.store';
import { fcmService } from '@/service/fcmService';
import { deviceService } from '@/service/deviceService';

export const useFcmStore = defineStore('fcm', () => {
    const toast = useToast();

    const authStore = useAuthStore();
    const profileStore = useProfileStore();
    const aggregationStore = useAggregationStore();

    const prefix = import.meta.env.MODE !== 'prod' && import.meta.env.MODE !== 'gamma' ? 'test.' : '';
    const localStorageKey = `${prefix}fcm.deviceId`;

    // States
    const deviceId = ref(null);

    // Actions
    async function initialize() {
        const savedDeviceId = localStorage.getItem(localStorageKey) || null;

        const fcmToken = await fcmService.getFcmToken();
        if (savedDeviceId) {
            await deviceService.updateDevice(savedDeviceId, fcmToken);
            deviceId.value = savedDeviceId;
        } else {
            const device = await deviceService.createDevice(fcmToken);
            deviceId.value = device.id;
            localStorage.setItem(localStorageKey, device.id);
        }

        if (authStore.isAuthenticated) {
            await deviceService.claimDevice(deviceId.value);
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

                if (data) {
                    if (data.profileId === profileStore.active?.id) {
                        if (data.triggerState === TriggerState.COMPLETED.id) {
                            if (data.triggerType === 'data_aggregation') {
                                await aggregationStore.fetchAggregation(data.aggregationName);
                            }
                        }
                    }
                }
            }
        });
    }

    watch(
        () => authStore.isAuthenticated,
        (isAuthenticated) => {
            if (isAuthenticated && deviceId.value) {
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
