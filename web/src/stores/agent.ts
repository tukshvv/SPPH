import { defineStore } from 'pinia';
import { apiClient } from '../lib/api';
import { useUserStore } from './user';
import { useNotificationStore } from './notifications';

export type AgentStepStatus = 'pending' | 'running' | 'complete' | 'error';

export interface AgentStep {
  id: string;
  title: string;
  detail?: string;
  status: AgentStepStatus;
  result?: string;
  error?: string;
}

export interface AgentLogEntry {
  id: string;
  type: 'plan' | 'step' | 'note';
  stepId?: string;
  content: string;
  createdAt: string;
}

export interface AgentRun {
  id: string;
  goal: string;
  context?: string;
  useDocs: boolean;
  autoStart: boolean;
  createdAt: string;
  steps: AgentStep[];
  summary?: string;
  successCriteria?: string[];
  lastUpdatedAt: string;
  log: AgentLogEntry[];
}

interface AgentState {
  currentRun: AgentRun | null;
  isPlanning: boolean;
  isExecuting: boolean;
  autoRunning: boolean;
}

interface PlanStepPayload {
  title?: string;
  detail?: string;
}

interface ParsedPlan {
  steps: PlanStepPayload[];
  summary?: string;
  successCriteria?: string[];
}

const extractJsonLike = (text: string) => {
  const codeBlockMatch = text.match(/```json([\s\S]*?)```/i);
  const candidate = codeBlockMatch ? codeBlockMatch[1] : text;
  const trimmed = candidate.trim();
  if (!trimmed) return null;

  const tryParse = (value: string) => {
    try {
      return JSON.parse(value);
    } catch (error) {
      return null;
    }
  };

  const direct = tryParse(trimmed);
  if (direct) return direct;

  const objectStart = trimmed.indexOf('{');
  const objectEnd = trimmed.lastIndexOf('}');
  if (objectStart !== -1 && objectEnd !== -1) {
    const slice = trimmed.slice(objectStart, objectEnd + 1);
    const parsed = tryParse(slice);
    if (parsed) return parsed;
  }

  const arrayStart = trimmed.indexOf('[');
  const arrayEnd = trimmed.lastIndexOf(']');
  if (arrayStart !== -1 && arrayEnd !== -1) {
    const slice = trimmed.slice(arrayStart, arrayEnd + 1);
    const parsed = tryParse(slice);
    if (parsed) return parsed;
  }

  return null;
};

const parsePlan = (reply: string): ParsedPlan => {
  const parsed = extractJsonLike(reply);

  if (parsed && typeof parsed === 'object') {
    const stepsPayload: PlanStepPayload[] = [];

    if (Array.isArray((parsed as { steps?: unknown }).steps)) {
      for (const entry of (parsed as { steps: unknown[] }).steps) {
        if (typeof entry === 'string') {
          stepsPayload.push({ title: entry });
          continue;
        }
        if (entry && typeof entry === 'object') {
          const maybeTitle = (entry as { title?: string; step?: string }).title ?? (entry as { step?: string }).step;
          const maybeDetail = (entry as { detail?: string; description?: string }).detail ?? (
            entry as { description?: string }
          ).description;
          if (maybeTitle || maybeDetail) {
            stepsPayload.push({ title: maybeTitle, detail: maybeDetail });
          }
        }
      }
    }

    const summary = (parsed as { summary?: unknown }).summary;
    const successCriteria = (parsed as { success?: unknown; successCriteria?: unknown }).successCriteria ?? (
      parsed as { success?: unknown }
    ).success;

    return {
      steps: stepsPayload,
      summary: typeof summary === 'string' ? summary : undefined,
      successCriteria: Array.isArray(successCriteria)
        ? (successCriteria as unknown[])
            .filter((item): item is string => typeof item === 'string')
            .map((item) => item.trim())
        : undefined
    };
  }

  const lines = reply
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const steps: PlanStepPayload[] = [];
  for (const line of lines) {
    const match = line.match(/^(?:\d+[\).]|[-*•])\s*(.+)$/u);
    if (match) {
      steps.push({ title: match[1] });
    }
  }

  if (steps.length === 0 && reply.trim()) {
    steps.push({ title: reply.trim() });
  }

  return { steps };
};

const buildPlanningPrompt = (goal: string, context: string, docsAvailable: boolean) => {
  const contextBlock = context
    ? `Дополнительный контекст пользователя:\n${context.trim()}\n\n`
    : '';
  const docsLine = docsAvailable
    ? 'У пользователя загружены документы. Используй их как контекст, когда это полезно.'
    : 'Пока нет загруженных документов, опирайся на общий контекст.';

  return [
    'Ты — автономный ИИ-агент команды SPPH.',
    'Сформируй структурированный план действий, чтобы достичь цели пользователя.',
    docsLine,
    '',
    `Цель: ${goal.trim()}`,
    contextBlock,
    'Ответь в JSON формате: {"summary": string, "steps": [{"title": string, "detail": string}], "successCriteria": string[]}.',
    'Если каких-то данных нет, всё равно оставь поле и заполни его максимально полезно.'
  ]
    .filter(Boolean)
    .join('\n');
};

const buildExecutionPrompt = (run: AgentRun, step: AgentStep) => {
  const completed = run.steps
    .filter((entry) => entry.status === 'complete' && entry.result)
    .map((entry, index) => `${index + 1}. ${entry.title}: ${entry.result}`)
    .join('\n');

  const historyBlock = completed
    ? `Предыдущие завершённые шаги:\n${completed}\n\n`
    : 'Шаги ещё не завершались.\n\n';

  const contextBlock = run.context ? `Контекст пользователя:\n${run.context}\n\n` : '';

  const detail = step.detail ? `Детали шага: ${step.detail}\n` : '';

  return [
    'Ты выступаешь как автономный агент и выполняешь текущий шаг плана.',
    `Главная цель: ${run.goal}`,
    contextBlock,
    historyBlock,
    `Текущий шаг: ${step.title}`,
    detail,
    'Сформируй подробный результат и перечисли следующие возможные действия, если они нужны.'
  ]
    .filter(Boolean)
    .join('\n');
};

export const useAgentStore = defineStore('agent', {
  state: (): AgentState => ({
    currentRun: null,
    isPlanning: false,
    isExecuting: false,
    autoRunning: false
  }),
  getters: {
    pendingSteps: (state) =>
      state.currentRun?.steps.filter((step) => step.status === 'pending' || step.status === 'error') ?? []
  },
  actions: {
    resetRun() {
      this.currentRun = null;
      this.isPlanning = false;
      this.isExecuting = false;
      this.autoRunning = false;
    },
    async planRun(payload: { goal: string; context: string; useDocs: boolean; autoStart: boolean }) {
      const goal = payload.goal.trim();
      if (!goal) {
        throw new Error('Цель агента не может быть пустой.');
      }

      const userStore = useUserStore();
      userStore.initialize();
      const userId = userStore.userId;

      if (!userId) {
        const notifications = useNotificationStore();
        notifications.push({
          title: 'Требуется регистрация',
          description: 'Зарегистрируйтесь, чтобы запускать автономного агента.',
          tone: 'info'
        });
        throw new Error('Пользователь не зарегистрирован.');
      }

      this.isPlanning = true;
      this.autoRunning = false;
      this.isExecuting = false;

      try {
        const prompt = buildPlanningPrompt(goal, payload.context, payload.useDocs);
        const response = await apiClient.chat({
          userId,
          message: prompt,
          mode: payload.useDocs ? 'rag' : 'auto'
        });

        const plan = parsePlan(response.reply);
        const timestamp = new Date().toISOString();
        const steps = plan.steps.length
          ? plan.steps.map((step, index) => ({
              id: crypto.randomUUID(),
              title: step.title?.trim() || `Шаг ${index + 1}`,
              detail: step.detail?.trim(),
              status: 'pending' as AgentStepStatus
            }))
          : [
              {
                id: crypto.randomUUID(),
                title: goal,
                status: 'pending' as AgentStepStatus
              }
            ];

        this.currentRun = {
          id: crypto.randomUUID(),
          goal,
          context: payload.context.trim() || undefined,
          useDocs: payload.useDocs,
          autoStart: payload.autoStart,
          createdAt: timestamp,
          lastUpdatedAt: timestamp,
          steps,
          summary: plan.summary,
          successCriteria: plan.successCriteria,
          log: [
            {
              id: crypto.randomUUID(),
              type: 'plan',
              content: response.reply,
              createdAt: timestamp
            }
          ]
        };
      } catch (error) {
        const notifications = useNotificationStore();
        const description = error instanceof Error ? error.message : 'Не удалось построить план.';
        notifications.push({
          title: 'Планирование не удалось',
          description,
          tone: 'error'
        });
        throw error;
      } finally {
        this.isPlanning = false;
      }
    },
    async executeStep(stepId: string) {
      if (this.isExecuting) {
        return;
      }
      if (!this.currentRun) {
        throw new Error('Нет активного плана.');
      }

      const run = this.currentRun;
      const step = run.steps.find((entry) => entry.id === stepId);
      if (!step) {
        throw new Error('Шаг не найден.');
      }
      if (step.status === 'running') {
        return;
      }

      const userStore = useUserStore();
      userStore.initialize();
      const userId = userStore.userId;
      if (!userId) {
        const notifications = useNotificationStore();
        notifications.push({
          title: 'Требуется регистрация',
          description: 'Зарегистрируйтесь, чтобы выполнять шаги агента.',
          tone: 'info'
        });
        throw new Error('Пользователь не зарегистрирован.');
      }

      const notifications = useNotificationStore();

      this.isExecuting = true;
      step.status = 'running';
      step.error = undefined;

      try {
        const prompt = buildExecutionPrompt(run, step);
        const response = await apiClient.chat({
          userId,
          message: prompt,
          mode: run.useDocs ? 'rag' : 'auto'
        });

        step.status = 'complete';
        step.result = response.reply;
        run.lastUpdatedAt = new Date().toISOString();
        run.log.push({
          id: crypto.randomUUID(),
          type: 'step',
          stepId: step.id,
          content: response.reply,
          createdAt: run.lastUpdatedAt
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Неизвестная ошибка';
        step.status = 'error';
        step.error = message;
        run.lastUpdatedAt = new Date().toISOString();
        notifications.push({
          title: 'Шаг не выполнен',
          description: message,
          tone: 'error'
        });
        throw error;
      } finally {
        this.isExecuting = false;
      }
    },
    async autoRunSteps() {
      if (!this.currentRun || this.autoRunning) {
        return;
      }
      this.autoRunning = true;
      try {
        for (const step of this.currentRun.steps) {
          if (!this.autoRunning) {
            break;
          }
          if (step.status === 'complete') {
            continue;
          }
          await this.executeStep(step.id);
          if (step.status === 'error') {
            break;
          }
        }
      } finally {
        this.autoRunning = false;
      }
    },
    cancelAutoRun() {
      this.autoRunning = false;
    },
    markStepComplete(stepId: string) {
      if (!this.currentRun) return;
      const step = this.currentRun.steps.find((entry) => entry.id === stepId);
      if (!step) return;
      step.status = 'complete';
      step.error = undefined;
      step.result = step.result ?? 'Отмечено вручную пользователем.';
      this.currentRun.lastUpdatedAt = new Date().toISOString();
    },
    resetStep(stepId: string) {
      if (!this.currentRun) return;
      const step = this.currentRun.steps.find((entry) => entry.id === stepId);
      if (!step) return;
      step.status = 'pending';
      step.error = undefined;
      step.result = undefined;
    }
  }
});
