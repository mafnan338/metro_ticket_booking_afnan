import { getAllStations, getStationById, searchStation } from '../services/stationService.js';

export async function getStations(req, res) {
  try {
    const stations = await getAllStations();
    res.json({ success: true, data: stations, count: stations.length });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch stations' });
  }
}

export async function getStation(req, res) {
  try {
    const { id } = req.params;
    const station = await getStationById(id);
    if (!station) return res.status(404).json({ success: false, error: 'Station not found' });
    res.json({ success: true, data: station });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to fetch station' });
  }
}

export async function searchStations(req, res) {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ success: false, error: 'Search query required' });
    const results = await searchStation(q);
    res.json({ success: true, data: results, count: results.length });
  } catch {
    res.status(500).json({ success: false, error: 'Search failed' });
  }
}
