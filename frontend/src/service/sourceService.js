import apiClient from '@/service/apiClient';

export const sourceService = {
    async getSources({ profileId }, abortControllerSignal) {
        return (await apiClient.get(`/profiles/${profileId}/sources`, { signal: abortControllerSignal })).data.data.sources;
    }
};
