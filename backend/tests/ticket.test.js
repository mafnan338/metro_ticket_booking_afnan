import mongoose from 'mongoose';
import * as ticketSvc from '../services/ticketService.js';
import * as stationSvc from '../services/stationService.js';

const MONGO_URI = process.env.DATABASE || 'mongodb://localhost:27017/metro_test';

beforeAll(async () => {
  await mongoose.connect(MONGO_URI);
  await stationSvc.seedStations();
}, 15000);

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
});

describe('Station Service', () => {
  test('Returns exactly 20 stations', async () => {
    const stations = await stationSvc.getAllStations();
    expect(stations.length).toBe(20);
  });

  test('All stations have unique IDs', async () => {
    const stations = await stationSvc.getAllStations();
    const ids = stations.map(s => s.stationId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test('Search station works', async () => {
    const results = await stationSvc.searchStation('majestic');
    expect(results.length).toBeGreaterThan(0);
    const found = results.find(s => s.name.toLowerCase().includes('majestic'));
    expect(found).toBeDefined();
  });
});

describe('Fare Calculation', () => {
  test('Fare is absolute difference of prices', async () => {
    const s1 = await stationSvc.getStationById('ST001');
    const s5 = await stationSvc.getStationById('ST005');
    expect(ticketSvc.calculateFare(s1, s5)).toBe(Math.abs(s5.price - s1.price));
  });

  test('Same station returns 0', async () => {
    const s = await stationSvc.getStationById('ST001');
    expect(ticketSvc.calculateFare(s, s)).toBe(0);
  });
});

describe('Ticket Lifecycle', () => {
  let ticket;

  test('Create ticket successfully', async () => {
    ticket = await ticketSvc.createTicket('ST001', 'ST010');
    expect(ticket).toBeDefined();
    expect(ticket.ticketId).toBeDefined();
    expect(ticket.fare).toBeGreaterThan(0);
  });

  test('Ticket ID is unique', async () => {
    const ticket2 = await ticketSvc.createTicket('ST002', 'ST003');
    expect(ticket2.ticketId).not.toBe(ticket.ticketId);
  });

  test('Expiry is 18 hours after creation', async () => {
    const diff = ticket.expiresAt.getTime() - ticket.createdAt.getTime();
    const expected = 18 * 60 * 60 * 1000;
    expect(Math.abs(diff - expected)).toBeLessThan(1000);
  });

  test('Ticket lookup works', async () => {
    const found = await ticketSvc.getTicket(ticket.ticketId);
    expect(found).toBeDefined();
    expect(found.ticketId).toBe(ticket.ticketId);
  });

  test('First entry scan succeeds', async () => {
    const result = await ticketSvc.validateEntry(ticket.ticketId);
    expect(result.entryUsed).toBe(true);
    expect(result.status).toBe('entry_done');
  });

  test('Second entry scan fails', async () => {
    await expect(ticketSvc.validateEntry(ticket.ticketId)).rejects.toThrow('Entry already used');
  });

  test('Exit before entry fails (on fresh ticket)', async () => {
    const fresh = await ticketSvc.createTicket('ST003', 'ST004');
    await expect(ticketSvc.validateExit(fresh.ticketId)).rejects.toThrow('Entry not done');
  });

  test('Exit after entry succeeds', async () => {
    const result = await ticketSvc.validateExit(ticket.ticketId);
    expect(result.exitUsed).toBe(true);
    expect(result.status).toBe('completed');
  });

  test('Second exit scan fails', async () => {
    await expect(ticketSvc.validateExit(ticket.ticketId)).rejects.toThrow('Exit already used');
  });

  test('Completed ticket cannot be reused', async () => {
    await expect(ticketSvc.validateEntry(ticket.ticketId)).rejects.toThrow();
  });

  test('Invalid ticket ID handled', async () => {
    const found = await ticketSvc.getTicket('nonexistent-id');
    expect(found).toBeNull();
  });
});
