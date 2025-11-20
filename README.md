# SPPH Chat MVP

Моно-репозиторий с минимально жизнеспособным продуктом для команды SPPH:

- **API** на Node.js 20 + Express + Prisma (SQLite) с подключаемыми LLM-провайдерами.
- **WEB** на Vite + Vue 3 (TypeScript) + Pinia + Vue Router + TailwindCSS.
- **Аналитика** по пользователям: количество запросов, длительность сессий, средние длины сообщений, последние взаимодействия.

## 1. Быстрый старт

```bash
# 1. Установите pnpm (https://pnpm.io/installation)
# 2. Установите зависимости в рабочих пространствах
pnpm install

# 3. Настройте переменные окружения
cp .env.example .env

# 4. Сгенерируйте Prisma client и примените миграции (SQLite хранится в api/prisma/dev.db)
pnpm --filter api prisma:generate
pnpm --filter api prisma:migrate

# 5. При первом запуске задайте пароль для входа в БД
# (по умолчанию используется spph-login, измените APP_LOGIN_PASSWORD в .env при необходимости)

# 6. Запустите API и WEB параллельно
pnpm -w dev
```

По умолчанию:

- API слушает `http://localhost:5050`
- WEB доступен по `http://localhost:5173`
- Для запросов, которые пишут в базу данных (чат, метрики, профиль), нужен токен авторизации:
  1. Войдите через POST `/api/auth/login` c `userId` (UUID) и `password` (APP_LOGIN_PASSWORD).
  2. Передавайте заголовок `Authorization: Bearer <token>` в API или выполните вход на фронтенде.

## 2. LLM провайдеры

Переключаются через `.env` переменную `LLM_PROVIDER`:

| Provider     | Описание                                                    | Требования              |
|--------------|-------------------------------------------------------------|-------------------------|
| `dummy`      | Эхо-ответ без внешних вызовов                               | Нет                     |
| `openrouter` | Прокси на OpenRouter (по умолчанию модель Mistral Nemo)     | `OPENROUTER_API_KEY`    |
| `openai`     | OpenAI Chat Completions API                                 | `OPENAI_API_KEY`        |

## 3. Сценарии npm/pnpm

Корневые команды:

- `pnpm -w dev` — параллельный запуск API (`ts-node-dev`) и WEB (`vite`).
- `pnpm -w build` — сборка обеих частей.
- `pnpm -w lint` — статический анализ TypeScript.
- `pnpm -w test` — unit / e2e тесты (API покрыт supertest).

Отдельные команды доступны в `api/package.json` и `web/package.json` (например `pnpm --filter api prisma:studio`).

## 4. Архитектура каталогов

```
/api
  src/
    app.ts            # конфигурация Express
    index.ts          # точка входа
    routes/           # chat, analytics
    services/         # llm, аналитика, метрики
    providers/        # openai, openrouter, dummy
    middleware/       # zod-валидация, error handler
    schemas/          # типы запросов
    utils/            # env, logger, prisma
  prisma/
    schema.prisma     # SQLite схема
    migrations/       # начальная миграция
/web
  src/
    pages/            # Chat и Dashboard
    components/       # UI-компоненты
    stores/           # Pinia (user, chat, metrics, notifications)
    lib/api.ts        # REST-клиент
  tailwind.config.cjs # тема с фирменным оранжевым (primary #F97316)
```

## 5. Безопасность и инфраструктура

- `.env` не коммитится; пример лежит в `.env.example`.
- Express защищён `helmet`, CORS ограничен локальным фронтендом, rate-limit — 30 запросов за 5 минут на сочетание IP + userId.
- Входные payload'ы проверяются через `zod`, ошибки централизованно логируются через `pino`.
- Логи и временные файлы игнорируются `.gitignore`.

## 6. Аналитика и метрики

- При первом заходе генерируется анонимный `userId` (UUID) и сохраняется в `localStorage`.
- Визиты отслеживаются через `/api/metrics/visit` (`start`, `heartbeat` каждые 15 секунд, `stop` перед уходом).
- Каждое обращение к `/api/chat` сохраняет Interaction + TokenUsage (если данные от провайдера доступны).
- Дашборд `/dashboard` показывает ключевые KPI и таблицу последних 20 взаимодействий.

## 7. Профиль и расписание

- Профиль пользователя хранится в базе (специализация, уровень, интересующие темы).
- Добавлено собственное расписание: в карточке профиля можно создавать/удалять события (день, время, место, описание) — данные сохраняются в БД и доступны после повторного входа.

## 8. UI-гайдлайн

- Tailwind с кастомным primary `#F97316` (hover `#EA580C`).
- Светлый фон, шрифт Inter / системный.
- Современные карточки, плавные hover-состояния, тосты для ошибок.

## 9. Тестирование

API покрыт базовыми проверками через `vitest + supertest` (`pnpm --filter api test`). Для фронта предусмотрен `vitest`, но UI-скриншоты/визуальные тесты на MVP-этапе не обязательны.

Для локальных прогонов без pnpm можно использовать:

```bash
# Применить миграции к тестовой базе
cd api && DATABASE_URL="file:./test.db" npx prisma migrate deploy

# Запустить юнит-тесты API
npx vitest run
```

## 10. Скриншоты UI

Скриншоты чата и дашборда находятся в каталоге `docs/screenshots/` (см. PR). При локальном запуске вы можете обновить их через любой инструмент захвата экрана.

## 11. Дальшие шаги

- Добавить авторизацию и привязку к реальным аккаунтам.
- Подключить Postgres и вынести Prisma datasource в переменные окружения.
- Расширить аналитический дашборд (конверсия, модели, ретроспектива по дням).

> Если что-то сломалось или появились идеи улучшения, создайте issue или ping в Slack: @spph-team.
