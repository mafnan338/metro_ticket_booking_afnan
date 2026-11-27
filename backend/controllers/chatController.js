import { processChat, resetSession, ChatError } from '../services/chatService.js';

const MAX_MESSAGE_LENGTH = 2000;

function sanitizeSessionId(id) {
  return typeof id === 'string' && /^[\w-]{1,64}$/.test(id) ? id : 'default';
}

export async function chat(req, res) {
  const { message, sessionId } = req.body || {};
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ success: false, error: 'Message is required' });
  }
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({ success: false, error: `Message too long (max ${MAX_MESSAGE_LENGTH} characters)` });
  }

  try {
    const result = await processChat(message.trim(), sanitizeSessionId(sessionId));
    res.json({ success: true, ...result });
  } catch (err) {
    if (err instanceof ChatError) {
      return res.status(err.status).json({ success: false, error: err.message, code: err.code });
    }
    console.error('Chat processing failed:', err);
    res.status(500).json({ success: false, error: 'Chat processing failed' });
  }
}

export function reset(req, res) {
  resetSession(sanitizeSessionId(req.body?.sessionId));
  res.json({ success: true });
}
