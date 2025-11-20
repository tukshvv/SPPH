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
      <div class="mt-4 rounded-xl border border-orange-100 bg-orange-50/60 p-3">
        <h3 class="text-sm font-semibold text-slate-900">Notes for {{ chat.currentSession?.subject || 'All' }}</h3>
        <div class="mt-2 space-y-2">
          <p v-if="notes.length === 0" class="text-xs text-slate-500">No notes yet.</p>
          <div v-for="note in notes" :key="note.id" class="rounded-lg bg-white/70 p-2 shadow-sm">
            <p class="text-sm font-semibold text-slate-900">{{ note.title }}</p>
            <p class="text-xs text-slate-500 line-clamp-3">{{ note.content }}</p>
          </div>
        </div>
      </div>
    </aside>

    <section class="lg:col-span-2 rounded-2xl bg-white/80 p-6 shadow ring-1 ring-orange-100">
      <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-xl font-bold text-slate-900">Chat</h1>
          <p class="text-sm text-slate-500">
            Mode: {{ chat.currentSession?.mode ?? 'general' }} • Subject: {{ chat.currentSession?.subject ?? 'General' }}
          </p>
          <p v-if="chat.currentSession?.goal" class="text-xs text-slate-500">Goal: {{ chat.currentSession?.goal }}</p>
          <p v-if="chat.currentSession?.dueDate" class="text-xs text-orange-600">
            Due: {{ new Date(chat.currentSession!.dueDate!).toLocaleDateString() }}
          </p>
        </div>
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
            <div v-if="msg.role === 'assistant'" class="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <button class="rounded-full border border-orange-100 px-2 py-1 hover:bg-orange-100" @click="() => react(msg.id, 1)">
                👍
              </button>
              <button class="rounded-full border border-orange-100 px-2 py-1 hover:bg-orange-100" @click="() => react(msg.id, -1)">
                👎
              </button>
              <span v-if="msg.feedback" class="font-medium text-orange-600">Feedback saved</span>
              <button
                class="rounded-full border border-orange-200 px-2 py-1 font-semibold text-orange-600 hover:bg-orange-100"
                @click="() => createTasks(msg.content)"
              >
                Create tasks from this answer
              </button>
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
import { useTaskStore } from '../stores/tasks';
import { useNoteStore } from '../stores/notes';

const chat = useChatStore();
const tasks = useTaskStore();
const noteStore = useNoteStore();
const route = useRoute();
const router = useRouter();
const draft = ref('');

const currentId = computed(() => route.params.id as string | undefined);
const notes = computed(() => noteStore.notes.slice(0, 4));

const navigateTo = (id: string) => router.push({ name: 'chat', params: { id } });

const loadSession = async () => {
  if (currentId.value) {
    await chat.loadSession(currentId.value);
    if (chat.currentSession?.subject) {
      await noteStore.fetch(chat.currentSession.subject);
    }
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

const createTasks = async (text: string) => {
  await tasks.createFromText(text, chat.currentSession?.id);
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
      if (chat.currentSession?.subject) {
        await noteStore.fetch(chat.currentSession.subject);
      }
    }
  }
);
</script>
