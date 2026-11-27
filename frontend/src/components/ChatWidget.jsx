import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { api } from '../services/api';

const SESSION_ID = `chat_${Math.random().toString(36).slice(2, 10)}`;
const SUGGESTIONS = [
  'Show me all metro stations',
  'Calculate fare between Whitefield and Majestic',
  'Help me book a ticket',
  'Explain ticket entry and exit rules',
  'Check ticket status'
];

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: '👋 Hi! I\'m your Bengaluru Metro Assistant. Ask me about stations, fares, booking, or ticket validation!' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(p => [...p, { role:'user', text:userMsg }]);
    setLoading(true);

    try {
      const r = await api.chat(userMsg, SESSION_ID);
      setMessages(p => [...p, { role:'assistant', text:r.reply }]);
    } catch (e) {
      setMessages(p => [...p, { role:'assistant', text:'Sorry, I\'m unavailable right now.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        position:'fixed', bottom:24, right:24, width:56, height:56, borderRadius:'50%',
        background:'#e94560', border:'none', color:'#fff', cursor:'pointer',
        boxShadow:'0 4px 20px rgba(233,69,96,0.4)', display:'flex', alignItems:'center', justifyContent:'center',
        zIndex:1000, transition:'all .2s'
      }}>
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div style={{
      position:'fixed', bottom:24, right:24, width:380, height:520, background:'#16213e',
      borderRadius:16, border:'1px solid #333', display:'flex', flexDirection:'column',
      boxShadow:'0 8px 40px rgba(0,0,0,0.5)', zIndex:1000, overflow:'hidden'
    }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', background:'#1a1a2e', display:'flex', justifyContent:'space-between', alignItems:'center', borderBottom:'1px solid #222' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Bot size={18} color="#e94560" />
          <span style={{ fontWeight:600, color:'#fff', fontSize:14 }}>Metro Assistant</span>
        </div>
        <button onClick={() => setOpen(false)} style={{ background:'none', border:'none', color:'#888', cursor:'pointer' }}>
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex:1, overflowY:'auto', padding:16, display:'flex', flexDirection:'column', gap:10 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display:'flex', gap:8, justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
            <div style={{
              maxWidth:'80%', padding:'10px 14px', borderRadius:12, fontSize:13, lineHeight:1.5, whiteSpace:'pre-wrap',
              background:m.role==='user' ? '#e94560' : '#1a1a2e',
              color:'#fff',
              borderBottomRightRadius:m.role==='user'?0:12,
              borderBottomLeftRadius:m.role==='user'?12:0
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display:'flex', gap:8, justifyContent:'flex-start' }}>
            <div style={{ padding:'10px 14px', borderRadius:12, background:'#1a1a2e', color:'#888', fontSize:13 }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Suggestions */}
      {messages.length <= 2 && (
        <div style={{ padding:'8px 16px', borderTop:'1px solid #222' }}>
          <div style={{ fontSize:11, color:'#555', marginBottom:6 }}>SUGGESTED</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
            {SUGGESTIONS.map(s => (
              <button key={s} onClick={() => { setInput(s); }} style={{
                padding:'4px 10px', background:'#1a1a2e', border:'1px solid #333', borderRadius:16,
                color:'#888', fontSize:11, cursor:'pointer', textAlign:'left'
              }}>{s}</button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding:12, borderTop:'1px solid #222', display:'flex', gap:8 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key==='Enter' && send()}
          placeholder="Type a message..." style={{
            flex:1, padding:'10px 14px', background:'#0f0f23', color:'#fff', border:'1px solid #333',
            borderRadius:8, fontSize:13, outline:'none'
          }} />
        <button onClick={send} disabled={loading || !input.trim()} style={{
          padding:'10px 14px', background:loading || !input.trim() ? '#555' : '#e94560',
          border:'none', borderRadius:8, color:'#fff', cursor:loading || !input.trim() ? 'wait' : 'pointer'
        }}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
