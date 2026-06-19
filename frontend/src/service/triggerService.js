import apiClient from '@/service/apiClient';
import fcmClient from '@/service/fcmClient';

const callbacks = [];

fcmClient.onAsyncResponse('trigger', (profileId, trigger) => {
    trigger.createdAt = new Date(trigger.createdAt);
    trigger.updatedAt = new Date(trigger.updatedAt);
    for (const callback of callbacks) {
        callback(profileId, trigger);
    }
});

export const triggerService = {
    onAsyncResponse(callback) {
        callbacks.push(callback);
    },

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
        await apiClient.post(`/profiles/${profileId}/triggers/data-aggregation`, {
            aggregationName,
            ...aggregationParams
        });
    }
};
