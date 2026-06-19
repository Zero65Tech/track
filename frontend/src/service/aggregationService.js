import apiClient from '@/service/apiClient';

export const aggregationService = {
    async getAggregationResult(profileId, aggregationName, aggregationParams) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/aggregations/${aggregationName}/result`, {
            params: aggregationParams
        });

        const apiResponseData = apiResponse.data.data;
        if (apiResponseData.timestamp) {
            apiResponseData.timestamp = new Date(apiResponseData.timestamp);
        }

        return apiResponseData;
    }
};
