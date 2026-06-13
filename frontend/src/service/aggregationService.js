import apiClient from '@/service/apiClient';

export const aggregationService = {
    async getAggregationResult({ profileId, aggregationName, aggregationParams }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/aggregations/${aggregationName}/result`, {
            params: aggregationParams,
            signal: abortControllerSignal
        });

        let { result, timestamp } = apiResponse.data.data;
        if (timestamp) {
            timestamp = new Date(timestamp);
        }

        return { result, timestamp };
    }
};
