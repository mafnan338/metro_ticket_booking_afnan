import express from 'express';
import { chat, reset } from '../controllers/chatController.js';
import { chatLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();
router.post('/', chatLimiter, chat);
router.post('/reset', reset);

export default router;
