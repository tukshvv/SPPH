import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createMistralClient, DEFAULT_SYSTEM_PROMPT } from './mistralClient.js';

const app = express();
const port = process.env.PORT || 3000;

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : true;

app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '1mb' }));

const mistralClient = createMistralClient();

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    model: process.env.MISTRAL_MODEL || 'mistral-small-latest',
  });
});

app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {};

  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'Request body must include an array of messages.' });
  }

  try {
    const reply = await mistralClient.sendChat(messages);
    res.json({
      reply,
      systemPrompt: process.env.SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT,
    });
  } catch (error) {
    console.error('[chat] error', error);
    res.status(500).json({
      error: 'Failed to fetch a response from the AI service.',
      details: error.message,
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(port, () => {
  console.log(`SPPH AI gateway listening on http://localhost:${port}`);
});
