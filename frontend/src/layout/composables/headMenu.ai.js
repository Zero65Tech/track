import { useHeadStore } from '@/stores/head.store';
import { computed } from 'vue';

export function useHeadMenu() {
    const headStore = useHeadStore();

    const headMenuSection = computed(() => {
        const activeHeads = headStore.heads.filter((h) => h.state === 'active');

        // Group heads by their group field
        const grouped = {};
        const ungrouped = [];

        for (const head of activeHeads) {
            if (head.group) {
                if (!grouped[head.group]) {
                    grouped[head.group] = [];
                }
                grouped[head.group].push(head);
            } else {
                ungrouped.push(head);
            }
        }

        const toMenuItem = (head) => ({
            label: head.name,
            icon: head.icon || 'pi pi-fw pi-tags',
            to: `/heads/${head.id}`
        });

        const items = [];

        // Add grouped heads as submenus
        for (const [groupName, heads] of Object.entries(grouped)) {
            items.push({
                label: groupName,
                icon: 'pi pi-fw pi-folder',
                items: heads.map(toMenuItem)
            });
        }

        // Add ungrouped heads under "Other" group
        if (ungrouped.length > 0) {
            items.push({
                label: 'Other',
                icon: 'pi pi-fw pi-folder',
                items: ungrouped.map(toMenuItem)
            });
        }

        return {
            label: 'Heads',
            items
        };
    });

    return { headMenuSection };
}
