import apiClient from '@/service/apiClient';

export const deviceService = {
    async createDevice(fcmToken) {
        return (await apiClient.post('/devices', { fcmToken })).data.data;
    },

    async updateDevice(deviceId, fcmToken) {
        await apiClient.patch(`/devices/${deviceId}`, { fcmToken });
    },

    async claimDevice(deviceId) {
        await apiClient.get(`/devices/${deviceId}/claim`);
    }
};
