import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, ArrowRight, X } from 'lucide-react';
import { api } from '../services/api';
import { Alert, PageHeader } from '../components/ui';
import { lineColor } from '../lib/metro';

export default function StationsView() {
  const [stations, setStations] = useState([]);
  const [state, setState] = useState('loading');
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [line, setLine] = useState('All');

  const load = useCallback(() => {
    setState('loading');
    api.getStations()
      .then(r => { setStations(r.data); setState('ready'); })
      .catch(e => { setError(e.message); setState('error'); });
  }, []);

  useEffect(load, [load]);

  const lines = useMemo(() => ['All', ...new Set(stations.map(s => s.line))], [stations]);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    return stations.filter(s =>
      (line === 'All' || s.line === line) &&
      (!q || s.name.toLowerCase().includes(q) || s.line.toLowerCase().includes(q) || s.stationId.toLowerCase().includes(q))
    );
  }, [stations, filter, line]);

  return (
    <div className="page">
      <div className="container">
        <PageHeader eyebrow="Station directory" icon={MapPin} title="All metro stations" subtitle="Live station data from the server. Pick any station to start a booking from it." />

        <div className="filters">
          <div className="input-icon">
            <Search size={18} />
            <input className="input" value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by name, line or station ID…" aria-label="Search stations" />
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            {lines.map(l => (
              <button type="button" key={l} className={`chip ${line === l ? 'active' : ''}`} onClick={() => setLine(l)}>
                {l !== 'All' && <span className="line-dot" style={{ background: line === l ? '#fff' : lineColor(l) }} />}
                {l}
              </button>
            ))}
          </div>
        </div>

        {state === 'error' && (
          <Alert type="error" title="Couldn't load stations" action={<button className="btn btn-secondary btn-sm" onClick={load}>Retry</button>}>{error}</Alert>
        )}

        {state === 'loading' && (
          <div className="station-grid">
            {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton" style={{ height: 118 }} />)}
          </div>
        )}

        {state === 'ready' && (
          <>
            {filtered.length === 0 ? (
              <div className="empty card">
                <div className="empty-icon"><Search size={24} /></div>
                <p style={{ marginBottom: 14 }}>No stations match your search.</p>
                <button className="btn btn-secondary btn-sm" onClick={() => { setFilter(''); setLine('All'); }}><X size={14} /> Clear filters</button>
              </div>
            ) : (
              <div className="station-grid">
                {filtered.map(s => (
                  <div key={s.stationId} className="card card-hover station-card" style={{ '--line-color': lineColor(s.line) }}>
                    <div className="row between" style={{ alignItems: 'flex-start' }}>
                      <div>
                        <div className="name">{s.name}</div>
                        <div className="id">{s.stationId}</div>
                      </div>
                      <span className="price-tag">₹{s.price}</span>
                    </div>
                    <div className="row between">
                      <span className="line-pill" style={{ background: `${lineColor(s.line)}14`, color: lineColor(s.line), borderColor: `${lineColor(s.line)}33` }}>
                        <span className="line-dot" style={{ background: lineColor(s.line), width: 8, height: 8 }} />{s.line}
                      </span>
                      <Link to={`/book?from=${s.stationId}`} className="btn btn-ghost btn-sm" style={{ color: 'var(--primary)' }}>
                        Book from <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <p className="muted" style={{ fontSize: 13, textAlign: 'center', marginTop: 24 }}>
              Showing {filtered.length} of {stations.length} stations · Station price is used to compute fares
            </p>
          </>
        )}
      </div>
    </div>
  );
}
