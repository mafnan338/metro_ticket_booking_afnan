import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import stationRoutes from './routes/stationRoutes.js';
import ticketRoutes from './routes/ticketRoutes.js';
import { chatLimiter, apiLimiter } from './middleware/rateLimiter.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', methods: ['GET', 'POST'] }));
app.use(express.json());
app.use(apiLimiter);

app.use('/api/stations', stationRoutes);
app.use('/api/tickets', ticketRoutes);
app.post('/api/chat', chatLimiter, async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message) return res.status(400).json({ success: false, error: 'Message is required' });

    const { reply, error } = await (await import('./services/chatService.js')).processChat(message, sessionId || 'default');
    res.json({ success: !error, reply, error });
  } catch {
    res.status(500).json({ success: false, error: 'Chat processing failed' });
  }
});

app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

app.use((err, req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

export default app;
