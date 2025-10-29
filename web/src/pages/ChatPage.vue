<template>
  <section class="mx-auto flex h-full min-h-[calc(100vh-88px)] w-full max-w-6xl flex-col gap-4 px-4 py-6">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">Чат с ассистентом</h1>
        <p class="mt-1 text-sm text-slate-500">
          Используйте чат, чтобы быстро получать идеи и ответы. История сохранится, пока вкладка открыта.
        </p>
      </div>
      <SessionBadge @reset="chatStore.resetConversation" />
    </div>
    <div ref="scrollArea" class="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
      <ChatMessageList :messages="chatStore.messages" />
      <ChatInput v-model="draft" :disabled="chatStore.isSending" @submit="handleSubmit" />
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref, watch, nextTick, onMounted } from 'vue';
import { useChatStore } from '../stores/chat';
import ChatMessageList from '../components/ChatMessageList.vue';
import ChatInput from '../components/ChatInput.vue';
import SessionBadge from '../components/SessionBadge.vue';

const chatStore = useChatStore();
const draft = ref('');
const scrollArea = ref<HTMLDivElement | null>(null);

const scrollToBottom = () => {
  nextTick(() => {
    const container = scrollArea.value;
    if (!container) return;
    container.scrollTop = container.scrollHeight;
  });
};

watch(
  () => chatStore.messages.length,
  () => {
    scrollToBottom();
  }
);

const handleSubmit = () => {
  void chatStore.sendPrompt(draft.value);
};

onMounted(() => {
  scrollToBottom();
});
</script>
