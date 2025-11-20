export interface AuthResponse {
  token: string;
  user: { id: string; name: string; email: string };
}

export interface SessionSummary {
  id: string;
  title: string;
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

export interface ActivitySummary {
  totalMessages: number;
  totalSessions: number;
  lastActiveAt: string | null;
  sessions: SessionSummary[];
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
  createSession(payload: { title: string }, authToken: string) {
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
  }
};
