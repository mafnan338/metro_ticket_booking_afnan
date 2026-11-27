import env from './config/env.js';
import mongoose from 'mongoose';
import app from './app.js';
import { seedStations } from './services/stationService.js';
import { chatbotConfigured } from './services/chatService.js';
import { Ticket, Station } from './models/index.js';

const PORT = env.PORT || 8000;

async function connectDatabase() {
  const uri = env.DATABASE;
  if (!uri || uri.includes('<')) {
    console.warn('MongoDB not configured. Running with in-memory data. Set DATABASE in backend/config.env.');
    return;
  }
  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
    console.log(`Connected to MongoDB (${mongoose.connection.host}/${mongoose.connection.name})`);
    // Drops indexes no longer in the schema (e.g. the old TTL index that deleted expired tickets).
    await Promise.all([Ticket.syncIndexes(), Station.syncIndexes()]);
    await seedStations();
  } catch (dbErr) {
    console.warn(`MongoDB connection failed: ${dbErr.message}. Running with in-memory data.`);
  }
}

mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected'));
mongoose.connection.on('reconnected', () => console.log('MongoDB reconnected'));

async function start() {
  await connectDatabase();

  const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Environment: ${env.NODE_ENV || 'development'}`);
    console.log(chatbotConfigured()
      ? `AI chatbot enabled (model: ${env.ANTHROPIC_MODEL || 'claude-sonnet-4-5'})`
      : 'AI chatbot disabled: set ANTHROPIC_API_KEY in backend/config.env');
  });

  server.on('error', err => {
    if (err.code === 'EADDRINUSE') console.error(`Port ${PORT} is already in use.`);
    else console.error('Server error:', err.message);
    process.exit(1);
  });
}

start();
