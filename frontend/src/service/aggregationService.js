import apiClient from '@/service/apiClient';

export const aggregationService = {
    async getNamedAggregationResult(profileId, aggregationName) {
        return (await apiClient.get(`/profiles/${profileId}/aggregations/named/${aggregationName}/result`)).data.data;
    }
};
