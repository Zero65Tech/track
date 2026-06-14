import { defineStore } from 'pinia';
import { ref, watch } from 'vue';

import { deviceService } from '@/service/deviceService';
import { fcmService } from '@/service/fcmService';
import { TriggerState } from '@shared/enums';

import { useAggregationStore } from '@/stores/aggregation.store';
import { useAuthStore } from '@/stores/auth.store';
import { useProfileStore } from '@/stores/profile.store';
import { useTriggerStore } from '@/stores/trigger.store';

export const useFcmStore = defineStore('fcm', () => {
    const authStore = useAuthStore();
    const profileStore = useProfileStore();
    const triggerStore = useTriggerStore();
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

        fcmService.onMessage(async ({ /* notification, */ data }) => {
            if (data?.type === 'FCM_TOKEN_REFRESH') {
                const fcmToken = await fcmService.getFcmToken();
                await deviceService.updateDevice(deviceId.value, fcmToken);
            } else if (data) {
                if (data.trigger) {
                    data.trigger = JSON.parse(data.trigger);
                    data.trigger.createdAt = new Date(data.trigger.createdAt);
                    data.trigger.updatedAt = new Date(data.trigger.updatedAt);
                    await triggerStore.asyncPush(data.trigger);
                }

                if (data.profileId === profileStore.activeProfile?.id) {
                    if (data.triggerState === TriggerState.COMPLETED.id) {
                        if (data.triggerType === 'data_aggregation') {
                            await aggregationStore.notifyTriggerCompleted(data.aggregationName, JSON.parse(data.aggregationParams));
                        }
                    } else if (data.triggerState === TriggerState.FAILED.id) {
                        if (data.triggerType === 'data_aggregation') {
                            aggregationStore.notifyTriggerFailed(data.aggregationName, JSON.parse(data.aggregationParams), data.message);
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

    return { initialize };
});
