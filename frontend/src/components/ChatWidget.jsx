import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, RotateCcw, TrainFront, RefreshCw, Check } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { api } from '../services/api';
import { StatusBadge } from './ui';
import { rememberTicket } from '../lib/metro';

const SUGGESTIONS = [
  'Show me all metro stations',
  'What is the fare from Whitefield to Majestic?',
  'Book a ticket from Jalahalli to Richmond Avenue',
  'Explain the entry and exit rules',
  'Check my ticket status'
];

const WELCOME = {
  role: 'bot',
  text: "Hi! I'm your **Bengaluru Metro Assistant**. I can look up stations, calculate fares, book tickets (with your confirmation) and check ticket status, all using live data from the server.",
  time: Date.now()
};

function getSessionId() {
  try {
    let id = sessionStorage.getItem('metro_chat_session');
    if (!id) {
      id = `s_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}`.replace(/[^\w-]/g, '').slice(0, 60);
      sessionStorage.setItem('metro_chat_session', id);
    }
    return id;
  } catch {
    return `s_${Math.random().toString(36).slice(2, 12)}`;
  }
}

function renderInline(text, keyBase) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((p, i) => {
    if (p.startsWith('**') && p.endsWith('**')) return <strong key={`${keyBase}-${i}`}>{p.slice(2, -2)}</strong>;
    if (p.startsWith('`') && p.endsWith('`')) return <code key={`${keyBase}-${i}`}>{p.slice(1, -1)}</code>;
    return <Fragment key={`${keyBase}-${i}`}>{p}</Fragment>;
  });
}

function RichText({ text }) {
  const blocks = [];
  let list = null;
  text.split('\n').forEach((raw, i) => {
    const line = raw.trimEnd();
    const bullet = line.match(/^\s*[-*•]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (bullet || numbered) {
      const type = bullet ? 'ul' : 'ol';
      if (!list || list.type !== type) { list = { type, items: [] }; blocks.push(list); }
      list.items.push((bullet || numbered)[1]);
      return;
    }
    list = null;
    if (!line.trim()) return;
    const heading = line.match(/^#{1,6}\s+(.*)$/);
    blocks.push({ type: 'p', text: heading ? `**${heading[1]}**` : line, key: i });
  });
  return blocks.map((b, i) => {
    if (b.type === 'p') return <p key={i}>{renderInline(b.text, i)}</p>;
    const Tag = b.type;
    return <Tag key={i}>{b.items.map((it, j) => <li key={j}>{renderInline(it, `${i}-${j}`)}</li>)}</Tag>;
  });
}

function ChatTicket({ ticket }) {
  return (
    <div className="chat-ticket">
      <div className="chat-ticket-head">
        <span className="row" style={{ gap: 6 }}><TrainFront size={14} /> Ticket booked</span>
        <StatusBadge status={ticket.status} light />
      </div>
      <div className="chat-ticket-body">
        <div className="qr-frame" style={{ padding: 6, borderRadius: 10 }}><QRCodeSVG value={ticket.ticketId} size={64} fgColor="#0f172a" /></div>
        <div style={{ minWidth: 0 }}>
          <div className="r">{ticket.sourceStation} → {ticket.destinationStation}</div>
          <div style={{ color: 'var(--primary)', fontWeight: 800 }}>₹{ticket.fare}</div>
          <code className="mono">{ticket.ticketId}</code>
          <div style={{ marginTop: 6 }}>
            <Link to={`/check?id=${ticket.ticketId}`} style={{ color: 'var(--primary)', fontWeight: 600, fontSize: 12 }}>Open ticket →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

const formatTime = (t) => new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(null);
  const [status, setStatus] = useState({ state: 'unknown' });
  const sessionId = useRef(getSessionId());
  const bodyRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();
    api.health()
      .then(h => setStatus({ state: h.chatbot === 'configured' ? 'online' : 'unconfigured' }))
      .catch(() => setStatus({ state: 'offline' }));
  }, [open]);

  useEffect(() => {
    const el = bodyRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, loading, open]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
  }, [input]);

  const send = useCallback(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setMessages(p => [...p, { role: 'user', text: msg, time: Date.now() }]);
    setLoading(true);
    try {
      const r = await api.chat(msg, sessionId.current);
      setPending(r.pendingBooking || null);
      (r.tickets || []).forEach(rememberTicket);
      setMessages(p => [...p, { role: 'bot', text: r.reply, tickets: r.tickets || [], time: Date.now() }]);
      setStatus({ state: 'online' });
    } catch (e) {
      if (e.code === 'NOT_CONFIGURED') setStatus({ state: 'unconfigured' });
      if (e.code === 'NETWORK') setStatus({ state: 'offline' });
      setMessages(p => [...p, { role: 'bot', error: true, text: e.message, retry: msg, time: Date.now() }]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }, [input, loading]);

  const reset = async () => {
    try { await api.resetChat(sessionId.current); } catch { /* server unreachable; local reset still applies */ }
    setMessages([{ ...WELCOME, time: Date.now() }]);
    setPending(null);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  if (!open) {
    return (
      <button className="chat-fab" onClick={() => setOpen(true)} aria-label="Open Metro Assistant chat">
        <MessageCircle size={24} />
        <span className="pulse" />
        <span className="label">Ask Metro AI</span>
      </button>
    );
  }

  const statusText = {
    online: 'Online · Powered by Claude',
    unconfigured: 'AI not configured on server',
    offline: 'Server unreachable',
    unknown: 'Connecting…'
  }[status.state];

  const showSuggestions = !loading && messages.length <= 1;

  return (
    <div className="chat-panel" role="dialog" aria-label="Metro Assistant chat">
      <div className="chat-head">
        <div className="chat-avatar"><Bot size={22} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="chat-title">Metro Assistant</div>
          <div className="chat-status"><span className={`dot ${status.state === 'online' || status.state === 'unknown' ? '' : 'off'}`} />{statusText}</div>
        </div>
        <button className="chat-head-btn" onClick={reset} title="New conversation" aria-label="New conversation"><RotateCcw size={16} /></button>
        <button className="chat-head-btn" onClick={() => setOpen(false)} title="Close" aria-label="Close chat"><X size={18} /></button>
      </div>

      <div className="chat-body" ref={bodyRef} aria-live="polite">
        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role} ${m.error ? 'error' : ''}`}>
            <div className="msg-avatar">{m.role === 'user' ? <User size={15} /> : <Bot size={15} />}</div>
            <div className="msg-col">
              <div className="bubble">
                {m.role === 'user' ? m.text : <RichText text={m.text} />}
                {m.error && m.retry && (
                  <div style={{ marginTop: 8 }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => send(m.retry)} disabled={loading}><RefreshCw size={13} /> Try again</button>
                  </div>
                )}
              </div>
              {m.tickets?.map(t => <ChatTicket key={t.ticketId} ticket={t} />)}
              <span className="msg-time">{formatTime(m.time)}</span>
            </div>
          </div>
        ))}
        {loading && (
          <div className="msg bot">
            <div className="msg-avatar"><Bot size={15} /></div>
            <div className="bubble typing" aria-label="Assistant is typing"><span /><span /><span /></div>
          </div>
        )}
      </div>

      {(showSuggestions || (pending && !loading)) && (
        <div className="chat-suggest">
          {pending && !loading ? (
            <>
              <button className="suggest-chip confirm" onClick={() => send('Yes, confirm the booking')}><Check size={13} style={{ verticalAlign: -2 }} /> Yes, book it (₹{pending.fare})</button>
              <button className="suggest-chip cancel" onClick={() => send('No, cancel this booking')}>Cancel</button>
            </>
          ) : (
            SUGGESTIONS.map(s => <button key={s} className="suggest-chip" onClick={() => send(s)}>{s}</button>)
          )}
        </div>
      )}

      <div className="chat-input">
        <textarea
          ref={inputRef}
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Ask about stations, fares or tickets…"
          aria-label="Message"
          maxLength={2000}
        />
        <button className="chat-send" onClick={() => send()} disabled={loading || !input.trim()} aria-label="Send message">
          <Send size={18} />
        </button>
      </div>
      <div className="chat-foot">AI answers use live metro data. Bookings always need your confirmation.</div>
    </div>
  );
}
