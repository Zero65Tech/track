import apiClient from '@/service/apiClient';

export const tagService = {
    async getTags({ profileId }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/tags`, { signal: abortControllerSignal });
        return apiResponse.data.data.tags;
    }
};
