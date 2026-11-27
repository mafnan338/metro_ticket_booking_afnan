import http from 'http';
import mongoose from 'mongoose';
import * as stationSvc from '../services/stationService.js';
import * as ticketSvc from '../services/ticketService.js';

// A local stand-in for the Anthropic Messages API, so the real LangChain + SDK wire path is exercised without a key.
let server;
const requests = [];

function message(content, stop_reason) {
  return {
    id: `msg_${requests.length}`, type: 'message', role: 'assistant', model: 'mock',
    content, stop_reason, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 }
  };
}

function toolUse(name, input) {
  return { type: 'tool_use', id: `toolu_${requests.length}_${name}`, name, input };
}

function handle(body) {
  const last = body.messages[body.messages.length - 1];
  const blocks = Array.isArray(last.content) ? last.content : [{ type: 'text', text: last.content }];
  const results = blocks.filter(b => b.type === 'tool_result');
  if (results.length) {
    const text = results.map(r => (Array.isArray(r.content) ? r.content.map(c => c.text).join('') : r.content)).join('\n');
    return [200, message([{ type: 'text', text: `TOOL_RESULTS:\n${text}` }], 'end_turn')];
  }
  const userText = blocks.filter(b => b.type === 'text').map(b => b.text).join(' ');
  if (userText.includes('trigger401')) return [401, { type: 'error', error: { type: 'authentication_error', message: 'invalid x-api-key' } }];
  if (userText.includes('trigger429')) return [429, { type: 'error', error: { type: 'rate_limit_error', message: 'rate limited' } }];
  if (/book/i.test(userText)) {
    // Misbehaving model: tries to book in the same turn as the quote.
    return [200, message([
      toolUse('prepare_booking', { source: 'Whitefield', destination: 'majestic' }),
      toolUse('confirm_booking', {})
    ], 'tool_use')];
  }
  if (/^yes/i.test(userText)) return [200, message([toolUse('confirm_booking', {})], 'tool_use')];
  if (/fare/i.test(userText)) return [200, message([toolUse('calculate_fare', { source: 'ST001', destination: 'ST010' })], 'tool_use')];
  return [200, message([{ type: 'text', text: 'Hello from mock' }], 'end_turn')];
}

let processChat;

beforeAll(async () => {
  server = http.createServer((req, res) => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      const body = JSON.parse(raw);
      requests.push(body);
      const [status, payload] = handle(body);
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(payload));
    });
  });
  await new Promise(r => server.listen(0, r));
  process.env.ANTHROPIC_BASE_URL = `http://127.0.0.1:${server.address().port}`;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-test';
  process.env.ANTHROPIC_MODEL = 'claude-haiku-5-5';
  ({ processChat } = await import('../services/chatService.js'));

  await mongoose.connect('mongodb://127.0.0.1:27017/metro_test_chat');
  await stationSvc.seedStations();
}, 15000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await new Promise(r => server.close(r));
});

describe('Chatbot (LangChain + Anthropic wire protocol)', () => {
  test('sends tools to Claude and returns tool-backed fares from the real service', async () => {
    const r = await processChat('What is the fare from Whitefield to Majestic?', 'fare-session');
    expect(requests.at(-2).tools.map(t => t.name)).toEqual(expect.arrayContaining(['calculate_fare', 'prepare_booking', 'confirm_booking']));
    expect(requests.at(-2).model).toBe('claude-sonnet-4-5');
    expect(r.reply).toContain('"fare":3');
  });

  test('refuses to book in the same turn as the quote, then books after explicit confirmation', async () => {
    const first = await processChat('Please book a ticket from Whitefield to Majestic', 'book-session');
    expect(first.tickets).toHaveLength(0);
    expect(first.pendingBooking).toMatchObject({ sourceStationId: 'ST001', destinationStationId: 'ST010', fare: 3 });
    expect(first.reply).toContain('has not confirmed');

    const second = await processChat('yes', 'book-session');
    expect(second.tickets).toHaveLength(1);
    const stored = await ticketSvc.getTicket(second.tickets[0].ticketId);
    expect(stored).toMatchObject({ sourceStation: 'Whitefield', destinationStation: 'Majestic', fare: 3, status: 'active' });
    expect(second.pendingBooking).toBeNull();
  });

  test('confirmation without a pending quote does not book', async () => {
    const r = await processChat('yes', 'empty-session');
    expect(r.tickets).toHaveLength(0);
    expect(r.reply).toContain('No pending booking');
  });

  test('maps invalid API key to a clear error', async () => {
    await expect(processChat('trigger401', 's401')).rejects.toMatchObject({ code: 'INVALID_API_KEY', status: 502 });
  });

  test('maps rate limits to a clear error', async () => {
    await expect(processChat('trigger429', 's429')).rejects.toMatchObject({ code: 'RATE_LIMITED', status: 429 });
  }, 20000);
});
