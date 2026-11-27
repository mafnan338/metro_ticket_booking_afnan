import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { TrainFront, Copy, Check, LogIn, LogOut, ArrowRight } from 'lucide-react';
import { StatusBadge } from './ui';
import { formatDateTime } from '../lib/metro';

export default function TicketCard({ ticket, actions }) {
  const [copied, setCopied] = useState(false);

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(ticket.ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard permission denied; the ID is still visible and selectable.
    }
  };

  return (
    <article className="ticket" aria-label="Digital metro ticket">
      <div className="ticket-head">
        <div className="t-brand">
          <TrainFront size={20} />
          <div>
            <div>Bengaluru Metro</div>
            <div className="t-sub">Single Journey Ticket</div>
          </div>
        </div>
        <StatusBadge status={ticket.status} light />
      </div>

      <div className="ticket-body">
        <div className="ticket-route">
          <div>
            <div className="st-label">From</div>
            <div className="st-name">{ticket.sourceStation}</div>
            {ticket.sourceStationId && <div className="st-id">{ticket.sourceStationId}</div>}
          </div>
          <div className="ticket-rail" aria-hidden="true">
            <span /><span /><TrainFront size={18} /><span /><span />
          </div>
          <div className="to">
            <div className="st-label">To</div>
            <div className="st-name">{ticket.destinationStation}</div>
            {ticket.destinationStationId && <div className="st-id">{ticket.destinationStationId}</div>}
          </div>
        </div>
      </div>

      <div className="ticket-tear"><span className="notch-r" /></div>

      <div className="ticket-body" style={{ paddingTop: 10 }}>
        <div className="ticket-qr-row">
          <div className="qr-frame">
            <QRCodeSVG value={ticket.ticketId} size={112} fgColor="#0f172a" level="M" />
          </div>
          <div className="ticket-meta">
            <div>
              <div className="meta-label">Fare</div>
              <div className="meta-value" style={{ color: 'var(--primary)', fontSize: 20, fontWeight: 800 }}>₹{ticket.fare}</div>
            </div>
            <div>
              <div className="meta-label">Status</div>
              <div style={{ marginTop: 4 }}><StatusBadge status={ticket.status} /></div>
            </div>
            <div>
              <div className="meta-label">Booked</div>
              <div className="meta-value">{formatDateTime(ticket.createdAt)}</div>
            </div>
            <div>
              <div className="meta-label">Valid until</div>
              <div className="meta-value">{formatDateTime(ticket.expiresAt)}</div>
            </div>
          </div>
        </div>

        <div className="ticket-id">
          <div style={{ minWidth: 0 }}>
            <div className="meta-label">Ticket ID</div>
            <code className="mono">{ticket.ticketId}</code>
          </div>
          <button type="button" className="btn btn-secondary btn-sm" onClick={copyId} aria-label="Copy ticket ID">
            {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied' : 'Copy'}
          </button>
        </div>

        <div className="scan-steps">
          <div className={`scan-step ${ticket.entryUsed ? 'done' : ''}`}>
            <div className="ic"><LogIn size={16} /></div>
            <div>
              <div className="t">Entry scan</div>
              <div className="s">{ticket.entryUsed ? formatDateTime(ticket.entryUsedAt) : 'Not scanned yet'}</div>
            </div>
          </div>
          <div className={`scan-step ${ticket.exitUsed ? 'done' : ''}`}>
            <div className="ic"><LogOut size={16} /></div>
            <div>
              <div className="t">Exit scan</div>
              <div className="s">{ticket.exitUsed ? formatDateTime(ticket.exitUsedAt) : 'Not scanned yet'}</div>
            </div>
          </div>
        </div>
      </div>

      {actions && <div className="ticket-foot">{actions}</div>}
    </article>
  );
}

export function TicketPreview() {
  return (
    <article className="ticket" aria-hidden="true">
      <div className="ticket-head">
        <div className="t-brand"><TrainFront size={20} /><div><div>Bengaluru Metro</div><div className="t-sub">Single Journey Ticket</div></div></div>
        <span className="badge badge-light">Digital</span>
      </div>
      <div className="ticket-body">
        <div className="ticket-route">
          <div><div className="st-label">From</div><div className="st-name">Your station</div></div>
          <div className="ticket-rail"><span /><span /><ArrowRight size={18} /><span /><span /></div>
          <div className="to"><div className="st-label">To</div><div className="st-name">Destination</div></div>
        </div>
      </div>
      <div className="ticket-tear"><span className="notch-r" /></div>
      <div className="ticket-body" style={{ paddingTop: 10 }}>
        <div className="ticket-qr-row">
          <div className="qr-frame"><QRCodeSVG value="bengaluru-metro" size={96} fgColor="#1e40af" /></div>
          <div className="ticket-meta">
            <div><div className="meta-label">Validity</div><div className="meta-value">18 hours</div></div>
            <div><div className="meta-label">Scans</div><div className="meta-value">Entry + Exit</div></div>
            <div><div className="meta-label">Fare</div><div className="meta-value">Live from server</div></div>
            <div><div className="meta-label">Ticket ID</div><div className="meta-value">Unique UUID</div></div>
          </div>
        </div>
      </div>
      <div style={{ height: 18 }} />
    </article>
  );
}
