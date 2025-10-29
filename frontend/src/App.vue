<template>
  <main class="page">
    <section class="chat">
      <header class="chat__header">
        <div class="chat__identity">
          <img src="./assets/logo.svg" alt="SPPH logo" class="chat__logo" />
          <div>
            <p class="chat__title">SPPH Partner Studio</p>
            <p class="chat__subtitle">Ваш личный AI-менеджер по партнёрствам</p>
          </div>
        </div>
        <p class="chat__hint">
          Спроси об идеях коллабораций, бюджете, или попроси составить персональное письмо.
        </p>
      </header>
      <ChatWindow />
    </section>
  </main>
</template>

<script setup>
import ChatWindow from './components/ChatWindow.vue';
</script>

<style scoped>
.page {
  width: min(1040px, 100%);
  display: flex;
  justify-content: center;
}

.chat {
  width: 100%;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: blur(12px);
  border-radius: 24px;
  padding: 2.5rem 2.75rem 2rem;
  box-shadow: 0 40px 80px -48px rgba(12, 22, 58, 0.45);
  border: 1px solid rgba(86, 110, 255, 0.1);
}

.chat__header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.chat__identity {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.chat__logo {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: #252b5f;
  padding: 0.35rem;
}

.chat__title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #121826;
}

.chat__subtitle {
  font-size: 0.95rem;
  font-weight: 500;
  color: #4e5d78;
}

.chat__hint {
  font-size: 0.95rem;
  color: #5f6f8f;
}

@media (max-width: 768px) {
  .chat {
    padding: 1.75rem 1.5rem;
  }

  .chat__header {
    align-items: flex-start;
  }

  .chat__logo {
    width: 40px;
    height: 40px;
  }
}
</style>
