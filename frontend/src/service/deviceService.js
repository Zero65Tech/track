import apiClient from '@/service/apiClient';

export const deviceService = {
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
