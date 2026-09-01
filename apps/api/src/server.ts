import { config } from 'dotenv';
import cors from 'cors';
import express from 'express';
import { fileURLToPath } from 'node:url';
import { runAgent } from './agent.js';

config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)) });

const app = express();
const port = Number(process.env.API_PORT ?? 3001);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'ai-developer-assistant-api' });
});

app.post('/api/chat', async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  try {
    const result = await runAgent(message.trim());
    return res.json({ answer: result.text });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : 'Unexpected server error.';
    return res.status(500).json({ error: messageText });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  const { message } = req.body as { message?: string };

  if (!message?.trim()) {
    return res.status(400).json({ error: 'message is required' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event: unknown) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await runAgent(message.trim(), [], send);
    send({ type: 'done' });
  } catch (error) {
    send({
      type: 'error',
      message: error instanceof Error ? error.message : 'Unexpected server error.',
    });
  } finally {
    res.end();
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
