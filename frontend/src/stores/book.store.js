import { bookService } from '@/service/bookService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { computed, ref, watch } from 'vue';

export const useBookStore = defineStore('book', () => {
    const profileStore = useProfileStore();

    let inFlightRequest = null;

    // States

    const isLoading = ref(false);
    const books = ref([]);
    const error = ref(null);

    // Getters

    const booksMap = computed(() => {
        const map = {};
        books.value.forEach((book) => {
            map[book.id] = book;
        });
        return map;
    });

    // Internal Functions

    watch(
        () => profileStore.activeProfile,
        async () => {
            // NOTE: This may not work as expected if the user switches profiles quickly,
            // but it should be good enough for now. We can improve this later if needed.
            if (inFlightRequest) {
                await inFlightRequest;
            }

            books.value = [];

            const profileId = profileStore.activeProfile?.id;
            if (profileId) {
                inFlightRequest = _fetchBooks(profileId);
            } else {
                error.value = null;
            }
        }
    );

    async function _fetchBooks(profileId) {
        isLoading.value = true;
        error.value = null;

        try {
            const apiResponseData = await bookService.getBooks(profileId);
            books.value = apiResponseData.books;
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
        }
    }

    // Actions

    async function initialize() {
        const profileId = profileStore.activeProfile?.id;
        if (profileId) {
            inFlightRequest = _fetchBooks(profileId);
        }
    }

    return {
        // States
        isLoading,
        books,
        error,

        // Getters
        booksMap,

        // Actions
        initialize
    };
});
