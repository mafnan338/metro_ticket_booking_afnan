import express from 'express';
import { calculateFare, createTicket, getTicketById, validateEntry, validateExit } from '../controllers/ticketController.js';

const router = express.Router();
router.post('/calculate-fare', calculateFare);
router.post('/', createTicket);
router.get('/:ticketId', getTicketById);
router.post('/:ticketId/entry', validateEntry);
router.post('/:ticketId/exit', validateExit);

export default router;
