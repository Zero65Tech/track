import apiClient from '@/service/apiClient';

export const entryService = {
    async getHeadEntries({ profileId, headId, fromDate, toDate }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/sources/${headId}/entries`, {
            params: { fromDate, toDate },
            signal: abortControllerSignal
        });
        return apiResponse.data.data.entries;
    },

    async getTagEntries({ profileId, tagId, fromDate, toDate }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/tags/${tagId}/entries`, {
            params: { fromDate, toDate },
            signal: abortControllerSignal
        });
        return apiResponse.data.data.entries;
    },

    async getSourceEntries({ profileId, sourceId, fromDate, toDate }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/sources/${sourceId}/entries`, {
            params: { fromDate, toDate },
            signal: abortControllerSignal
        });
        return apiResponse.data.data.entries;
    }
};
