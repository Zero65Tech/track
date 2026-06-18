import apiClient from '@/service/apiClient';

export const tagService = {
    async getTags(profileId) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/tags`);

        const apiResponseData = apiResponse.data.data;
        for (const tag of apiResponseData.tags) {
            tag.createdAt = new Date(tag.createdAt);
            tag.updatedAt = new Date(tag.updatedAt);
        }

        return apiResponseData;
    }
};
