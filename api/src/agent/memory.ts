export type MemoryRole = 'system' | 'user' | 'assistant';

export interface MemoryMessage {
  userId: string;
  role: MemoryRole;
  text: string;
  createdAt: Date;
}

export interface UserProfile {
  major?: string;
  topics: string[];
  level?: string;
}

const conversations = new Map<string, MemoryMessage[]>();
const profiles = new Map<string, UserProfile>();

const defaultProfile: UserProfile = {
  topics: []
};

export const saveMessage = ({ userId, role, text }: { userId: string; role: MemoryRole; text: string }) => {
  const history = conversations.get(userId) ?? [];
  history.push({ userId, role, text, createdAt: new Date() });
  conversations.set(userId, history);
};

export const replaceConversation = (
  userId: string,
  messages: Array<{ role: MemoryRole; text: string; createdAt?: Date }>
) => {
  const normalized = messages.map((message) => ({
    userId,
    role: message.role,
    text: message.text,
    createdAt: message.createdAt ?? new Date()
  }));
  conversations.set(userId, normalized);
};

export const getRecentConversation = (userId: string, limit = 12): MemoryMessage[] => {
  const history = conversations.get(userId) ?? [];
  return history.slice(-limit);
};

export const getUserProfile = (userId: string): UserProfile => {
  return profiles.get(userId) ?? { ...defaultProfile };
};

export const updateUserProfile = (userId: string, patch: Partial<UserProfile>) => {
  const current = getUserProfile(userId);
  const topics = patch.topics ? Array.from(new Set(patch.topics.filter(Boolean))) : current.topics;
  const updated: UserProfile = {
    ...current,
    ...patch,
    topics
  };
  profiles.set(userId, updated);
  return updated;
};
