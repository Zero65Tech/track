import apiClient from '@/service/apiClient';

export const userFcmTokenService = {
    async updateToken(fcmToken, deviceId) {
        if (!fcmToken || !deviceId) return;

        await apiClient.post('/user/fcm-tokens', { deviceId, fcmToken });
    }
};
