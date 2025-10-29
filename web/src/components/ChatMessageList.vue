<template>
  <div class="flex flex-1 flex-col gap-4 overflow-y-auto px-4 py-6">
    <TransitionGroup name="message" tag="div" class="flex flex-col gap-4">
      <div
        v-for="message in messages"
        :key="message.id"
        class="flex w-full"
        :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
      >
        <div
          class="max-w-3xl rounded-2xl px-4 py-3 text-sm shadow-sm transition"
          :class="bubbleClass(message)"
        >
          <p class="whitespace-pre-wrap leading-relaxed">{{ message.content }}</p>
          <p class="mt-2 text-xs text-slate-500" v-if="message.pending">Мыслю…</p>
          <p class="mt-2 text-xs text-slate-400" v-else>{{ formatTimestamp(message.createdAt) }}</p>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import type { ChatMessage } from '../stores/chat';

defineProps<{ messages: ChatMessage[] }>();

const bubbleClass = (message: ChatMessage) => {
  if (message.role === 'user') {
    return 'bg-primary text-white shadow-primary/20';
  }
  return 'bg-white text-slate-800 border border-slate-200';
};

const formatTimestamp = (timestamp: string) =>
  new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
</script>

<style scoped>
.message-enter-active,
.message-leave-active {
  transition: all 0.2s ease;
}

.message-enter-from,
.message-leave-to {
  opacity: 0;
  transform: translateY(8px);
}
</style>
