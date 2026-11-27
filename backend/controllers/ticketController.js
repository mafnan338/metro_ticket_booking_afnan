import * as ticketSvc from '../services/ticketService.js';

function sendError(res, err, fallback) {
  if (err instanceof ticketSvc.TicketError) {
    return res.status(err.status).json({ success: false, error: err.message, code: err.code });
  }
  console.error(`${fallback}:`, err.message);
  return res.status(500).json({ success: false, error: fallback });
}

export async function calculateFare(req, res) {
  try {
    const { sourceStationId, destinationStationId } = req.body || {};
    const { source, dest, fare } = await ticketSvc.quoteFare(sourceStationId, destinationStationId);
    res.json({
      success: true,
      data: {
        sourceStationId: source.stationId,
        sourceStationName: source.name,
        sourceLine: source.line,
        destinationStationId: dest.stationId,
        destinationStationName: dest.name,
        destinationLine: dest.line,
        fare
      }
    });
  } catch (err) {
    sendError(res, err, 'Fare calculation failed');
  }
}

export async function createTicket(req, res) {
  try {
    const { sourceStationId, destinationStationId } = req.body || {};
    const ticket = await ticketSvc.createTicket(sourceStationId, destinationStationId);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    sendError(res, err, 'Ticket booking failed');
  }
}

export async function getTicketById(req, res) {
  try {
    const ticket = await ticketSvc.getTicket(req.params.ticketId);
    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found', code: 'NOT_FOUND' });
    res.json({ success: true, data: ticket });
  } catch (err) {
    sendError(res, err, 'Failed to retrieve ticket');
  }
}

export async function validateEntry(req, res) {
  try {
    const ticket = await ticketSvc.validateEntry(req.params.ticketId);
    res.json({ success: true, data: ticket, message: 'Entry validated successfully' });
  } catch (err) {
    sendError(res, err, 'Entry validation failed');
  }
}

export async function validateExit(req, res) {
  try {
    const ticket = await ticketSvc.validateExit(req.params.ticketId);
    res.json({ success: true, data: ticket, message: 'Exit validated successfully' });
  } catch (err) {
    sendError(res, err, 'Exit validation failed');
  }
}
