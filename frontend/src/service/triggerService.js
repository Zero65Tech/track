import apiClient from '@/service/apiClient';

export const triggerService = {
    async createDataAggregationTrigger(profileId, aggregationName, aggregationParams) {
        return (
            await apiClient.post(`/profiles/${profileId}/triggers/data-aggregation`, {
                aggregationName,
                ...aggregationParams
            })
        ).data.data;
    }
};
