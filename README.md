# SPPH Partner Studio

Современное веб-приложение на Node.js + Vue 3, которое превращает идеи партнёрок в готовые шаги. Интерфейс работает поверх собственного backend-шлюза и проксирует запросы к бесплатному (на старте) API Mistral AI.

## Быстрый старт

1. Установите зависимости:
   ```bash
   npm install
   npm --prefix frontend install
   ```
2. Создайте файл `.env` в корне и добавьте API-ключ Mistral (зарегистрируйтесь на [platform.mistral.ai](https://platform.mistral.ai/) — стартовый тариф бесплатный):
   ```env
   MISTRAL_API_KEY=sk-...
   # Дополнительно можно переопределить модель:
   # MISTRAL_MODEL=mistral-small-latest
   ```
3. Запустите одновременно backend и frontend:
   ```bash
   npm run dev
   ```
4. Откройте [http://localhost:5173](http://localhost:5173) и попробуйте чат. Все запросы будут проходить через backend на `http://localhost:3000`.

> Если нужно запустить только одну часть: `npm run server` для backend и `npm --prefix frontend run dev` для Vue-интерфейса.

## Архитектура

- `server/index.js` — Express-сервер с REST-эндпоинтом `/api/chat`. Валидирует сообщения, добавляет system prompt и обращается к Mistral API.
- `server/mistralClient.js` — небольшая обёртка над fetch с защитой от пустых ответов и понятными ошибками.
- `frontend/` — приложение на Vite + Vue 3. Компонент `ChatWindow.vue` отвечает за логику переписки и визуальные эффекты.

### Конфигурация

Доступные переменные окружения:

| Переменная | Назначение | Значение по умолчанию |
| --- | --- | --- |
| `MISTRAL_API_KEY` | API-ключ для Mistral | — (обязательная) |
| `MISTRAL_MODEL` | Модель Mistral | `mistral-small-latest` |
| `AI_API_URL` | Альтернативный endpoint | `https://api.mistral.ai/v1/chat/completions` |
| `SYSTEM_PROMPT` | Собственный system prompt | Предустановленный приветливый тон |
| `PORT` | Порт backend | `3000` |
| `CORS_ORIGINS` | Список разрешённых Origin (через запятую) | `*` |

## Production-сборка

1. Соберите фронтенд:
   ```bash
   npm run build
   ```
   артефакты появятся в `frontend/dist`.
2. Раздавайте их любым статическим сервером (например через Nginx или Vercel) и проксируйте `/api` на Node backend.

## Как отправить проект на GitHub

Локальный репозиторий в этой среде не привязан к удалённому. Чтобы увидеть изменения на GitHub:

1. Создайте пустой репозиторий на GitHub и скопируйте его URL (например `https://github.com/username/spph.git`).
2. Добавьте удалённый origin в локальный проект:
   ```bash
   git remote add origin https://github.com/username/spph.git
   ```
   > Если origin уже существует, обновите URL: `git remote set-url origin <адрес>`.
3. Отправьте текущую ветку вместе с тегами (по желанию):
   ```bash
   git push -u origin work
   ```
   Замените `work` на имя нужной ветки.
4. После пуша откройте репозиторий в браузере — изменения появятся в разделе *Code* и в Pull Requests (если вы создадите PR).

> В контейнерной среде ключи SSH не настроены, поэтому проще использовать HTTPS и персональный токен GitHub.

## Скриншоты

![SPPH chat preview](docs/chat-preview.png)

_(Скриншот можно обновить после развёртывания, добавив изображение в `docs/chat-preview.png`.)_
