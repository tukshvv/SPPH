import 'dotenv/config';

const DEFAULT_SYSTEM_PROMPT = `You are SPPH, a friendly multilingual AI assistant that helps founders explore partnership ideas. Keep answers concise, practical, and encouraging. When helpful, provide short step-by-step advice.`;

const DEFAULT_API_URL = process.env.AI_API_URL || 'https://api.mistral.ai/v1/chat/completions';
const DEFAULT_MODEL = process.env.MISTRAL_MODEL || 'mistral-small-latest';

export function createMistralClient(options = {}) {
  const {
    apiKey = process.env.MISTRAL_API_KEY,
    apiUrl = DEFAULT_API_URL,
    model = DEFAULT_MODEL,
    systemPrompt = process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
  } = options;

  async function sendChat(userMessages = []) {
    if (!apiKey) {
      throw new Error('MISTRAL_API_KEY is not set. Please add it to your environment or a .env file.');
    }

    const sanitizedMessages = userMessages
      .filter((message) => message && typeof message.content === 'string')
      .map((message) => ({
        role: message.role === 'assistant' ? 'assistant' : 'user',
        content: message.content.slice(0, 2000),
      }));

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          ...sanitizedMessages,
        ],
        temperature: 0.7,
        top_p: 0.95,
        max_tokens: 512,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upstream AI error (${response.status}): ${errorText}`);
    }

    const payload = await response.json();
    const assistantReply = payload?.choices?.[0]?.message?.content;

    if (!assistantReply) {
      throw new Error('The AI response did not include any message content.');
    }

    return assistantReply.trim();
  }

  return { sendChat };
}

export { DEFAULT_SYSTEM_PROMPT };
