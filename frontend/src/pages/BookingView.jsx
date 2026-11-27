import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeftRight, ArrowRight, CircleDot, MapPin, Ticket, ShieldCheck, Clock, ScanLine, RotateCcw, Search, IndianRupee } from 'lucide-react';
import { api } from '../services/api';
import StationSelect from '../components/StationSelect';
import TicketCard, { TicketPreview } from '../components/TicketCard';
import { Alert, Spinner, PageHeader } from '../components/ui';
import { lineColor, rememberTicket } from '../lib/metro';

export default function BookingView() {
  const [params] = useSearchParams();
  const [stations, setStations] = useState([]);
  const [stationsState, setStationsState] = useState('loading');
  const [source, setSource] = useState(params.get('from') || '');
  const [dest, setDest] = useState(params.get('to') || '');
  const [fare, setFare] = useState(null);
  const [fareLoading, setFareLoading] = useState(false);
  const [booking, setBooking] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState('');

  const loadStations = useCallback(() => {
    setStationsState('loading');
    api.getStations()
      .then(r => { setStations(r.data); setStationsState('ready'); })
      .catch(e => { setError(e.message); setStationsState('error'); });
  }, []);

  useEffect(loadStations, [loadStations]);

  useEffect(() => {
    setFare(null);
    setError('');
    if (!source || !dest) return;
    if (source === dest) { setError('Source and destination must be different stations.'); return; }
    let cancelled = false;
    setFareLoading(true);
    api.calculateFare({ sourceStationId: source, destinationStationId: dest })
      .then(r => { if (!cancelled) setFare(r.data); })
      .catch(e => { if (!cancelled) setError(e.message); })
      .finally(() => { if (!cancelled) setFareLoading(false); });
    return () => { cancelled = true; };
  }, [source, dest]);

  const swap = () => { setSource(dest); setDest(source); };

  const book = async () => {
    if (!fare) return;
    setBooking(true);
    setError('');
    try {
      const r = await api.bookTicket({ sourceStationId: source, destinationStationId: dest });
      setTicket(r.data);
      rememberTicket(r.data);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBooking(false);
    }
  };

  const reset = () => { setTicket(null); setSource(''); setDest(''); setFare(null); setError(''); };

  if (ticket) {
    return (
      <div className="page">
        <div className="container container-sm">
          <PageHeader eyebrow="Booking confirmed" icon={ShieldCheck} title="Your ticket is ready" subtitle="Show the QR code or ticket ID at the entry gate. This ticket is stored on the server and valid for 18 hours." />
          <div style={{ marginBottom: 20 }}>
            <Alert type="success" title="Ticket booked successfully">Ticket ID {ticket.ticketId.slice(0, 8)}… was issued by the server.</Alert>
          </div>
          <TicketCard
            ticket={ticket}
            actions={
              <>
                <Link to={`/check?id=${ticket.ticketId}`} className="btn btn-primary" style={{ flex: 1 }}><ScanLine size={18} /> Validate / Check status</Link>
                <button type="button" className="btn btn-secondary" onClick={reset} style={{ flex: 1 }}><RotateCcw size={18} /> Book another</button>
              </>
            }
          />
        </div>
      </div>
    );
  }

  const srcStation = stations.find(s => s.stationId === source);
  const dstStation = stations.find(s => s.stationId === dest);

  return (
    <div className="page">
      <div className="container">
        <PageHeader eyebrow="Book a ticket" icon={Ticket} title="Plan your journey" subtitle="Choose your stations. Fares are calculated live by the server before you book." />

        <div className="booking-grid">
          <section className="card card-pad">
            {stationsState === 'error' ? (
              <Alert type="error" title="Couldn't load stations" action={<button className="btn btn-secondary btn-sm" onClick={loadStations}>Retry</button>}>{error}</Alert>
            ) : (
              <>
                <div className="route-fields">
                  <StationSelect id="source" label="From" icon={CircleDot} stations={stations} value={source} onChange={setSource} disabledId={dest} disabled={stationsState !== 'ready'} placeholder="Select source station" />
                  <button type="button" className="swap-btn" onClick={swap} disabled={!source && !dest} title="Swap stations" aria-label="Swap stations">
                    <ArrowLeftRight size={18} />
                  </button>
                  <StationSelect id="destination" label="To" icon={MapPin} stations={stations} value={dest} onChange={setDest} disabledId={source} disabled={stationsState !== 'ready'} placeholder="Select destination" />
                </div>

                {error && stationsState === 'ready' && <div style={{ marginTop: 18 }}><Alert type="error">{error}</Alert></div>}

                {fareLoading && (
                  <div className="fare-box row" style={{ color: 'var(--primary)' }}><Spinner /> Calculating fare…</div>
                )}

                {fare && !fareLoading && (
                  <div className="fare-box">
                    <div className="fare-route">
                      <div className="fare-station">
                        <div className="name">{fare.sourceStationName}</div>
                        <div className="sub row" style={{ gap: 6 }}><span className="line-dot" style={{ background: lineColor(srcStation?.line) }} />{fare.sourceLine || srcStation?.line}</div>
                      </div>
                      <ArrowRight size={20} className="fare-arrow" />
                      <div className="fare-station" style={{ textAlign: 'right' }}>
                        <div className="name">{fare.destinationStationName}</div>
                        <div className="sub row" style={{ gap: 6, justifyContent: 'flex-end' }}><span className="line-dot" style={{ background: lineColor(dstStation?.line) }} />{fare.destinationLine || dstStation?.line}</div>
                      </div>
                    </div>
                    <div className="fare-total">
                      <div>
                        <div className="muted" style={{ fontSize: 13, fontWeight: 600 }}>Total fare</div>
                        <div className="muted" style={{ fontSize: 12 }}>Single journey · valid 18 hours</div>
                      </div>
                      <div className="fare-amount">₹{fare.fare}</div>
                    </div>
                  </div>
                )}

                <div style={{ marginTop: 22 }}>
                  <button type="button" className="btn btn-primary btn-lg btn-block" onClick={book} disabled={!fare || booking || fareLoading}>
                    {booking ? <><Spinner /> Booking your ticket…</> : fare ? <><Ticket size={18} /> Confirm & book · ₹{fare.fare}</> : <><Ticket size={18} /> Select stations to continue</>}
                  </button>
                </div>
              </>
            )}
          </section>

          <aside className="grid" style={{ gap: 20 }}>
            <TicketPreview />
            <div className="card side-card">
              <h3 style={{ fontSize: 16, marginBottom: 14 }}>Good to know</h3>
              <ul className="info-list">
                <li><IndianRupee size={18} /> Fare is the price difference between the two stations.</li>
                <li><Clock size={18} /> Tickets are valid for 18 hours from booking.</li>
                <li><ScanLine size={18} /> Scan once at entry and once at exit, in that order.</li>
                <li><Search size={18} /> Track your ticket any time on the <Link to="/check" style={{ color: 'var(--primary)', fontWeight: 600 }}>Check Ticket</Link> page.</li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
