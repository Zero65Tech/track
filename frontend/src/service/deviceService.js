import apiClient from '@/service/apiClient';
import fcmClient from '@/service/fcmClient';

export const deviceService = {
    onFcmTokenRefresh(callback) {
        fcmClient.onFcmTokenRefresh(callback);
    },

    async createDevice(fcmToken) {
        const apiResponse = await apiClient.post('/devices', { fcmToken });
        return apiResponse.data.data;
    },

    async updateDevice(deviceId, fcmToken) {
        await apiClient.patch(`/devices/${deviceId}`, { fcmToken });
    },

    async claimDevice(deviceId) {
        await apiClient.get(`/devices/${deviceId}/claim`);
    }
};
