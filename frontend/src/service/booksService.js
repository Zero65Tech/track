import apiClient from '@/service/apiClient';

export const booksService = {
    async getBooks(profileId) {
        return (await apiClient.get(`/profiles/${profileId}/books`)).data.data.books;
    }
};
