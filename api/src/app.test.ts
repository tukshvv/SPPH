import request from 'supertest';
import { describe, expect, it, vi, beforeAll } from 'vitest';

process.env.DATABASE_URL = 'file:./test.db';
process.env.PORT = '0';
process.env.OPENAI_API_KEY = 'test-key';

const recordInteraction = vi.fn();
const getUserStats = vi.fn();
const recordVisitEvent = vi.fn();

vi.mock('./services/llmService.js', () => ({
  sendChatCompletion: vi.fn(async () => ({
    content: 'Hello world',
    model: 'gpt-3.5-turbo',
    promptTokens: 5,
    completionTokens: 2,
    costUsd: 0
  }))
}));

vi.mock('./services/analyticsService.js', () => ({
  recordInteraction,
  getUserStats,
  recordVisitEvent
}));

type CreateApp = typeof import('./app.js')['createApp'];

let app: ReturnType<CreateApp>;
let createApp: CreateApp;

beforeAll(async () => {
  ({ createApp } = await import('./app.js'));
  app = createApp();
});

describe('API surface', () => {
  it('returns health status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('handles chat completions', async () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      messages: [
        { role: 'user', content: 'Hi there' }
      ]
    };

    const res = await request(app).post('/api/chat').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Hello world');
    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: payload.userId,
        promptLen: payload.messages[0].content.length
      })
    );
  });

  it('returns user stats', async () => {
    const stats = {
      totalRequests: 2,
      sessionsCount: 1,
      totalTimeMs: 1000,
      avgPromptLength: 42,
      avgResponseLength: 64,
      recentInteractions: []
    };
    getUserStats.mockResolvedValueOnce(stats);

    const res = await request(app).get('/api/users/11111111-1111-1111-1111-111111111111/stats');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(stats);
  });

  it('tracks visit events', async () => {
    recordVisitEvent.mockResolvedValueOnce({ sessionId: 'session-1' });
    const res = await request(app)
      .post('/api/metrics/visit')
      .send({
        userId: '11111111-1111-1111-1111-111111111111',
        event: 'start'
      });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ sessionId: 'session-1' });
  });
});
