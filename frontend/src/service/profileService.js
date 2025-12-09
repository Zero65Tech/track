import apiClient from '@/service/apiClient';

export const profileService = {
    async getAllAccessible() {
        return (await apiClient.get('/profiles')).data.data.profiles;
    },

    async getTemplatesBySystem() {
        return (await apiClient.get('/profiles/templates/system')).data.data.profiles;
    }
};
