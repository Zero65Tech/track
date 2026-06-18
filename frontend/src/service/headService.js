import apiClient from '@/service/apiClient';

export const headService = {
    async getHeads(profileId) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/heads`);

        const apiResponseData = apiResponse.data.data;
        for (const head of apiResponseData.heads) {
            head.createdAt = new Date(head.createdAt);
            head.updatedAt = new Date(head.updatedAt);
        }

        return apiResponseData;
    }
};
