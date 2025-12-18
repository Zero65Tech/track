import apiClient from '@/service/apiClient';
import { TriggerType } from '@shared/enums';

export const triggerService = {
    async createDataAggregationTrigger(profileId, aggregationName) {
        return (
            await apiClient.post(`/profiles/${profileId}/triggers`, {
                type: TriggerType.DATA_AGGREGATION.id,
                params: { name: aggregationName }
            })
        ).data.data;
    }
};
