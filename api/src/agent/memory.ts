export type MemoryRole = 'system' | 'user' | 'assistant';

export interface MemoryMessage {
  userId: string;
  role: MemoryRole;
  text: string;
  createdAt: Date;
}

const conversations = new Map<string, MemoryMessage[]>();

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
