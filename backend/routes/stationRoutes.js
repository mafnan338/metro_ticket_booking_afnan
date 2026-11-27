import express from 'express';
import { getStations, getStation, searchStations } from '../controllers/stationController.js';

const router = express.Router();
router.get('/', getStations);
router.get('/search', searchStations);
router.get('/:id', getStation);

export default router;
