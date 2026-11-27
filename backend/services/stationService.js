import { Station } from '../models/index.js';
import mongoose from 'mongoose';
import stationsData from '../data/stations.json' with { type: 'json' };

const PROJECTION = { _id: 0, stationId: 1, name: 1, line: 1, price: 1 };

export function dbReady() {
  return mongoose.connection?.readyState === 1;
}

export async function seedStations() {
  if (!dbReady()) {
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

function sortById(list) {
  return [...list].sort((a, b) => a.stationId.localeCompare(b.stationId));
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getAllStations() {
  if (dbReady()) {
    return Station.find({}, PROJECTION).sort({ stationId: 1 }).lean();
  }
  return sortById(stationsData);
}

export async function getStationById(id) {
  if (!id || typeof id !== 'string') return null;
  const stationId = id.trim().toUpperCase();
  if (dbReady()) {
    return Station.findOne({ stationId }, PROJECTION).lean();
  }
  return stationsData.find(s => s.stationId === stationId) || null;
}

export async function searchStation(query) {
  const q = String(query || '').trim();
  if (!q) return [];
  if (dbReady()) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    return Station.find({ $or: [{ name: rx }, { stationId: rx }, { line: rx }] }, PROJECTION)
      .sort({ stationId: 1 })
      .lean();
  }
  const lq = q.toLowerCase();
  return sortById(stationsData.filter(s =>
    s.name.toLowerCase().includes(lq) ||
    s.stationId.toLowerCase().includes(lq) ||
    s.line.toLowerCase().includes(lq)
  ));
}

/**
 * Resolve a station from an ID ("ST010") or a (partial) name ("majestic").
 * Returns { station } on a unique match, or { candidates } when ambiguous / not found.
 */
export async function resolveStation(input) {
  const q = String(input || '').trim();
  if (!q) return { station: null, candidates: [] };

  const byId = await getStationById(q);
  if (byId) return { station: byId, candidates: [] };

  const all = await getAllStations();
  const exact = all.find(s => s.name.toLowerCase() === q.toLowerCase());
  if (exact) return { station: exact, candidates: [] };

  const partial = all.filter(s => s.name.toLowerCase().includes(q.toLowerCase()));
  if (partial.length === 1) return { station: partial[0], candidates: [] };
  return { station: null, candidates: partial };
}
