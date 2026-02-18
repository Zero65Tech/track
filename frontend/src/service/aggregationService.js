import apiClient from '@/service/apiClient';

export const aggregationService = {
    async getNamedAggregationResult(profileId, aggregationName) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/aggregations/named/${aggregationName}/result`);
        const apiResponseData = apiResponse.data.data;
        if (apiResponseData.timestamp) {
            apiResponseData.timestamp = new Date(apiResponseData.timestamp);
        }
        return apiResponseData;
    }
};
