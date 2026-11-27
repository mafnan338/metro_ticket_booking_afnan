import * as ticketSvc from '../services/ticketService.js';
import * as stationSvc from '../services/stationService.js';

export async function calculateFare(req, res) {
  try {
    const { sourceStationId, destinationStationId } = req.body;

    if (!sourceStationId || !destinationStationId) {
      return res.status(400).json({ success: false, error: 'Both sourceStationId and destinationStationId are required' });
    }

    const source = await stationSvc.getStationById(sourceStationId);
    if (!source) return res.status(400).json({ success: false, error: 'Invalid source station' });

    const dest = await stationSvc.getStationById(destinationStationId);
    if (!dest) return res.status(400).json({ success: false, error: 'Invalid destination station' });

    if (sourceStationId === destinationStationId) {
      return res.status(400).json({ success: false, error: 'Source and destination cannot be the same' });
    }

    const fare = ticketSvc.calculateFare(source, dest);

    res.json({
      success: true,
      data: {
        sourceStationId,
        sourceStationName: source.name,
        destinationStationId,
        destinationStationName: dest.name,
        fare
      }
    });
  } catch {
    res.status(500).json({ success: false, error: 'Fare calculation failed' });
  }
}

export async function createTicket(req, res) {
  try {
    const { sourceStationId, destinationStationId } = req.body;

    if (!sourceStationId || !destinationStationId) {
      return res.status(400).json({ success: false, error: 'Both source and destination are required' });
    }

    const ticket = await ticketSvc.createTicket(sourceStationId, destinationStationId);
    res.status(201).json({ success: true, data: ticket });
  } catch (err) {
    const msg = err.message || 'Booking failed';
    if (msg.includes('Invalid') || msg.includes('same')) {
      return res.status(400).json({ success: false, error: msg });
    }
    res.status(500).json({ success: false, error: 'Ticket booking failed' });
  }
}

export async function getTicketById(req, res) {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketSvc.getTicket(ticketId);

    if (!ticket) return res.status(404).json({ success: false, error: 'Ticket not found' });

    res.json({ success: true, data: ticket });
  } catch {
    res.status(500).json({ success: false, error: 'Failed to retrieve ticket' });
  }
}

export async function validateEntry(req, res) {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketSvc.validateEntry(ticketId);
    res.json({ success: true, data: ticket, message: 'Entry validated successfully' });
  } catch (err) {
    const msg = err.message || 'Entry validation failed';
    const status = msg.includes('not found') || msg.includes('expired') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
}

export async function validateExit(req, res) {
  try {
    const { ticketId } = req.params;
    const ticket = await ticketSvc.validateExit(ticketId);
    res.json({ success: true, data: ticket, message: 'Exit validated successfully' });
  } catch (err) {
    const msg = err.message || 'Exit validation failed';
    const status = msg.includes('not found') || msg.includes('expired') ? 400 : 500;
    res.status(status).json({ success: false, error: msg });
  }
}
