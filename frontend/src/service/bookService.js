import apiClient from '@/service/apiClient';

export const bookService = {
    async getBooks(profileId) {
        const apiResponse = await apiClient.get(`/profiles/${profileId}/books`);

        const apiResponseData = apiResponse.data.data;
        for (const book of apiResponseData.books) {
            book.createdAt = new Date(book.createdAt);
            book.updatedAt = new Date(book.updatedAt);
        }

        return apiResponseData;
    }
};
