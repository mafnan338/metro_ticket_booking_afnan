import { ChatAnthropic } from '@langchain/anthropic';
import { tool } from '@langchain/core/tools';
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from '@langchain/core/messages';
import { z } from 'zod';
import * as ticketSvc from './ticketService.js';
import * as stationSvc from './stationService.js';

const MAX_TOOL_ROUNDS = 6;
const MAX_HISTORY_MESSAGES = 40;
const SESSION_TTL_MS = 60 * 60 * 1000;
const MAX_SESSIONS = 1000;
const PLACEHOLDER_KEYS = new Set(['', 'your_key', 'your_anthropic_api_key', 'sk-ant-...']);

const CONFIRM_RX = /\b(yes|yeah|yep|yup|confirm(ed)?|proceed|go ahead|book it|ok(ay)?|sure|do it|please book)\b/i;
const REJECT_RX = /\b(no|nope|don'?t|do not|cancel|stop|wait|not now)\b/i;

const SYSTEM_PROMPT = `You are the Metro Assistant for the Bengaluru Metro Ticket Booking System.
You can only learn facts through the tools provided. They read live data from the backend and MongoDB.

STRICT RULES:
- NEVER invent station names, station IDs, fares, ticket IDs, ticket statuses or booking confirmations. Always call a tool and report exactly what it returns.
- Fares come only from calculate_fare or prepare_booking.
- Booking is a two-step process:
  1. Call prepare_booking with the source and destination. Show the user the source, destination and fare, then ask them to reply "yes" to confirm.
  2. Only after the user explicitly confirms in their NEXT message, call confirm_booking. Never call confirm_booking in the same turn as prepare_booking.
- If a tool returns an error, explain it plainly (e.g. ambiguous station, ticket expired, entry already used, exit before entry).
- If a station name is ambiguous, list the candidate stations returned by the tool and ask which one they mean.
- Only run validate_ticket_entry / validate_ticket_exit when the user explicitly asks to scan or validate a ticket.
- Ticket rules: valid 18 hours from booking; entry scan first, then exit scan; each scan once; completed or expired tickets cannot be reused.
- Be concise and friendly. Use short lists when listing stations. Plain text only, light markdown (bold, lists) is fine.`;

const sessions = new Map();

function getSession(sessionId) {
  const now = Date.now();
  for (const [id, s] of sessions) {
    if (now - s.updatedAt > SESSION_TTL_MS) sessions.delete(id);
  }
  let s = sessions.get(sessionId);
  if (!s) {
    if (sessions.size >= MAX_SESSIONS) sessions.delete(sessions.keys().next().value);
    s = { history: [], pendingBooking: null, updatedAt: now };
    sessions.set(sessionId, s);
  }
  s.updatedAt = now;
  return s;
}

function trimHistory(history) {
  let trimmed = history.slice(-MAX_HISTORY_MESSAGES);
  // History must start at a human turn so tool_use / tool_result pairs are never split.
  const firstHuman = trimmed.findIndex(m => m instanceof HumanMessage);
  return firstHuman === -1 ? [] : trimmed.slice(firstHuman);
}

function publicStation(s) {
  return { stationId: s.stationId, name: s.name, line: s.line, price: s.price };
}

async function resolveOrExplain(input, role) {
  const { station, candidates } = await stationSvc.resolveStation(input);
  if (station) return { station };
  if (candidates.length) {
    return { error: `Ambiguous ${role} station "${input}". Candidates: ${JSON.stringify(candidates.map(publicStation))}` };
  }
  return { error: `No ${role} station matches "${input}". Use search_station or get_stations to find valid stations.` };
}

function buildTools(session, ctx) {
  return [
    tool(async () => {
      const stations = await stationSvc.getAllStations();
      return JSON.stringify(stations.map(publicStation));
    }, {
      name: 'get_stations',
      description: 'List all metro stations with stationId, name, line and price.',
      schema: z.object({})
    }),

    tool(async ({ query }) => {
      const results = await stationSvc.searchStation(query);
      if (!results.length) return `No stations found matching "${query}".`;
      return JSON.stringify(results.map(publicStation));
    }, {
      name: 'search_station',
      description: 'Search stations by (partial) name, station ID or line name.',
      schema: z.object({ query: z.string().describe('Search text, e.g. "majestic", "ST010" or "Blue Line"') })
    }),

    tool(async ({ source, destination }) => {
      const s = await resolveOrExplain(source, 'source');
      if (s.error) return `Error: ${s.error}`;
      const d = await resolveOrExplain(destination, 'destination');
      if (d.error) return `Error: ${d.error}`;
      try {
        const q = await ticketSvc.quoteFare(s.station.stationId, d.station.stationId);
        return JSON.stringify({ source: publicStation(q.source), destination: publicStation(q.dest), fare: q.fare, currency: 'INR' });
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }, {
      name: 'calculate_fare',
      description: 'Calculate the fare between two stations. Accepts station IDs or station names.',
      schema: z.object({
        source: z.string().describe('Source station ID or name'),
        destination: z.string().describe('Destination station ID or name')
      })
    }),

    tool(async ({ source, destination }) => {
      const s = await resolveOrExplain(source, 'source');
      if (s.error) return `Error: ${s.error}`;
      const d = await resolveOrExplain(destination, 'destination');
      if (d.error) return `Error: ${d.error}`;
      try {
        const q = await ticketSvc.quoteFare(s.station.stationId, d.station.stationId);
        session.pendingBooking = {
          sourceStationId: q.source.stationId,
          destinationStationId: q.dest.stationId,
          fare: q.fare,
          preparedTurn: ctx.turn
        };
        return JSON.stringify({
          status: 'awaiting_user_confirmation',
          source: publicStation(q.source),
          destination: publicStation(q.dest),
          fare: q.fare,
          currency: 'INR',
          note: 'Ask the user to reply "yes" to confirm. Do not call confirm_booking until they do.'
        });
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }, {
      name: 'prepare_booking',
      description: 'Step 1 of booking: validate stations and get the real fare quote. Does NOT book. Must be followed by user confirmation.',
      schema: z.object({
        source: z.string().describe('Source station ID or name'),
        destination: z.string().describe('Destination station ID or name')
      })
    }),

    tool(async () => {
      const pending = session.pendingBooking;
      if (!pending) return 'Error: No pending booking. Call prepare_booking first and get user confirmation.';
      if (pending.preparedTurn === ctx.turn) {
        return 'Error: The user has not confirmed yet. Show the quote and wait for their reply.';
      }
      if (!ctx.userConfirmed) {
        return 'Error: The user\'s latest message is not an explicit confirmation. Ask them to reply "yes" to book.';
      }
      try {
        const ticket = await ticketSvc.createTicket(pending.sourceStationId, pending.destinationStationId);
        session.pendingBooking = null;
        ctx.bookedTickets.push(ticket);
        return JSON.stringify({ booked: true, ticket });
      } catch (err) {
        return `Error: Booking failed: ${err.message}`;
      }
    }, {
      name: 'confirm_booking',
      description: 'Step 2 of booking: book the ticket quoted by prepare_booking. Only call after the user explicitly confirmed in their latest message.',
      schema: z.object({})
    }),

    tool(async () => {
      session.pendingBooking = null;
      return 'Pending booking cancelled.';
    }, {
      name: 'cancel_pending_booking',
      description: 'Cancel the pending (unconfirmed) booking quote when the user declines.',
      schema: z.object({})
    }),

    tool(async ({ ticketId }) => {
      const ticket = await ticketSvc.getTicket(ticketId);
      if (!ticket) return `Error: Ticket ${ticketId} not found.`;
      ctx.lookedUpTickets.push(ticket);
      return JSON.stringify(ticket);
    }, {
      name: 'get_ticket_status',
      description: 'Get ticket details and current status by ticket ID.',
      schema: z.object({ ticketId: z.string().describe('The exact ticket ID (UUID)') })
    }),

    tool(async ({ ticketId }) => {
      try {
        const ticket = await ticketSvc.validateEntry(ticketId);
        return JSON.stringify({ success: true, message: 'Entry validated', ticket });
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }, {
      name: 'validate_ticket_entry',
      description: 'Perform the entry scan for a ticket. Only when the user explicitly asks.',
      schema: z.object({ ticketId: z.string() })
    }),

    tool(async ({ ticketId }) => {
      try {
        const ticket = await ticketSvc.validateExit(ticketId);
        return JSON.stringify({ success: true, message: 'Exit validated', ticket });
      } catch (err) {
        return `Error: ${err.message}`;
      }
    }, {
      name: 'validate_ticket_exit',
      description: 'Perform the exit scan for a ticket. Only when the user explicitly asks.',
      schema: z.object({ ticketId: z.string() })
    })
  ];
}

function textOf(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.filter(b => b?.type === 'text').map(b => b.text).join('\n').trim();
  }
  return '';
}

export function chatbotConfigured() {
  const key = (process.env.ANTHROPIC_API_KEY || '').trim();
  return !PLACEHOLDER_KEYS.has(key);
}

export class ChatError extends Error {
  constructor(message, status, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function classifyError(err) {
  const status = err?.status ?? err?.response?.status;
  const msg = String(err?.message || '');
  if (status === 401 || /invalid x-api-key|authentication/i.test(msg)) {
    return new ChatError('The AI service rejected the API key. Please check ANTHROPIC_API_KEY in backend/config.env.', 502, 'INVALID_API_KEY');
  }
  if (status === 403) return new ChatError('The API key is not allowed to use this model.', 502, 'FORBIDDEN');
  if (status === 404 || /not_found_error|model:/i.test(msg)) {
    return new ChatError(`The configured model "${process.env.ANTHROPIC_MODEL}" was not found. Check ANTHROPIC_MODEL.`, 502, 'MODEL_NOT_FOUND');
  }
  if (status === 429 || /rate.?limit/i.test(msg)) {
    return new ChatError('The AI service is rate limited right now. Please wait a moment and try again.', 429, 'RATE_LIMITED');
  }
  if (status === 529 || /overloaded/i.test(msg)) {
    return new ChatError('The AI service is overloaded. Please try again shortly.', 503, 'OVERLOADED');
  }
  if (/timed? ?out|timeout|ETIMEDOUT/i.test(msg) || err?.name === 'APIConnectionTimeoutError') {
    return new ChatError('The AI service took too long to respond. Please try again.', 504, 'TIMEOUT');
  }
  if (/ENOTFOUND|ECONNREFUSED|ECONNRESET|Connection error/i.test(msg)) {
    return new ChatError('Could not reach the AI service. Check the server\'s internet connection.', 503, 'CONNECTION_ERROR');
  }
  return new ChatError('The AI assistant hit an unexpected error. Please try again.', 500, 'CHAT_ERROR');
}

function createModel() {
  return new ChatAnthropic({
    model: process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-5',
    apiKey: process.env.ANTHROPIC_API_KEY.trim(),
    temperature: 0,
    maxTokens: 1024,
    maxRetries: 1,
    clientOptions: { timeout: Number(process.env.ANTHROPIC_TIMEOUT_MS) || 30000 }
  });
}

export async function processChat(message, sessionId = 'default') {
  if (!chatbotConfigured()) {
    throw new ChatError('The AI chatbot is not configured. Add a valid ANTHROPIC_API_KEY to backend/config.env and restart the backend.', 503, 'NOT_CONFIGURED');
  }

  const session = getSession(sessionId);
  const ctx = {
    turn: (session.turn = (session.turn || 0) + 1),
    userConfirmed: CONFIRM_RX.test(message) && !REJECT_RX.test(message),
    bookedTickets: [],
    lookedUpTickets: []
  };

  const tools = buildTools(session, ctx);
  const toolsByName = Object.fromEntries(tools.map(t => [t.name, t]));
  const model = createModel().bindTools(tools);

  const turnMessages = [new HumanMessage(message)];
  let reply = '';

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await model.invoke([new SystemMessage(SYSTEM_PROMPT), ...session.history, ...turnMessages]);
      turnMessages.push(response);

      if (!response.tool_calls?.length) {
        reply = textOf(response.content);
        break;
      }

      for (const call of response.tool_calls) {
        const t = toolsByName[call.name];
        let output;
        try {
          output = t ? await t.invoke(call.args ?? {}) : `Error: Unknown tool ${call.name}`;
        } catch (err) {
          output = `Error: ${err.message}`;
        }
        turnMessages.push(new ToolMessage({ content: String(output), tool_call_id: call.id, name: call.name }));
      }
    }
  } catch (err) {
    console.error('Chat error:', err?.status ?? '', err?.message);
    throw classifyError(err);
  }

  if (!reply) {
    reply = ctx.bookedTickets.length
      ? `Your ticket is booked. Ticket ID: ${ctx.bookedTickets[0].ticketId}`
      : 'Sorry, I could not complete that request. Please try rephrasing.';
    turnMessages.push(new AIMessage(reply));
  }

  session.history = trimHistory([...session.history, ...turnMessages]);

  return {
    reply,
    tickets: ctx.bookedTickets,
    lookups: ctx.lookedUpTickets,
    pendingBooking: session.pendingBooking
  };
}

export function resetSession(sessionId) {
  sessions.delete(sessionId);
}
