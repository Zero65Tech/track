import apiClient from '@/service/apiClient';

export const entryService = {
    async getSourceEntries({ profileId, sourceId, fromDate, toDate }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/sources/${sourceId}/entries`, {
            params: { fromDate, toDate },
            signal: abortControllerSignal
        });
        return apiResponse.data.data.entries;
    }
};
