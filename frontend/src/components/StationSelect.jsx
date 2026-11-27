import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Search, Check } from 'lucide-react';
import { lineColor } from '../lib/metro';

export default function StationSelect({ id, label, icon: Icon, stations, value, onChange, disabledId, disabled, placeholder = 'Select a station' }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [hl, setHl] = useState(0);
  const rootRef = useRef(null);
  const searchRef = useRef(null);
  const listRef = useRef(null);

  const selected = stations.find(s => s.stationId === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter(s =>
      s.name.toLowerCase().includes(q) || s.line.toLowerCase().includes(q) || s.stationId.toLowerCase().includes(q)
    );
  }, [stations, query]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => { if (!rootRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    searchRef.current?.focus();
    const idx = filtered.findIndex(s => s.stationId === value);
    setHl(idx >= 0 ? idx : 0);
    return () => document.removeEventListener('mousedown', onDoc);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => { setHl(0); }, [query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${hl}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [hl]);

  const choose = (s) => {
    if (!s || s.stationId === disabledId) return;
    onChange(s.stationId);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setHl(h => Math.min(h + 1, filtered.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setHl(h => Math.max(h - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); choose(filtered[hl]); }
    else if (e.key === 'Escape') { setOpen(false); }
  };

  let lastLine = null;

  return (
    <div className={`combo ${open ? 'open' : ''}`} ref={rootRef}>
      <label className="label" htmlFor={id}>{label}</label>
      <button
        id={id}
        type="button"
        className="combo-trigger"
        onClick={() => setOpen(o => !o)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="combo-icon">{Icon && <Icon size={18} />}</span>
        <span className="combo-text">
          {selected ? (
            <>
              <div className="combo-value">{selected.name}</div>
              <div className="combo-meta">
                <span className="line-dot" style={{ background: lineColor(selected.line) }} />
                {selected.line} · {selected.stationId}
              </div>
            </>
          ) : (
            <div className="combo-placeholder">{disabled ? 'Loading stations…' : placeholder}</div>
          )}
        </span>
        <ChevronDown size={18} color="#94a3b8" style={{ transition: 'transform .2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div className="combo-pop">
          <div className="combo-search input-icon">
            <Search size={16} style={{ left: 22 }} />
            <input
              ref={searchRef}
              className="input"
              placeholder="Search name, line or ID…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              aria-label={`Search ${label}`}
            />
          </div>
          <ul className="combo-list" role="listbox" ref={listRef}>
            {filtered.length === 0 && <li className="combo-empty">No stations match “{query}”</li>}
            {filtered.map((s, i) => {
              const header = s.line !== lastLine ? (lastLine = s.line) : null;
              const isDisabled = s.stationId === disabledId;
              return (
                <li key={s.stationId}>
                  {header && !query && <div className="combo-group">{header}</div>}
                  <div
                    data-idx={i}
                    role="option"
                    aria-selected={s.stationId === value}
                    aria-disabled={isDisabled}
                    className={`combo-option ${i === hl ? 'hl' : ''} ${s.stationId === value ? 'sel' : ''} ${isDisabled ? 'disabled' : ''}`}
                    onMouseEnter={() => setHl(i)}
                    onClick={() => choose(s)}
                  >
                    <span className="line-dot" style={{ background: lineColor(s.line) }} />
                    <span>{s.name}</span>
                    {s.stationId === value && <Check size={15} />}
                    <span className="price">{s.stationId}</span>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
