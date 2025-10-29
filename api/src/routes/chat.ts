import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { chatRequestSchema } from '../schemas/chat.js';
import { sendChatCompletion } from '../services/llmService.js';
import { recordInteraction } from '../services/analyticsService.js';

export const chatRouter = Router();

chatRouter.post('/', validate(chatRequestSchema), async (req, res, next) => {
  try {
    const { userId, sessionId, messages } = req.body;
    const llmResponse = await sendChatCompletion(messages);

    const lastPrompt = [...messages].reverse().find((msg) => msg.role === 'user');

    await recordInteraction({
      userId,
      sessionId,
      promptLen: lastPrompt?.content.length ?? 0,
      responseLen: llmResponse.content.length,
      model: llmResponse.model,
      promptTokens: llmResponse.promptTokens,
      completionTokens: llmResponse.completionTokens,
      costUsd: llmResponse.costUsd
    });

    res.json({
      reply: llmResponse.content,
      model: llmResponse.model,
      usage: {
        promptTokens: llmResponse.promptTokens ?? 0,
        completionTokens: llmResponse.completionTokens ?? 0,
        costUsd: llmResponse.costUsd ?? 0
      }
    });
  } catch (error) {
    next(error);
  }
});
