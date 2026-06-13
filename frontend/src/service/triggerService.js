import apiClient from '@/service/apiClient';

export const triggerService = {
    async getTriggers(profileId, lastCreatedAt) {
        const params = {};
        if (lastCreatedAt) {
            params.lastCreatedAt = lastCreatedAt.toISOString();
        }

        const apiResponse = await apiClient.get(`/profiles/${profileId}/triggers`, { params });

        const apiResponseData = apiResponse.data.data;
        for (const trigger of apiResponseData.triggers) {
            trigger.createdAt = new Date(trigger.createdAt);
            trigger.updatedAt = new Date(trigger.updatedAt);
        }

        return apiResponseData;
    },

    async createDataAggregationTrigger(profileId, aggregationName, aggregationParams) {
        const apiResponse = await apiClient.post(`/profiles/${profileId}/triggers/data-aggregation`, {
            aggregationName,
            ...aggregationParams
        });

        const apiResponseData = apiResponse.data.data;
        apiResponseData.trigger.createdAt = new Date(apiResponseData.trigger.createdAt);
        apiResponseData.trigger.updatedAt = new Date(apiResponseData.trigger.updatedAt);

        return apiResponseData;
    }
};
