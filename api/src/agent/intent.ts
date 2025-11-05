const explainKeywords = ['объясни', 'explain', 'почему', 'как работает', 'разъясни'];
const searchKeywords = ['найди', 'поиск', 'search', 'ссылк', 'источник', 'resources'];
const qaKeywords = ['что', 'когда', 'где', 'кто'];

const includesKeyword = (text: string, keywords: string[]) => {
  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword));
};

export type AgentIntent = 'qa' | 'search' | 'explain';

export const detectIntent = (message: string): AgentIntent => {
  if (includesKeyword(message, explainKeywords)) {
    return 'explain';
  }

  if (includesKeyword(message, searchKeywords)) {
    return 'search';
  }

  if (includesKeyword(message, qaKeywords)) {
    return 'qa';
  }

  return 'qa';
};
