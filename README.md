# SPPH Landing & Chat Demo

This repo contains the marketing landing page and a simple chat playground for the SPPH assistant.

## How to preview

1. From the project root, start a lightweight static file server (any server works):
   ```bash
   python3 -m http.server 8000
   ```
2. Open your browser to [`http://localhost:8000/index.html`](http://localhost:8000/index.html) to see the landing page.
3. Visit [`http://localhost:8000/chat.html`](http://localhost:8000/chat.html) to try the chat experience powered by the public Affiliate+ API.

> 💡 You can also use any other static file server (for example VS Code Live Server). The API calls require an HTTP origin, so opening the file directly from disk (`file://`) may block requests in some browsers.

## Notes

- The chat demo uses the unauthenticated public endpoint at `https://api.affiliateplus.xyz/api/chatbot`.
- Because it is a public demo service, responses may occasionally be slow or temporarily unavailable.

## Русская версия

1. Запустите простой локальный сервер из корня проекта:
   ```bash
   python3 -m http.server 8000
   ```
2. Откройте в браузере [`http://localhost:8000/index.html`](http://localhost:8000/index.html) — это главная страница.
3. Перейдите по адресу [`http://localhost:8000/chat.html`](http://localhost:8000/chat.html), чтобы увидеть чат.

> ⚠️ При открытии файлов напрямую (через `file://`) браузер может заблокировать запросы к API. Поэтому используйте локальный сервер.

