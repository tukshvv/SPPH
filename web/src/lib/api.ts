export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export interface SessionSummary {
  id: string;
  title: string;
  mode: string;
  subject?: string | null;
  goal?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  lastMessageAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  feedback?: { id: string; value: number } | null;
}

export interface ChatSessionDetail extends SessionSummary {
  messages: ChatMessage[];
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  dueDate?: string | null;
  chatSessionId?: string | null;
  createdAt: string;
}

export interface NoteItem {
  id: string;
  title: string;
  subject?: string | null;
  content: string;
  updatedAt: string;
}

export interface PreferencesPayload {
  preferredLanguage: string;
  responseStyle: string;
}

export interface DashboardSummary {
  totalMessages: number;
  totalSessions: number;
  totalChats: number;
  tasksDone: number;
  tasksTodo: number;
  mostUsedMode: string;
  recentSubjects: (string | null)[];
  totalDaysActive?: number;
  streakCurrent?: number;
  streakLongest?: number;
}

export interface ActivitySummary {
  totalMessages: number;
  totalSessions: number;
  lastActiveAt: string | null;
  sessions: SessionSummary[];
}

export interface DailyUsageDay {
  date: string;
  messages: number;
  sessions: number;
}

export interface DailyUsageResponse {
  from: string;
  to: string;
  days: DailyUsageDay[];
}

export interface ProfilePayload {
  id: string;
  name: string;
  email: string;
  activity?: {
    totalMessages: number;
    totalSessions: number;
    lastActiveAt: string | null;
  };
}

interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  authToken?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050';

const buildUrl = (path: string, params?: Record<string, string | number>) => {
  if (!params) return `${API_BASE_URL}${path}`;
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => url.searchParams.append(key, String(value)));
  return url.toString();
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const response = await fetch(buildUrl(path, options.params), {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
      ...(options.authToken ? { Authorization: `Bearer ${options.authToken}` } : {})
    }
  });

  const contentType = response.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  if (!response.ok) {
    if (isJson) {
      const payload = await response.json();
      const message = payload?.error?.message ?? payload?.message ?? response.statusText;
      throw new Error(message);
    }
    throw new Error(response.statusText);
  }

  return (isJson ? response.json() : (undefined as unknown)) as Promise<T>;
}

export const apiClient = {
  register(payload: { name: string; email: string; password: string }) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  login(payload: { email: string; password: string }) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  getProfile(authToken: string) {
    return request<ProfilePayload>('/api/user/profile', { authToken });
  },
  updateProfile(payload: { name: string }, authToken: string) {
    return request<ProfilePayload>('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  getActivity(authToken: string) {
    return request<ActivitySummary>('/api/chat/activity', { authToken });
  },
  listSessions(authToken: string) {
    return request<{ sessions: SessionSummary[] }>('/api/chat/sessions', { authToken });
  },
  createSession(
    payload: { title: string; mode?: string; subject?: string | null; goal?: string | null; dueDate?: string | null },
    authToken: string
  ) {
    return request<{ session: SessionSummary }>('/api/chat/sessions', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  getSession(sessionId: string, authToken: string) {
    return request<ChatSessionDetail>(`/api/chat/sessions/${sessionId}`, { authToken });
  },
  sendMessage(sessionId: string, payload: { content: string; model?: string }, authToken: string) {
    return request<{ reply: ChatMessage; usage?: unknown }>(`/api/chat/sessions/${sessionId}/message`, {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  sendFeedback(payload: { messageId: string; value: number }, authToken: string) {
    return request<{ feedback: { id: string; value: number } }>('/api/chat/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  listTasks(authToken: string, status?: string) {
    return request<{ tasks: TaskItem[] }>('/api/tasks', { authToken, params: status ? { status } : undefined });
  },
  createTask(payload: Partial<TaskItem>, authToken: string) {
    return request<{ task: TaskItem }>('/api/tasks', { method: 'POST', body: JSON.stringify(payload), authToken });
  },
  updateTask(id: string, payload: Partial<TaskItem>, authToken: string) {
    return request<{ task: TaskItem }>(`/api/tasks/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      authToken
    });
  },
  deleteTask(id: string, authToken: string) {
    return request(`/api/tasks/${id}`, { method: 'DELETE', authToken });
  },
  createTasksFromText(payload: { text: string; chatSessionId?: string }, authToken: string) {
    return request<{ tasks: TaskItem[] }>('/api/tasks/from-text', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  listNotes(authToken: string, subject?: string) {
    return request<{ notes: NoteItem[] }>('/api/notes', { authToken, params: subject ? { subject } : undefined });
  },
  createNote(payload: { title: string; subject?: string | null; content: string }, authToken: string) {
    return request<{ note: NoteItem }>('/api/notes', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  updateNote(id: string, payload: Partial<NoteItem>, authToken: string) {
    return request<{ note: NoteItem }>(`/api/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
      authToken
    });
  },
  deleteNote(id: string, authToken: string) {
    return request(`/api/notes/${id}`, { method: 'DELETE', authToken });
  },
  getPreferences(authToken: string) {
    return request<PreferencesPayload>('/api/preferences/me', { authToken });
  },
  updatePreferences(payload: Partial<PreferencesPayload>, authToken: string) {
    return request<PreferencesPayload>('/api/preferences/me', {
      method: 'PATCH',
      body: JSON.stringify(payload),
      authToken
    });
  },
  getDashboard(authToken: string) {
    return request<DashboardSummary>('/api/dashboard/me', { authToken });
  },
  getDailyUsage(authToken: string, params?: { from?: string; to?: string }) {
    return request<DailyUsageResponse>('/api/usage/daily', { authToken, params });
  }
};
