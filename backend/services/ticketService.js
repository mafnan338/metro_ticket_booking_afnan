import { Ticket } from '../models/index.js';
import { getStationById, dbReady } from './stationService.js';
import crypto from 'crypto';

const TICKET_VALIDITY_MS = 18 * 60 * 60 * 1000;
const inMemoryTickets = new Map();

export class TicketError extends Error {
  constructor(message, status = 400, code = 'TICKET_ERROR') {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function clean(doc) {
  if (!doc) return null;
  const { _id, __v, updatedAt, ...rest } = doc;
  return rest;
}

export function calculateFare(sourceStation, destStation) {
  return Math.abs(destStation.price - sourceStation.price);
}

export async function quoteFare(sourceId, destId) {
  if (!sourceId || !destId) throw new TicketError('Both source and destination are required', 400, 'MISSING_STATIONS');
  const source = await getStationById(sourceId);
  if (!source) throw new TicketError('Invalid source station', 400, 'INVALID_SOURCE');
  const dest = await getStationById(destId);
  if (!dest) throw new TicketError('Invalid destination station', 400, 'INVALID_DESTINATION');
  if (source.stationId === dest.stationId) throw new TicketError('Source and destination cannot be the same', 400, 'SAME_STATION');
  return { source, dest, fare: calculateFare(source, dest) };
}

export async function createTicket(sourceId, destId) {
  const { source, dest, fare } = await quoteFare(sourceId, destId);
  const now = new Date();

  const ticketData = {
    ticketId: crypto.randomUUID(),
    sourceStation: source.name,
    destinationStation: dest.name,
    sourceStationId: source.stationId,
    destinationStationId: dest.stationId,
    fare,
    createdAt: now,
    expiresAt: new Date(now.getTime() + TICKET_VALIDITY_MS),
    entryUsed: false,
    exitUsed: false,
    entryUsedAt: null,
    exitUsedAt: null,
    status: 'active'
  };

  if (dbReady()) {
    const ticket = await Ticket.create(ticketData);
    return clean(ticket.toObject());
  }

  inMemoryTickets.set(ticketData.ticketId, { ...ticketData });
  return { ...ticketData };
}

async function findRaw(ticketId) {
  if (dbReady()) return Ticket.findOne({ ticketId }).lean();
  return inMemoryTickets.get(ticketId) || null;
}

async function applyUpdate(ticketId, filter, updates) {
  if (dbReady()) {
    return Ticket.findOneAndUpdate({ ticketId, ...filter }, { $set: updates }, { new: true }).lean();
  }
  const t = inMemoryTickets.get(ticketId);
  if (!t) return null;
  const matches = Object.entries(filter).every(([k, v]) => t[k] === v);
  if (!matches) return null;
  Object.assign(t, updates);
  return { ...t };
}

function isExpired(ticket) {
  return new Date() > new Date(ticket.expiresAt);
}

async function markExpiredIfNeeded(ticket) {
  if (ticket && isExpired(ticket) && ticket.status !== 'completed' && ticket.status !== 'expired') {
    return (await applyUpdate(ticket.ticketId, {}, { status: 'expired' })) || { ...ticket, status: 'expired' };
  }
  return ticket;
}

export async function getTicket(ticketId) {
  if (!ticketId || typeof ticketId !== 'string') return null;
  const ticket = await findRaw(ticketId.trim());
  return clean(await markExpiredIfNeeded(ticket));
}

export async function validateEntry(rawId) {
  const ticketId = String(rawId || '').trim();
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new TicketError('Ticket not found', 404, 'NOT_FOUND');
  if (ticket.status === 'completed') throw new TicketError('Ticket already used for a complete journey and cannot be reused', 409, 'ALREADY_COMPLETED');
  if (ticket.status === 'expired') throw new TicketError('Ticket has expired', 410, 'EXPIRED');
  if (ticket.entryUsed) throw new TicketError('Entry already used for this ticket', 409, 'ENTRY_ALREADY_USED');

  // Conditional update so two simultaneous scans cannot both succeed.
  const updated = await applyUpdate(ticketId, { entryUsed: false }, {
    entryUsed: true,
    entryUsedAt: new Date(),
    status: 'entry_done'
  });
  if (!updated) throw new TicketError('Entry already used for this ticket', 409, 'ENTRY_ALREADY_USED');
  return clean(updated);
}

export async function validateExit(rawId) {
  const ticketId = String(rawId || '').trim();
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new TicketError('Ticket not found', 404, 'NOT_FOUND');
  if (ticket.exitUsed) throw new TicketError('Exit already used for this ticket', 409, 'EXIT_ALREADY_USED');
  if (ticket.status === 'expired') throw new TicketError('Ticket has expired', 410, 'EXPIRED');
  if (!ticket.entryUsed) throw new TicketError('Entry not done yet. Scan entry before exit', 409, 'ENTRY_REQUIRED');

  const updated = await applyUpdate(ticketId, { entryUsed: true, exitUsed: false }, {
    exitUsed: true,
    exitUsedAt: new Date(),
    status: 'completed'
  });
  if (!updated) throw new TicketError('Exit already used for this ticket', 409, 'EXIT_ALREADY_USED');
  return clean(updated);
}
