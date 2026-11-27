import mongoose from 'mongoose';

export const stationSchema = new mongoose.Schema({
  stationId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  line: { type: String, required: true },
  price: { type: Number, required: true }
}, { timestamps: true });

export const ticketSchema = new mongoose.Schema({
  ticketId: { type: String, required: true, unique: true },
  sourceStation: { type: String, required: true },
  destinationStation: { type: String, required: true },
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

ticketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
export const Station = mongoose.model('Station', stationSchema);
