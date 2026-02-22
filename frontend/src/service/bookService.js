import apiClient from '@/service/apiClient';

export const bookService = {
    async getBooks({ profileId }, abortControllerSignal) {
        return (await apiClient.get(`/profiles/${profileId}/books`, { signal: abortControllerSignal })).data.data.books;
    }
};
