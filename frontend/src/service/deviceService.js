import apiClient from '@/service/apiClient';

export const deviceService = {
    async createDevice(fcmToken) {
        return await apiClient.post('/devices', { fcmToken });
    },

    async updateDevice(deviceId, fcmToken) {
        await apiClient.patch(`/devices/${deviceId}`, { fcmToken });
    }
};
