import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useEntryStore = defineStore('entry', () => {
    const lastCreated = ref(null);

    function notifyCreated() {
        lastCreated.value = Date.now();
    }

    return { lastCreated, notifyCreated };
});
