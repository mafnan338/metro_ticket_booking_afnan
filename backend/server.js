import mongoose from 'mongoose';
import app from './app.js';
import env from './config/env.js';
import { seedStations } from './services/stationService.js';

const PORT = env.PORT || 8000;

async function start() {
  try {
    // Connect to MongoDB (fail gracefully if unavailable)
    if (env.DATABASE && env.DATABASE !== 'mongodb://localhost:27017/metro_tickets') {
      try {
        await mongoose.connect(env.DATABASE);
        console.log('Connected to MongoDB Atlas');
        await seedStations();
      } catch (dbErr) {
        console.warn(`MongoDB connection failed: ${dbErr.message}. Running without database.`);
      }
    } else {
      console.warn('MongoDB not configured. Running without database. Use config.env to set DATABASE_URI.');
    }
  } catch (err) {
    console.warn('DB setup skipped:', err.message);
  }

  // Start server
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Environment: ${env.NODE_ENV || 'development'}`);
  });
}

start();
