import { bookService } from '@/service/bookService';
import { useProfileStore } from '@/stores/profile.store';
import { defineStore } from 'pinia';
import { useToast } from 'primevue/usetoast';
import { computed, ref, watch } from 'vue';

export const useBookStore = defineStore('book', () => {
    const toast = useToast();
    const profileStore = useProfileStore();
    let abortController = new AbortController();

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

    // Actions

    async function initialize() {
        if (profileStore.activeProfile) {
            await fetchBooks();
        }
    }

    watch(
        () => profileStore.activeProfile,
        () => {
            // Abort all in-flight requests
            abortController.abort();
            abortController = new AbortController();
            if (profileStore.activeProfile) {
                fetchBooks();
            } else {
                books.value = [];
                error.value = null;
            }
        }
    );

    async function fetchBooks() {
        const profileId = profileStore.activeProfile?.id;
        if (!profileId) {
            toast.add({
                severity: 'error',
                summary: 'Refresh failed',
                detail: 'Kindly select a profile to fetch books',
                life: 3000
            });
            return;
        }

        isLoading.value = true;
        error.value = null;

        try {
            books.value = await bookService.getBooks({ profileId }, abortController.signal);
        } catch (err) {
            error.value = err.message;
            console.log(err);
        } finally {
            isLoading.value = false;
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
        initialize,
        fetchBooks
    };
});
