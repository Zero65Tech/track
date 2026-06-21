<script setup>
import { useAddEntry } from '@/layout/composables/addEntry';
import { entryService } from '@/service/entryService';
import { useBookStore } from '@/stores/book.store';
import { useEntryStore } from '@/stores/entry.store';
import { useHeadStore } from '@/stores/head.store';
import { useProfileStore } from '@/stores/profile.store';
import { useSourceStore } from '@/stores/source.store';
import { useTagStore } from '@/stores/tag.store';
import { EntryState, EntryType } from '@shared/enums';
import { computed, reactive, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useToast } from 'primevue/usetoast';

const emit = defineEmits(['created']);

const route = useRoute();
const toast = useToast();
const { state: addEntryState, closeAddEntry } = useAddEntry();
const profileStore = useProfileStore();
const bookStore = useBookStore();
const headStore = useHeadStore();
const tagStore = useTagStore();
const sourceStore = useSourceStore();
const entryStore = useEntryStore();

const BOOK_ENTRY_TYPE_IDS = new Set([
    EntryType.INCOME.id,
    EntryType.INCOME_TAX.id,
    EntryType.INCOME_TAX_REFUND.id,
    EntryType.EXPENSE.id,
    EntryType.EXPENSE_REFUND.id,
    EntryType.LOAN_GIVEN.id,
    EntryType.LOAN_TAKEN.id,
    EntryType.INVESTMENT_DEPOSIT.id,
    EntryType.INVESTMENT_WITHDRAWAL.id,
    EntryType.POSITION_ONBOARD.id,
    EntryType.POSITION_OFFBOARD.id
]);

const entryTypeOptions = [
    EntryType.INCOME,
    EntryType.INCOME_TAX,
    EntryType.INCOME_TAX_REFUND,
    EntryType.EXPENSE,
    EntryType.EXPENSE_REFUND,
    EntryType.LOAN_GIVEN,
    EntryType.LOAN_TAKEN,
    EntryType.INVESTMENT_DEPOSIT,
    EntryType.INVESTMENT_WITHDRAWAL,
    EntryType.POSITION_ONBOARD,
    EntryType.POSITION_OFFBOARD,
    EntryType.RELOCATE,
    EntryType.PAYMENT,
    EntryType.RECEIPT,
    EntryType.TRANSFER
].map((t) => ({ label: t.name, value: t.id }));

const stateOptions = Object.values(EntryState).map((s) => ({ label: s.name, value: s.id }));

const form = reactive({
    date: null,
    type: null,
    amount: null,
    state: EntryState.DRAFT.id,
    note: '',
    bookId: null,
    headId: null,
    tagId: null,
    sourceId: null,
    bookIdFrom: null,
    bookIdTo: null,
    sourceIdFrom: null,
    sourceIdTo: null
});

const submitted = ref(false);
const isSubmitting = ref(false);
const submitError = ref(null);

const isBookEntry = computed(() => BOOK_ENTRY_TYPE_IDS.has(form.type));
const isRelocate = computed(() => form.type === EntryType.RELOCATE.id);
const isPayReceipt = computed(() => form.type === EntryType.PAYMENT.id || form.type === EntryType.RECEIPT.id);
const isTransfer = computed(() => form.type === EntryType.TRANSFER.id);

const bookOptions = computed(() => bookStore.books.map((b) => ({ label: b.name, value: b.id })));
const headOptions = computed(() => headStore.heads.map((h) => ({ label: h.name, value: h.id })));
const tagOptions = computed(() => tagStore.tags.map((t) => ({ label: t.name, value: t.id })));
const sourceOptions = computed(() => sourceStore.sources.map((s) => ({ label: s.name, value: s.id })));

function resetForm() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    form.date = today;
    form.type = null;
    form.amount = null;
    form.state = EntryState.DRAFT.id;
    form.note = '';
    form.bookId = null;
    form.headId = null;
    form.tagId = null;
    form.sourceId = null;
    form.bookIdFrom = null;
    form.bookIdTo = null;
    form.sourceIdFrom = null;
    form.sourceIdTo = null;

    const name = route.name;
    if (name === 'bookEntries') {
        form.bookId = route.params.bookId;
        form.type = EntryType.EXPENSE.id;
    } else if (name === 'headEntries') {
        form.headId = route.params.headId;
    } else if (name === 'tagEntries') {
        form.tagId = route.params.tagId;
    } else if (name === 'sourceEntries') {
        form.sourceId = route.params.sourceId;
        form.type = EntryType.PAYMENT.id;
    } else if (name === 'incomes') {
        form.type = EntryType.INCOME.id;
    }

    submitted.value = false;
    submitError.value = null;
}

watch(
    () => addEntryState.visible,
    (newVal) => {
        if (newVal) resetForm();
    }
);

function validate() {
    if (!form.date) return false;
    if (!form.type) return false;
    if (form.amount === null || form.amount === undefined) return false;
    if (isBookEntry.value) {
        if (!form.bookId || !form.headId || !form.tagId) return false;
    }
    if (isRelocate.value) {
        if (!form.bookIdFrom || !form.bookIdTo) return false;
    }
    if (isPayReceipt.value) {
        if (!form.bookId || !form.sourceId) return false;
    }
    if (isTransfer.value) {
        if (!form.sourceIdFrom || !form.sourceIdTo) return false;
    }
    return true;
}

async function handleSubmit() {
    submitted.value = true;
    if (!validate()) return;

    const profileId = profileStore.activeProfile?.id;
    if (!profileId) {
        submitError.value = 'No active profile selected.';
        return;
    }

    isSubmitting.value = true;
    submitError.value = null;

    try {
        const dateStr = form.date.toISOString().slice(0, 10);
        const payload = {
            date: dateStr,
            type: form.type,
            amount: Number(form.amount),
            sortOrder: 0,
            state: form.state
        };
        if (form.note) payload.note = form.note;

        if (isBookEntry.value) {
            payload.bookId = form.bookId;
            payload.headId = form.headId;
            payload.tagId = form.tagId;
            if (form.sourceId) payload.sourceId = form.sourceId;
        } else if (isRelocate.value) {
            payload.bookIdFrom = form.bookIdFrom;
            payload.bookIdTo = form.bookIdTo;
        } else if (isPayReceipt.value) {
            payload.bookId = form.bookId;
            payload.sourceId = form.sourceId;
        } else if (isTransfer.value) {
            payload.sourceIdFrom = form.sourceIdFrom;
            payload.sourceIdTo = form.sourceIdTo;
        }

        await entryService.createEntry(profileId, payload);
        entryStore.notifyCreated();
        toast.add({ severity: 'success', summary: 'Entry created', life: 3000 });
        emit('created');
        closeAddEntry();
    } catch (err) {
        submitError.value = err.response?.data?.message || err.message || 'Failed to create entry.';
    } finally {
        isSubmitting.value = false;
    }
}
</script>

<template>
    <Dialog v-model:visible="addEntryState.visible" modal header="Add Entry" :style="{ width: '32rem' }" :breakpoints="{ '960px': '75vw', '640px': '90vw' }">
        <form @submit.prevent="handleSubmit" class="flex flex-col gap-4 pt-2">
            <!-- Date + Amount -->
            <div class="flex gap-4">
                <div class="flex flex-col gap-1 flex-1">
                    <label class="font-medium text-sm">Date</label>
                    <DatePicker v-model="form.date" dateFormat="yy-mm-dd" :invalid="submitted && !form.date" fluid />
                    <small v-if="submitted && !form.date" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1 flex-1">
                    <label class="font-medium text-sm">Amount</label>
                    <InputNumber v-model="form.amount" :minFractionDigits="2" :maxFractionDigits="2" :invalid="submitted && form.amount === null" fluid />
                    <small v-if="submitted && form.amount === null" class="text-red-500">Required</small>
                </div>
            </div>

            <!-- Type -->
            <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Type</label>
                <Select v-model="form.type" :options="entryTypeOptions" optionLabel="label" optionValue="value" placeholder="Select type" :invalid="submitted && !form.type" fluid />
                <small v-if="submitted && !form.type" class="text-red-500">Required</small>
            </div>

            <!-- Book entry fields -->
            <template v-if="isBookEntry">
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Book</label>
                    <Select v-model="form.bookId" :options="bookOptions" optionLabel="label" optionValue="value" placeholder="Select book" :invalid="submitted && !form.bookId" fluid />
                    <small v-if="submitted && !form.bookId" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Head</label>
                    <Select v-model="form.headId" :options="headOptions" optionLabel="label" optionValue="value" placeholder="Select head" :invalid="submitted && !form.headId" fluid />
                    <small v-if="submitted && !form.headId" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Tag</label>
                    <Select v-model="form.tagId" :options="tagOptions" optionLabel="label" optionValue="value" placeholder="Select tag" :invalid="submitted && !form.tagId" fluid />
                    <small v-if="submitted && !form.tagId" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Source <span class="text-muted-color text-xs">(optional)</span></label>
                    <Select v-model="form.sourceId" :options="sourceOptions" optionLabel="label" optionValue="value" placeholder="Select source" showClear fluid />
                </div>
            </template>

            <!-- RELOCATE fields -->
            <template v-if="isRelocate">
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">From Book</label>
                    <Select v-model="form.bookIdFrom" :options="bookOptions" optionLabel="label" optionValue="value" placeholder="Select source book" :invalid="submitted && !form.bookIdFrom" fluid />
                    <small v-if="submitted && !form.bookIdFrom" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">To Book</label>
                    <Select v-model="form.bookIdTo" :options="bookOptions" optionLabel="label" optionValue="value" placeholder="Select destination book" :invalid="submitted && !form.bookIdTo" fluid />
                    <small v-if="submitted && !form.bookIdTo" class="text-red-500">Required</small>
                </div>
            </template>

            <!-- PAYMENT / RECEIPT fields -->
            <template v-if="isPayReceipt">
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Book</label>
                    <Select v-model="form.bookId" :options="bookOptions" optionLabel="label" optionValue="value" placeholder="Select book" :invalid="submitted && !form.bookId" fluid />
                    <small v-if="submitted && !form.bookId" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">Source</label>
                    <Select v-model="form.sourceId" :options="sourceOptions" optionLabel="label" optionValue="value" placeholder="Select source" :invalid="submitted && !form.sourceId" fluid />
                    <small v-if="submitted && !form.sourceId" class="text-red-500">Required</small>
                </div>
            </template>

            <!-- TRANSFER fields -->
            <template v-if="isTransfer">
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">From Source</label>
                    <Select v-model="form.sourceIdFrom" :options="sourceOptions" optionLabel="label" optionValue="value" placeholder="Select source" :invalid="submitted && !form.sourceIdFrom" fluid />
                    <small v-if="submitted && !form.sourceIdFrom" class="text-red-500">Required</small>
                </div>
                <div class="flex flex-col gap-1">
                    <label class="font-medium text-sm">To Source</label>
                    <Select v-model="form.sourceIdTo" :options="sourceOptions" optionLabel="label" optionValue="value" placeholder="Select destination source" :invalid="submitted && !form.sourceIdTo" fluid />
                    <small v-if="submitted && !form.sourceIdTo" class="text-red-500">Required</small>
                </div>
            </template>

            <!-- State -->
            <div class="flex flex-col gap-2">
                <label class="font-medium text-sm">State</label>
                <div class="flex gap-6 flex-wrap">
                    <div v-for="opt in stateOptions" :key="opt.value" class="flex items-center gap-2">
                        <RadioButton v-model="form.state" :value="opt.value" :inputId="'state-' + opt.value" />
                        <label :for="'state-' + opt.value" class="cursor-pointer">{{ opt.label }}</label>
                    </div>
                </div>
            </div>

            <!-- Note -->
            <div class="flex flex-col gap-1">
                <label class="font-medium text-sm">Note <span class="text-muted-color text-xs">(optional)</span></label>
                <Textarea v-model="form.note" rows="2" autoResize fluid />
            </div>

            <!-- Error -->
            <Message v-if="submitError" severity="error" :closable="false">{{ submitError }}</Message>
        </form>

        <template #footer>
            <Button label="Cancel" text @click="closeAddEntry" :disabled="isSubmitting" />
            <Button label="Create" icon="pi pi-check" @click="handleSubmit" :loading="isSubmitting" />
        </template>
    </Dialog>
</template>
