import request from 'supertest';
import { describe, expect, it, vi, beforeAll } from 'vitest';

process.env.DATABASE_URL = 'file:./test.db';
process.env.PORT = '0';
process.env.LLM_PROVIDER = 'dummy';
process.env.npm_package_version = 'test';

const recordInteraction = vi.fn();
const getUserStats = vi.fn();
const recordVisitEvent = vi.fn();

const processMessage = vi.fn(async () => ({
  text: 'Hello world',
  intent: 'qa',
  usedProfile: { topics: [] },
  usedContextSize: 0,
  usage: {
    promptTokens: 5,
    completionTokens: 2
  },
  model: 'dummy'
}));

vi.mock('./agent/orchestrator.js', () => ({
  processMessage
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
    expect(res.body).toEqual({ ok: true, version: 'test' });
  });

  it('handles chat completions', async () => {
    const payload = {
      userId: '11111111-1111-1111-1111-111111111111',
      message: 'Hi there'
    };

    const res = await request(app).post('/api/chat').send(payload);
    expect(res.status).toBe(200);
    expect(res.body.reply).toBe('Hello world');
    expect(res.body.intent).toBe('qa');
    expect(processMessage).toHaveBeenCalledWith({ userId: payload.userId, message: payload.message });
    expect(recordInteraction).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: payload.userId,
        promptLen: payload.message.length
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

  it('manages user profiles', async () => {
    const userId = '11111111-1111-1111-1111-111111111111';
    const getRes = await request(app).get('/api/user/profile').query({ userId });
    expect(getRes.status).toBe(200);
    expect(getRes.body).toEqual({ topics: [] });

    const postRes = await request(app)
      .post('/api/user/profile')
      .send({ userId, patch: { major: 'Экономика', topics: ['spph'] } });
    expect(postRes.status).toBe(200);
    expect(postRes.body).toEqual({ major: 'Экономика', topics: ['spph'] });
  });
});
