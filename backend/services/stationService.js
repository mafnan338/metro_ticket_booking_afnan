import { Station } from '../models/index.js';
import mongoose from 'mongoose';
import stationsData from '../data/stations.json' with { type: 'json' };

const dbConnected = mongoose.connection?.readyState === 1;

export async function seedStations() {
  if (!dbConnected) {
    console.log('MongoDB not connected. Using in-memory station data.');
    return;
  }
  const count = await Station.countDocuments();
  if (count === 0) {
    await Station.insertMany(stationsData);
    console.log(`Seeded ${stationsData.length} stations.`);
  } else {
    console.log(`Database already has ${count} stations. Skipping seed.`);
  }
}

// Try DB first, fall back to JSON
export async function getAllStations() {
  try {
    if (dbConnected) {
      return await Station.find({}).sort({ stationId: 1 });
    }
  } catch {}
  return [...stationsData].sort((a, b) => a.stationId.localeCompare(b.stationId));
}

export async function getStationById(id) {
  try {
    if (dbConnected) {
      const s = await Station.findOne({ stationId: id });
      if (s) return s;
    }
  } catch {}
  return stationsData.find(s => s.stationId === id) || null;
}

export async function searchStation(query) {
  const q = query.toLowerCase();
  try {
    if (dbConnected) {
      return await Station.find({
        $or: [
          { name: { $regex: q, $options: 'i' } },
          { stationId: { $regex: q, $options: 'i' } },
          { line: { $regex: q, $options: 'i' } }
        ]
      }).sort({ stationId: 1 });
    }
  } catch {}
  return stationsData
    .filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.stationId.toLowerCase().includes(q) ||
      s.line.toLowerCase().includes(q)
    )
    .sort((a, b) => a.stationId.localeCompare(b.stationId));
}
