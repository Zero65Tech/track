import apiClient from '@/service/apiClient';

export const headService = {
    async getHeads({ profileId }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/heads`, { signal: abortControllerSignal });
        return apiResponse.data.data.heads;
    }
};
