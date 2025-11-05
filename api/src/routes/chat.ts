import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { chatRequestSchema } from '../schemas/chat.js';
import { recordInteraction } from '../services/analyticsService.js';
import { processMessage } from '../agent/orchestrator.js';
import { replaceConversation } from '../agent/memory.js';
import type { ChatRequestBody } from '../schemas/chat.js';
import { logger } from '../utils/logger.js';
import { HttpError } from '../utils/errors.js';

export const chatRouter = Router();

chatRouter.post('/', validate(chatRequestSchema), async (req, res, next) => {
  const startedAt = Date.now();
  try {
    const { userId, sessionId, message, messages, mode } = req.body as ChatRequestBody;

    let prompt = message;

    if (!prompt && messages) {
      const lastUserMessage = [...messages].reverse().find((msg) => msg.role === 'user');
      if (!lastUserMessage) {
        throw new HttpError(400, 'NO_USER_MESSAGE', 'Последнее сообщение пользователя не найдено');
      }
      prompt = lastUserMessage.content;
      const previousMessages = messages.slice(0, -1).map((msg) => ({
        role: msg.role,
        text: msg.content
      }));
      if (previousMessages.length > 0) {
        replaceConversation(userId, previousMessages);
      }
    }

    if (!prompt) {
      throw new HttpError(400, 'EMPTY_MESSAGE', 'Сообщение не должно быть пустым');
    }

    const result = await processMessage({ userId, message: prompt, mode });

    await recordInteraction({
      userId,
      sessionId,
      promptLen: prompt.length,
      responseLen: result.text.length,
      model: result.model ?? 'unknown',
      promptTokens: result.usage?.promptTokens,
      completionTokens: result.usage?.completionTokens,
      costUsd: undefined
    });

    const duration = Date.now() - startedAt;

    logger.info(
      {
        requestId: req.requestId,
        userId,
        intent: result.intent,
        contextSize: result.usedContextSize,
        duration,
        status: 200
      },
      'Processed chat message'
    );

    res.json({
      reply: result.text,
      intent: result.intent,
      usage: {
        promptTokens: result.usage?.promptTokens,
        completionTokens: result.usage?.completionTokens
      },
      profileHint: result.profileHint ?? undefined,
      citations: result.citations ?? [],
      mode: result.mode
    });
  } catch (error) {
    const status = error instanceof HttpError ? error.status : error.status ?? 500;
    const duration = Date.now() - startedAt;
    logger.error(
      {
        requestId: req.requestId,
        error,
        status,
        duration
      },
      'Failed to process chat message'
    );
    next(error);
  }
});
