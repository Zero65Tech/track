import { useSourceStore } from '@/stores/source.store';
import { computed } from 'vue';

export function useSourceMenu() {
    const sourceStore = useSourceStore();

    const sourceMenuSection = computed(() => {
        const activeSources = sourceStore.sources.filter((s) => s.state === 'active');

        // Group sources by their group field
        const grouped = {};
        const ungrouped = [];

        for (const source of activeSources) {
            if (source.group) {
                if (!grouped[source.group]) {
                    grouped[source.group] = [];
                }
                grouped[source.group].push(source);
            } else {
                ungrouped.push(source);
            }
        }

        const toMenuItem = (source) => ({
            label: source.name,
            icon: source.icon || 'pi pi-fw pi-wallet',
            to: `/sources/${source.id}`
        });

        const items = [];

        // Add grouped sources as submenus
        for (const [groupName, sources] of Object.entries(grouped)) {
            items.push({
                label: groupName,
                icon: 'pi pi-fw pi-folder',
                items: sources.map(toMenuItem)
            });
        }

        // Add ungrouped sources under "Other" group
        if (ungrouped.length > 0) {
            items.push({
                label: 'Other',
                icon: 'pi pi-fw pi-folder',
                items: ungrouped.map(toMenuItem)
            });
        }

        return {
            label: 'Sources',
            items
        };
    });

    return { sourceMenuSection };
}
