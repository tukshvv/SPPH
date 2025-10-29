<template>
  <form class="border-t border-slate-200 bg-white/80 p-4" @submit.prevent="handleSubmit">
    <label class="sr-only" for="chat-input">Сообщение</label>
    <div class="flex gap-3">
      <textarea
        id="chat-input"
        v-model="draft"
        class="min-h-[88px] flex-1 resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm transition focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
        placeholder="Задай вопрос..."
        @keydown.enter.exact.prevent="handleSubmit"
        @keydown.enter.shift.stop
      ></textarea>
      <button
        type="submit"
        class="inline-flex items-center justify-center rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:cursor-not-allowed disabled:bg-slate-300"
        :disabled="isDisabled"
      >
        <span v-if="isBusy" class="flex items-center gap-2">
          <svg class="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
          </svg>
          Ждём
        </span>
        <span v-else>Отправить</span>
      </button>
    </div>
    <p class="mt-2 text-xs text-slate-400">Enter — отправить · Shift + Enter — новая строка</p>
  </form>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

const props = defineProps<{
  modelValue: string;
  disabled?: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'submit'): void;
}>();

const draft = ref(props.modelValue);

watch(
  () => props.modelValue,
  (value) => {
    if (value !== draft.value) {
      draft.value = value;
    }
  }
);

watch(draft, (value) => {
  emit('update:modelValue', value);
});

const isBusy = computed(() => props.disabled === true);
const isDisabled = computed(() => isBusy.value || draft.value.trim().length === 0);

const handleSubmit = () => {
  if (isDisabled.value) return;
  emit('submit');
  emit('update:modelValue', '');
  draft.value = '';
};
</script>
