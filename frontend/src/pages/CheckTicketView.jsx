import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ScanLine, LogIn, LogOut, RefreshCw, History, Ticket, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';
import TicketCard from '../components/TicketCard';
import { Alert, Spinner, PageHeader } from '../components/ui';
import { getRecentTickets } from '../lib/metro';

export default function CheckTicketView() {
  const [params, setParams] = useSearchParams();
  const [ticketId, setTicketId] = useState(params.get('id') || '');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState('');
  const [msg, setMsg] = useState(null);
  const [recent] = useState(getRecentTickets);

  const lookup = useCallback(async (id) => {
    const value = (id ?? ticketId).trim();
    if (!value) { setMsg({ type: 'error', text: 'Enter a ticket ID to look it up.' }); return; }
    setTicketId(value);
    setLoading(true);
    setMsg(null);
    setTicket(null);
    try {
      const r = await api.getTicket(value);
      setTicket(r.data);
      setParams({ id: value }, { replace: true });
    } catch (e) {
      setMsg({ type: 'error', text: e.status === 404 ? 'No ticket found with that ID. Check for typos and try again.' : e.message });
    } finally {
      setLoading(false);
    }
  }, [ticketId, setParams]);

  useEffect(() => {
    const id = params.get('id');
    if (id) lookup(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scan = async (kind) => {
    setBusy(kind);
    setMsg(null);
    try {
      const r = await (kind === 'entry' ? api.entry : api.exit)(ticket.ticketId);
      setTicket(r.data);
      setMsg({ type: 'success', text: r.message });
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
      api.getTicket(ticket.ticketId).then(r => setTicket(r.data)).catch(() => {});
    } finally {
      setBusy('');
    }
  };

  const refresh = async () => {
    setBusy('refresh');
    try {
      const r = await api.getTicket(ticket.ticketId);
      setTicket(r.data);
    } catch (e) {
      setMsg({ type: 'error', text: e.message });
    } finally {
      setBusy('');
    }
  };

  const finished = ticket && (ticket.status === 'completed' || ticket.status === 'expired');

  return (
    <div className="page">
      <div className="container container-sm">
        <PageHeader eyebrow="Ticket validation" icon={ScanLine} title="Check & validate ticket" subtitle="Look up any ticket by its ID to see live status, then simulate the entry and exit gate scans." />

        <form className="card card-pad" onSubmit={e => { e.preventDefault(); lookup(); }}>
          <label className="label" htmlFor="ticket-id">Ticket ID</label>
          <div className="lookup-bar">
            <div className="input-icon">
              <Ticket size={18} />
              <input id="ticket-id" className="input mono" value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="e.g. 4a9365d9-c527-4587-a688-3eb98860685e" autoComplete="off" spellCheck={false} />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Spinner /> : <Search size={18} />} {loading ? 'Searching…' : 'Look up'}
            </button>
          </div>

          {recent.length > 0 && !ticket && (
            <div style={{ marginTop: 20 }}>
              <div className="row muted" style={{ fontSize: 13, fontWeight: 600, gap: 6 }}><History size={15} /> Recently booked on this device</div>
              <div className="recent-list">
                {recent.map(r => (
                  <button type="button" key={r.ticketId} className="recent-item" onClick={() => lookup(r.ticketId)}>
                    <Ticket size={16} color="var(--primary)" />
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--navy)' }}>{r.route}</div>
                      <code className="mono">{r.ticketId}</code>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </form>

        {msg && <div style={{ marginTop: 20 }}><Alert type={msg.type}>{msg.text}</Alert></div>}

        {loading && (
          <div className="card" style={{ marginTop: 20, padding: 24 }}>
            <div className="skeleton" style={{ height: 56, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 120, marginBottom: 16 }} />
            <div className="skeleton" style={{ height: 44 }} />
          </div>
        )}

        {ticket && (
          <div className="grid" style={{ marginTop: 20, gap: 20 }}>
            <div className="card validator">
              <div className="row between wrap">
                <div className="row">
                  <div className="stat-icon" style={{ width: 40, height: 40 }}><ShieldCheck size={20} /></div>
                  <div>
                    <h3 style={{ fontSize: 16 }}>Gate simulator</h3>
                    <p className="muted" style={{ fontSize: 13 }}>
                      {ticket.status === 'active' && 'Ready for entry scan.'}
                      {ticket.status === 'entry_done' && 'Entry recorded. Scan at exit to complete the journey.'}
                      {ticket.status === 'completed' && 'Journey completed. This ticket cannot be reused.'}
                      {ticket.status === 'expired' && 'This ticket has expired and can no longer be used.'}
                    </p>
                  </div>
                </div>
                <button type="button" className="btn btn-ghost btn-sm" onClick={refresh} disabled={!!busy}>
                  {busy === 'refresh' ? <Spinner size={14} /> : <RefreshCw size={14} />} Refresh
                </button>
              </div>
              <div className="validator-actions">
                <button type="button" className="btn btn-primary" onClick={() => scan('entry')} disabled={!!busy || finished}>
                  {busy === 'entry' ? <Spinner /> : <LogIn size={18} />} Scan entry
                </button>
                <button type="button" className="btn btn-success" onClick={() => scan('exit')} disabled={!!busy || finished}>
                  {busy === 'exit' ? <Spinner /> : <LogOut size={18} />} Scan exit
                </button>
              </div>
            </div>
            <TicketCard ticket={ticket} />
          </div>
        )}

        {!ticket && !loading && !msg && recent.length === 0 && (
          <div className="empty">
            <div className="empty-icon"><Ticket size={26} /></div>
            <p>No ticket loaded yet. <Link to="/book" style={{ color: 'var(--primary)', fontWeight: 600 }}>Book a ticket</Link> or paste an ID above.</p>
          </div>
        )}
      </div>
    </div>
  );
}
