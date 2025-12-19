import apiClient from '@/service/apiClient';

export const triggerService = {
    async createDataAggregationTrigger(profileId, aggregationName) {
        return (
            await apiClient.post(`/profiles/${profileId}/triggers/data-aggregation`, {
                aggregationName
            })
        ).data.data;
    }
};
