import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrainFront, Clock, ShieldCheck, MapPin, Ticket, ScanLine, Sparkles, QrCode, Route, Bot } from 'lucide-react';
import { api } from '../services/api';
import { TicketPreview } from '../components/TicketCard';
import { lineColor } from '../lib/metro';

const STEPS = [
  { icon: MapPin, title: 'Select stations', desc: 'Pick your source and destination from the live station list.' },
  { icon: Route, title: 'See your fare', desc: 'The server calculates your fare instantly. No hidden charges.' },
  { icon: Ticket, title: 'Book in one tap', desc: 'Get a digital ticket with a unique ID and QR code.' },
  { icon: ScanLine, title: 'Scan & travel', desc: 'Scan at the entry gate, then again at your exit.' }
];

export default function HomeView() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    api.getStations()
      .then(r => setStations(r.data))
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  }, []);

  const lines = useMemo(() => {
    const map = new Map();
    stations.forEach(s => map.set(s.line, [...(map.get(s.line) || []), s]));
    return [...map.entries()];
  }, [stations]);

  const stat = (v) => (loading ? '…' : failed ? '—' : v);

  return (
    <>
      <section className="hero">
        <div className="container hero-inner">
          <div>
            <div className="eyebrow"><Sparkles size={14} /> Bengaluru Metro · Digital Ticketing</div>
            <h1>Your journey,<br /><span className="accent">just a tap away.</span></h1>
            <p className="hero-lead">Book metro tickets in seconds, get an instant QR ticket, and let our AI assistant answer fares, routes and ticket questions.</p>
            <div className="hero-actions">
              <Link to="/book" className="btn btn-primary btn-lg"><Ticket size={18} /> Book a ticket</Link>
              <Link to="/stations" className="btn btn-secondary btn-lg"><MapPin size={18} /> Explore stations</Link>
            </div>
            <div className="hero-badges">
              <div className="hero-badge"><ShieldCheck size={18} /> Server-verified tickets</div>
              <div className="hero-badge"><Clock size={18} /> Valid for 18 hours</div>
              <div className="hero-badge"><Bot size={18} /> Claude-powered assistant</div>
            </div>
          </div>
          <div className="hero-visual">
            <div className="hero-ticket"><TicketPreview /></div>
            <div className="hero-float" style={{ bottom: -22, right: -8 }}>
              <span className="dot" style={{ background: '#dcfce7', color: '#16a34a' }}><ShieldCheck size={16} /></span>
              Entry validated
            </div>
            <div className="hero-float" style={{ bottom: 24, left: -28, animationDelay: '1.5s' }}>
              <span className="dot" style={{ background: 'var(--primary-50)', color: 'var(--primary)' }}><QrCode size={16} /></span>
              Instant QR ticket
            </div>
          </div>
        </div>
      </section>

      <section className="container" style={{ marginTop: -36, position: 'relative', zIndex: 2 }}>
        <div className="grid grid-4">
          {[
            { icon: TrainFront, value: stat(stations.length), label: 'Metro stations' },
            { icon: Route, value: stat(lines.length), label: 'Metro lines' },
            { icon: Clock, value: '18 hrs', label: 'Ticket validity' },
            { icon: ShieldCheck, value: '2 scans', label: 'Entry + exit per ticket' }
          ].map(s => (
            <div key={s.label} className="card stat">
              <div className="stat-icon"><s.icon size={22} /></div>
              <div>
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="section-title">How it works</h2>
          <p className="section-sub">From station to seat in four simple steps.</p>
          <div className="grid grid-4">
            {STEPS.map((s, i) => (
              <div key={s.title} className="card card-hover step">
                <div className="row between" style={{ alignItems: 'flex-start' }}>
                  <div className="step-num"><s.icon size={20} /></div>
                  <span style={{ fontSize: 32, fontWeight: 800, color: 'var(--primary-100)' }}>0{i + 1}</span>
                </div>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-soft">
        <div className="container">
          <h2 className="section-title">Metro lines</h2>
          <p className="section-sub">Every line and station is loaded live from the server.</p>
          {failed ? (
            <p className="muted" style={{ textAlign: 'center' }}>Station data is unavailable right now. Please make sure the backend is running.</p>
          ) : (
            <div className="grid grid-3">
              {(loading ? Array.from({ length: 5 }, (_, i) => [i, []]) : lines).map(([line, list]) => (
                loading ? <div key={line} className="skeleton" style={{ height: 130 }} /> : (
                  <div key={line} className="card card-hover line-card">
                    <div className="line-swatch" style={{ background: lineColor(line) }} />
                    <div className="row between">
                      <h3 style={{ fontSize: 17 }}>{line}</h3>
                      <span className="muted" style={{ fontSize: 13 }}>{list.length} stations</span>
                    </div>
                    <p className="muted" style={{ fontSize: 13 }}>{list.map(s => s.name).join(' · ')}</p>
                  </div>
                )
              ))}
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 32 }}>
            <Link to="/stations" className="btn btn-soft">View station directory <ArrowRight size={16} /></Link>
          </div>
        </div>
      </section>
    </>
  );
}
