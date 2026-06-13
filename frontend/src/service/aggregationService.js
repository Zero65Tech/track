import apiClient from '@/service/apiClient';

export const aggregationService = {
    async getAggregationResult({ profileId, aggregationName, aggregationParams }, abortControllerSignal) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/aggregations/${aggregationName}/result`, {
            params: aggregationParams,
            signal: abortControllerSignal
        });
        const apiResponseData = apiResponse.data.data;
        if (apiResponseData.timestamp) {
            apiResponseData.timestamp = new Date(apiResponseData.timestamp);
        }
        return apiResponseData;
    }
};
