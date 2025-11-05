interface RequestOptions extends RequestInit {
  params?: Record<string, string | number>;
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
      ...(options.headers ?? {})
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
}

export interface ChatResponsePayload {
  reply: string;
  intent: 'qa' | 'search' | 'explain';
  usage: {
    promptTokens?: number;
    completionTokens?: number;
  };
  profileHint?: string;
}

export interface UserProfilePayload {
  major?: string;
  topics: string[];
  level?: string;
}

export interface ProfileUpdatePayload {
  userId: string;
  patch: Partial<UserProfilePayload> & { topics?: string[] };
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
  chat(payload: ChatRequestPayload) {
    return request<ChatResponsePayload>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  fetchUserProfile(userId: string) {
    return request<UserProfilePayload>('/api/user/profile', {
      params: { userId }
    });
  },
  updateUserProfile(payload: ProfileUpdatePayload) {
    return request<UserProfilePayload>('/api/user/profile', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },
  fetchUserStats(userId: string) {
    return request<UserStatsResponse>(`/api/users/${userId}/stats`);
  },
  sendVisitEvent(payload: VisitEventPayload) {
    return request<{ sessionId?: string }>('/api/metrics/visit', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }
};
