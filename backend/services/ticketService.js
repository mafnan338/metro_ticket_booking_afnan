import { Ticket } from '../models/index.js';
import mongoose from 'mongoose';
import { getStationById } from './stationService.js';
import crypto from 'crypto';

const inMemoryTickets = new Map();

function dbReady() {
  return mongoose.connection?.readyState === 1;
}

export function calculateFare(sourceStation, destStation) {
  return Math.abs(destStation.price - sourceStation.price);
}

export async function createTicket(sourceId, destId) {
  const source = await getStationById(sourceId);
  if (!source) throw new Error('Invalid source station');

  const dest = await getStationById(destId);
  if (!dest) throw new Error('Invalid destination station');

  if (sourceId === destId) throw new Error('Source and destination cannot be the same');

  const fare = calculateFare(source, dest);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 18 * 60 * 60 * 1000); // 18 hours
  const ticketId = crypto.randomUUID();

  const ticketData = {
    ticketId,
    sourceStation: source.name,
    destinationStation: dest.name,
    sourceStationId: sourceId,
    destinationStationId: destId,
    fare,
    createdAt: now,
    expiresAt,
    entryUsed: false,
    exitUsed: false,
    entryUsedAt: null,
    exitUsedAt: null,
    status: 'active'
  };

  if (dbReady()) {
    const ticket = await Ticket.create(ticketData);
    inMemoryTickets.set(ticketId, ticket.toJSON ? ticket.toObject() : ticket);
    return ticket;
  }

  inMemoryTickets.set(ticketId, ticketData);
  return ticketData;
}

export async function getTicket(ticketId) {
  if (dbReady()) {
    const t = await Ticket.findOne({ ticketId });
    if (t) {
      inMemoryTickets.set(ticketId, t.toObject ? t.toObject() : t);
      return t;
    }
  }
  return inMemoryTickets.get(ticketId) || null;
}

function _updateTicket(ticketId, updates) {
  const existing = inMemoryTickets.get(ticketId);
  if (!existing) throw new Error('Ticket not found');
  Object.assign(existing, updates);
  inMemoryTickets.set(ticketId, existing);

  if (dbReady()) {
    return Ticket.findOneAndUpdate({ ticketId }, updates, { new: true });
  }
  return existing;
}

export async function validateEntry(ticketId) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');

  if (new Date() > ticket.expiresAt) {
    _updateTicket(ticketId, { status: 'expired' });
    throw new Error('Ticket has expired');
  }

  if (ticket.entryUsed) {
    throw new Error('Entry already used for this ticket');
  }

  if (ticket.exitUsed && !ticket.entryUsed) {
    throw new Error('Exit used before entry');
  }

  return _updateTicket(ticketId, {
    entryUsed: true,
    entryUsedAt: new Date(),
    status: 'entry_done'
  });
}

export async function validateExit(ticketId) {
  const ticket = await getTicket(ticketId);
  if (!ticket) throw new Error('Ticket not found');

  if (new Date() > ticket.expiresAt) {
    _updateTicket(ticketId, { status: 'expired' });
    throw new Error('Ticket has expired');
  }

  if (!ticket.entryUsed) {
    throw new Error('Entry not done yet');
  }

  if (ticket.exitUsed) {
    throw new Error('Exit already used for this ticket');
  }

  return _updateTicket(ticketId, {
    exitUsed: true,
    exitUsedAt: new Date(),
    status: 'completed'
  });
}
