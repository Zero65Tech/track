import apiClient from '@/service/apiClient';

export const entryService = {
    async getBookEntries({ profileId, bookId, fromDate, toDate }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/books/${bookId}/entries`, {
            params: { fromDate, toDate },
            signal: abortControllerSignal
        });
        return apiResponse.data.data.entries;
    },

    async getHeadEntries({ profileId, headId, fromDate, toDate }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/heads/${headId}/entries`, {
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
    },

    async createEntry(profileId, entryData) {
        await apiClient.post(`/profiles/${profileId}/entries`, entryData);
    },

    async updateEntry(profileId, entryId, entryData) {
        await apiClient.patch(`/profiles/${profileId}/entries/${entryId}`, entryData);
    }
};
