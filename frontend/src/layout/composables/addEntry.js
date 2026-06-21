import { reactive } from 'vue';

const state = reactive({ visible: false });

export function useAddEntry() {
    return {
        state,
        openAddEntry: () => {
            state.visible = true;
        },
        closeAddEntry: () => {
            state.visible = false;
        }
    };
}
