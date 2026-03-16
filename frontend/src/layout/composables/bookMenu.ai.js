import { useBookStore } from '@/stores/book.store';
import { computed } from 'vue';

export function useBookMenu() {
    const bookStore = useBookStore();

    const bookMenuSection = computed(() => {
        const activeBooks = bookStore.books.filter((b) => b.state === 'active');

        const items = activeBooks.map((book) => ({
            label: book.name,
            icon: book.icon || 'pi pi-fw pi-book',
            iconStyle: book.color ? { color: book.color } : undefined,
            to: `/books/${book.id}`
        }));

        return {
            label: 'Books',
            items
        };
    });

    return { bookMenuSection };
}
