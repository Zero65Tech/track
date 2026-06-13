import apiClient from '@/service/apiClient';

export const triggerService = {
    async getTriggers({ profileId, lastCreatedAt }, abortControllerSignal) {
        if (lastCreatedAt) {
            lastCreatedAt = lastCreatedAt.toISOString();
        }

        const apiResponse = await apiClient.get(`/profiles/${profileId}/triggers`, {
            params: { lastCreatedAt },
            signal: abortControllerSignal
        });

        const { triggers } = apiResponse.data.data;
        for (const trigger of triggers) {
            trigger.createdAt = new Date(trigger.createdAt);
            trigger.updatedAt = new Date(trigger.updatedAt);
        }

        return triggers;
    },

    async createDataAggregationTrigger(profileId, aggregationName, aggregationParams) {
        const apiResponse = await apiClient.post(`/profiles/${profileId}/triggers/data-aggregation`, {
            aggregationName,
            ...aggregationParams
        });

        const { trigger } = apiResponse.data.data;
        trigger.createdAt = new Date(trigger.createdAt);
        trigger.updatedAt = new Date(trigger.updatedAt);

        return trigger;
    }
};
