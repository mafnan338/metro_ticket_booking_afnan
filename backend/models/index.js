import mongoose from 'mongoose';

export const stationSchema = new mongoose.Schema({
  stationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  line: { type: String, required: true },
  price: { type: Number, required: true }
}, { timestamps: true });

// No TTL index on expiresAt: expired tickets must stay queryable so users see "expired" instead of "not found".
export const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  sourceStation: { type: String, required: true },
  destinationStation: { type: String, required: true },
  sourceStationId: { type: String, required: true },
  destinationStationId: { type: String, required: true },
  fare: { type: Number, required: true },
  createdAt: { type: Date, required: true },
  expiresAt: { type: Date, required: true },
  entryUsed: { type: Boolean, default: false },
  exitUsed: { type: Boolean, default: false },
  entryUsedAt: { type: Date, default: null },
  exitUsedAt: { type: Date, default: null },
  status: {
    type: String,
    enum: ['active', 'entry_done', 'completed', 'expired', 'invalid'],
    default: 'active'
  }
}, { timestamps: true });

export const Ticket = mongoose.model('Ticket', ticketSchema);
export const Station = mongoose.model('Station', stationSchema);
