import apiClient from '@/service/apiClient';

export const sourceService = {
    async getSources(profileId) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/sources`);

        const apiResponseData = apiResponse.data.data;
        for (const source of apiResponseData.sources) {
            source.createdAt = new Date(source.createdAt);
            source.updatedAt = new Date(source.updatedAt);
        }

        return apiResponseData;
    }
};
