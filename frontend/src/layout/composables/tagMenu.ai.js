import { useTagStore } from '@/stores/tag.store';
import { computed } from 'vue';

export function useTagMenu() {
    const tagStore = useTagStore();

    const tagMenuSection = computed(() => {
        const activeTags = tagStore.tags.filter((s) => s.state === 'active');

        // Group tags by their group field
        const grouped = {};
        const ungrouped = [];

        for (const tag of activeTags) {
            if (tag.group) {
                if (!grouped[tag.group]) {
                    grouped[tag.group] = [];
                }
                grouped[tag.group].push(tag);
            } else {
                ungrouped.push(tag);
            }
        }

        const toMenuItem = (tag) => ({
            label: tag.name,
            icon: tag.icon || 'pi pi-fw pi-wallet',
            to: `/tags/${tag.id}`
        });

        const items = [];

        // Add grouped tags as submenus
        for (const [groupName, tags] of Object.entries(grouped)) {
            items.push({
                label: groupName,
                icon: 'pi pi-fw pi-folder',
                items: tags.map(toMenuItem)
            });
        }

        // Add ungrouped tags under "Other" group
        if (ungrouped.length > 0) {
            items.push({
                label: 'Other',
                icon: 'pi pi-fw pi-folder',
                items: ungrouped.map(toMenuItem)
            });
        }

        return {
            label: 'Tags',
            items
        };
    });

    return { tagMenuSection };
}
