import apiClient from '@/service/apiClient';
import { ProfileAccess, ProfileState } from '@shared/enums';

const accessIds = Object.values(ProfileAccess).map((access) => access.id);
const stateIds = Object.values(ProfileState).map((state) => state.id);

export const profileService = {
    async getAllAccessible() {
        const apiResponse = await apiClient.get('/profiles');

        const apiResponseData = apiResponse.data.data;

        // Sort
        apiResponseData.profiles.sort((a, b) => stateIds.indexOf(a.state) - stateIds.indexOf(b.state) || accessIds.indexOf(a.access) - accessIds.indexOf(b.access));

        for (let profile of apiResponseData.profiles) {
            profile.access = Object.values(ProfileAccess).find((access) => access.id === profile.access);
            profile.state = Object.values(ProfileState).find((state) => state.id === profile.state);
        }

        return apiResponseData;
    },

    async getTemplatesBySystem() {
        const apiResponse = await apiClient.get('/profiles/templates/system');

        const apiResponseData = apiResponse.data.data;
        for (let profile of apiResponseData.profiles) {
            profile.access = Object.values(ProfileAccess).find((access) => access.id === profile.access);
            profile.state = Object.values(ProfileState).find((state) => state.id === profile.state);
        }

        return apiResponseData;
    }
};
