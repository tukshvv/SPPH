<template>
  <div class="grid gap-4 lg:grid-cols-3">
    <aside class="rounded-2xl bg-white/80 p-4 shadow ring-1 ring-orange-100">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-slate-900">Sessions</h2>
        <button class="rounded-lg bg-orange-500 px-3 py-1 text-sm text-white shadow hover:bg-orange-600" @click="newSession">
          + New
        </button>
      </div>
      <div class="mt-3 max-h-[70vh] space-y-2 overflow-y-auto">
        <button
          v-for="session in chat.sessions"
          :key="session.id"
          class="flex w-full flex-col rounded-xl border border-orange-50 px-3 py-2 text-left shadow-sm transition hover:border-orange-200"
          :class="{ 'border-orange-400 ring-1 ring-orange-200': session.id === currentId }"
          @click="navigateTo(session.id)"
        >
          <span class="font-semibold text-slate-900">{{ session.title }}</span>
          <span class="text-xs text-slate-500">{{ new Date(session.lastMessageAt).toLocaleString() }}</span>
        </button>
        <p v-if="chat.sessions.length === 0" class="text-sm text-slate-500">No sessions yet.</p>
      </div>
    </aside>

    <section class="lg:col-span-2 rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <div class="mb-4 flex items-center justify-between gap-3">
        <h1 class="text-xl font-bold text-slate-900">Chat</h1>
        <p class="text-sm text-slate-500">Powered by OpenAI</p>
      </div>
      <div class="mb-4 max-h-[60vh] space-y-3 overflow-y-auto">
        <div v-for="msg in chat.currentSession?.messages" :key="msg.id" class="flex gap-3">
          <span
            class="mt-1 h-8 w-8 flex-shrink-0 rounded-full text-center text-sm font-bold leading-8"
            :class="msg.role === 'user' ? 'bg-orange-500 text-white' : 'bg-orange-100 text-orange-700'"
          >
            {{ msg.role === 'user' ? 'You' : 'AI' }}
          </span>
          <div class="flex-1 rounded-xl bg-orange-50/60 p-3 shadow-inner">
            <p class="text-slate-800">{{ msg.content }}</p>
            <div v-if="msg.role === 'assistant'" class="mt-2 flex items-center gap-2 text-xs text-slate-500">
              <button class="rounded-full border border-orange-100 px-2 py-1 hover:bg-orange-100" @click="() => react(msg.id, 1)">
                👍
              </button>
              <button class="rounded-full border border-orange-100 px-2 py-1 hover:bg-orange-100" @click="() => react(msg.id, -1)">
                👎
              </button>
              <span v-if="msg.feedback" class="font-medium text-orange-600">Feedback saved</span>
            </div>
          </div>
        </div>
        <p v-if="!chat.currentSession" class="text-sm text-slate-500">Loading session...</p>
      </div>
      <form class="mt-4 space-y-3" @submit.prevent="send">
        <label class="text-sm font-medium text-slate-700">Message</label>
        <textarea
          v-model="draft"
          rows="3"
          required
          class="w-full rounded-xl border border-orange-100 bg-white px-3 py-2 text-slate-900 shadow-inner shadow-orange-50 focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-200"
          placeholder="Ask anything..."
        ></textarea>
        <button
          type="submit"
          class="rounded-xl bg-orange-500 px-4 py-3 text-white shadow-lg shadow-orange-200 transition hover:bg-orange-600 disabled:opacity-50"
          :disabled="chat.sending"
        >
          {{ chat.sending ? 'Thinking...' : 'Send' }}
        </button>
      </form>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useChatStore } from '../stores/chat';

const chat = useChatStore();
const route = useRoute();
const router = useRouter();
const draft = ref('');

const currentId = computed(() => route.params.id as string | undefined);

const navigateTo = (id: string) => router.push({ name: 'chat', params: { id } });

const loadSession = async () => {
  if (currentId.value) {
    await chat.loadSession(currentId.value);
  } else {
    const sessionId = await chat.createSession('New chat');
    router.replace({ name: 'chat', params: { id: sessionId } });
  }
};

const send = async () => {
  if (!draft.value.trim()) return;
  const content = draft.value.trim();
  draft.value = '';
  await chat.sendMessage(content);
};

const react = (messageId: string, value: number) => chat.react(messageId, value);
const newSession = async () => {
  const sessionId = await chat.createSession('New chat');
  router.push({ name: 'chat', params: { id: sessionId } });
};

onMounted(async () => {
  await chat.fetchSessions();
  await loadSession();
});

watch(
  () => route.params.id,
  async (id, old) => {
    if (id && id !== old) {
      await chat.loadSession(String(id));
    }
  }
);
</script>
