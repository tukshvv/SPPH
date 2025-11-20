interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
  authToken?: string | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5050';

const buildUrl = (path: string, params?: Record<string, string | number>) => {
  if (!params) return `${API_BASE_URL}${path}`;
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });
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

  if (!response.ok) {
    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      const payload = await response.json();
      const message = payload?.error?.message ?? payload?.message ?? response.statusText;
      throw new Error(message);
    }
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }

  return response.json() as Promise<T>;
}

export interface ChatRequestPayload {
  userId: string;
  message: string;
  mode?: 'auto' | 'rag' | 'basic';
}

export interface ChatResponsePayload {
  reply: string;
  intent: 'qa' | 'search' | 'explain';
  usage: {
    promptTokens?: number;
    completionTokens?: number;
  };
  profileHint?: string;
  citations: Array<{ docId: string; chunkIdx: number }>;
  mode: 'basic' | 'rag';
}

export interface UserProfilePayload {
  major?: string;
  topics: string[];
  level?: string;
  schedule: ScheduleItem[];
}

export interface ProfileUpdatePayload {
  userId: string;
  patch: Partial<UserProfilePayload> & { topics?: string[]; schedule?: ScheduleItem[] };
}

export interface LoginPayload {
  userId: string;
  password: string;
}

export interface ScheduleItem {
  id?: string;
  title: string;
  day: string;
  time: string;
  location?: string;
  description?: string;
}

export interface UserStatsResponse {
  totalRequests: number;
  sessionsCount: number;
  totalTimeMs: number;
  avgPromptLength: number;
  avgResponseLength: number;
  recentInteractions: Array<{
    id: string;
    createdAt: string;
    promptLen: number;
    responseLen: number;
    model: string;
    promptTokens: number;
    completionTokens: number;
    costUsd: number;
  }>;
}

export interface VisitEventPayload {
  userId: string;
  sessionId?: string;
  event: 'start' | 'stop' | 'heartbeat';
  timestamp?: string;
}

export const apiClient = {
  chat(payload: ChatRequestPayload, authToken?: string) {
    return request<ChatResponsePayload>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  ingestDocuments(
    docs: Array<{ id?: string; text: string; meta?: Record<string, unknown> }>,
    authToken?: string
  ) {
    return request<{ inserted: number; chunks: number }>('/api/ingest', {
      method: 'POST',
      body: JSON.stringify({ docs }),
      authToken
    });
  },
  fetchUserProfile(userId: string, authToken: string) {
    return request<UserProfilePayload>('/api/user/profile', {
      params: { userId },
      authToken
    });
  },
  updateUserProfile(payload: ProfileUpdatePayload, authToken: string) {
    return request<UserProfilePayload>('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  fetchUserStats(userId: string, authToken: string) {
    return request<UserStatsResponse>(`/api/users/${userId}/stats`, { authToken });
  },
  sendVisitEvent(payload: VisitEventPayload, authToken: string) {
    return request<{ sessionId?: string }>('/api/metrics/visit', {
      method: 'POST',
      body: JSON.stringify(payload),
      authToken
    });
  },
  login(payload: LoginPayload) {
    return request<{ token: string; userId: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
