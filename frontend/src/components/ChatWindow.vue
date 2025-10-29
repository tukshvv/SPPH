<template>
  <div class="window">
    <div class="window__messages" ref="messageList">
      <TransitionGroup name="fade" tag="div">
        <article
          v-for="message in conversation"
          :key="message.id"
          :class="['bubble', `bubble--${message.role}`]"
        >
          <header class="bubble__meta">
            <span class="bubble__author">{{ authorLabel(message.role) }}</span>
            <time class="bubble__time">{{ formatTime(message.createdAt) }}</time>
          </header>
          <p class="bubble__content">{{ message.content }}</p>
        </article>
      </TransitionGroup>
      <div v-if="isLoading" class="typing">
        <span class="typing__dot" aria-hidden="true"></span>
        <span class="typing__dot" aria-hidden="true"></span>
        <span class="typing__dot" aria-hidden="true"></span>
        <p class="typing__label">SPPH думает...</p>
      </div>
    </div>

    <form class="composer" @submit.prevent="handleSend">
      <label class="composer__label" for="message-input">Сообщение</label>
      <div class="composer__field">
        <textarea
          id="message-input"
          v-model="draft"
          placeholder="Например: предложи идеи партнёрской интеграции с EdTech-платформами"
          rows="2"
          :disabled="isLoading"
          @keydown.enter.exact.prevent="handleSend"
        ></textarea>
        <button type="submit" class="composer__button" :disabled="!canSubmit">
          <span v-if="!isLoading">Отправить</span>
          <span v-else>Ждём ответ...</span>
        </button>
      </div>
      <p class="composer__hint">
        Советы: попроси таблицу бюджетов, шаблон письма партнёру или стратегию выхода на новый рынок.
      </p>
    </form>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, reactive, ref } from 'vue';

const conversation = reactive([
  {
    id: crypto.randomUUID(),
    role: 'assistant',
    content:
      'Привет! Я помогу придумать крутую партнёрскую интеграцию, медиа-план или рассчитать оффер. Чем займёмся?',
    createdAt: new Date(),
  },
]);

const draft = ref('');
const isLoading = ref(false);
const messageList = ref(null);

const canSubmit = computed(() => draft.value.trim().length > 0 && !isLoading.value);

function authorLabel(role) {
  return role === 'assistant' ? 'SPPH' : 'Вы';
}

function formatTime(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

async function handleSend() {
  if (!canSubmit.value) return;

  const content = draft.value.trim();
  draft.value = '';
  const userMessage = {
    id: crypto.randomUUID(),
    role: 'user',
    content,
    createdAt: new Date(),
  };

  conversation.push(userMessage);
  await nextTick(scrollToLatest);

  isLoading.value = true;

  try {
    const history = conversation
      .filter((message) => message.role !== 'system')
      .slice(-8)
      .map(({ role, content }) => ({ role, content }));

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: history }),
    });

    if (!response.ok) {
      const errorPayload = await response.json().catch(() => ({}));
      throw new Error(errorPayload.error || 'Не удалось получить ответ от сервера.');
    }

    const payload = await response.json();
    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: payload.reply || 'Ответ не получен. Попробуйте ещё раз.',
      createdAt: new Date(),
    };

    conversation.push(assistantMessage);
    await nextTick(scrollToLatest);
  } catch (error) {
    const fallbackMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content:
        'Кажется, сервис перегружен. Попробуй ещё раз через минуту или проверь конфигурацию API-ключа на сервере.',
      createdAt: new Date(),
    };

    console.error(error);
    conversation.push(fallbackMessage);
    await nextTick(scrollToLatest);
  } finally {
    isLoading.value = false;
  }
}

function scrollToLatest() {
  if (!messageList.value) return;
  const container = messageList.value;
  container.scrollTo({
    top: container.scrollHeight,
    behavior: 'smooth',
  });
}

onMounted(() => {
  scrollToLatest();
});
</script>

<style scoped>
.window {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  min-height: min(70vh, 640px);
}

.window__messages {
  background: rgba(245, 247, 255, 0.7);
  border-radius: 20px;
  padding: 1.5rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-height: 60vh;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), inset 0 -1px 0 rgba(76, 95, 255, 0.05);
}

.bubble {
  padding: 1rem 1.25rem;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  line-height: 1.6;
  white-space: pre-wrap;
}

.bubble__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.bubble__author {
  font-weight: 600;
}

.bubble__time {
  color: #6b7a99;
}

.bubble__content {
  font-size: 0.95rem;
  color: #1f2537;
}

.bubble--assistant {
  align-self: flex-start;
  background: linear-gradient(135deg, rgba(99, 114, 255, 0.18), rgba(127, 93, 255, 0.12));
  border: 1px solid rgba(99, 114, 255, 0.35);
}

.bubble--user {
  align-self: flex-end;
  background: #ffffff;
  border: 1px solid rgba(212, 220, 255, 0.8);
  box-shadow: 0 8px 16px -12px rgba(46, 55, 146, 0.4);
}

.typing {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: #5c6a92;
  font-size: 0.85rem;
}

.typing__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5c6a92;
  animation: pulse 1.2s infinite ease-in-out;
}

.typing__dot:nth-child(2) {
  animation-delay: 0.2s;
}

.typing__dot:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes pulse {
  0%,
  80%,
  100% {
    transform: scale(0.6);
    opacity: 0.6;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

.composer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.composer__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: #3a4767;
}

.composer__field {
  display: flex;
  gap: 0.75rem;
  align-items: stretch;
}

.composer textarea {
  flex: 1;
  resize: vertical;
  min-height: 76px;
  border-radius: 16px;
  border: 1px solid rgba(112, 134, 255, 0.3);
  padding: 0.85rem 1rem;
  background: rgba(255, 255, 255, 0.85);
  color: #1f2537;
  transition: border 0.2s ease, box-shadow 0.2s ease;
}

.composer textarea:focus {
  outline: none;
  border-color: rgba(99, 114, 255, 0.65);
  box-shadow: 0 0 0 4px rgba(99, 114, 255, 0.15);
}

.composer textarea:disabled {
  opacity: 0.7;
}

.composer__button {
  border: none;
  border-radius: 16px;
  padding: 0 1.75rem;
  font-weight: 600;
  background: linear-gradient(135deg, #6c7bff 0%, #7c5dff 100%);
  color: white;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.2s ease;
}

.composer__button:disabled {
  cursor: not-allowed;
  background: linear-gradient(135deg, rgba(140, 148, 255, 0.7), rgba(160, 136, 255, 0.7));
}

.composer__button:not(:disabled):hover {
  transform: translateY(-2px);
  box-shadow: 0 16px 32px -18px rgba(100, 110, 255, 0.8);
}

.composer__hint {
  font-size: 0.8rem;
  color: #6b7a99;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.25s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .window {
    gap: 1.25rem;
  }

  .window__messages {
    max-height: 55vh;
  }

  .composer__field {
    flex-direction: column;
  }

  .composer__button {
    width: 100%;
    padding: 0.85rem 1rem;
  }
}
</style>
