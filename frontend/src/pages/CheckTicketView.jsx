import { useState } from 'react';
import { Search, CheckCircle, XCircle, ArrowRight, LogOut, Clock, Copy } from 'lucide-react';
import { api } from '../services/api';

export default function CheckTicketView() {
  const [ticketId, setTicketId] = useState('');
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type:'', text:'' });
  const [copied, setCopied] = useState(false);
  const [lastAction, setLastAction] = useState('');

  const lookup = async () => {
    if (!ticketId.trim()) return setMsg({ type:'error', text:'Enter a ticket ID' });
    setLoading(true); setMsg({}); setTicket(null);
    try {
      const r = await api.getTicket(ticketId.trim());
      setTicket(r.data);
    } catch (e) { setMsg({ type:'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const action = async (fn) => {
    setLoading(true); setMsg({});
    try {
      const r = await fn(ticketId.trim());
      setTicket(r.data);
      setMsg({ type:'success', text: r.message });
    } catch (e) { setMsg({ type:'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const copyId = () => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineColors = { 'Purple Line':'#9b59b6', 'Blue Line':'#3498db', 'Green Line':'#2ecc71', 'Red Line':'#e74c3c', 'Orange Line':'#f39c12' };

  const statusColor = (s) => ({ active:'#3498db', entry_done:'#f39c12', completed:'#2ecc71', expired:'#e74c3c', invalid:'#999' }[s] || '#666');

  return (
    <div style={{ maxWidth:700, margin:'0 auto', padding:32 }}>
      <h2 style={{ color:'#fff', fontSize:28, marginBottom:24 }}>Check / Validate Ticket</h2>

      <div style={{ display:'flex', gap:12, marginBottom:24 }}>
        <input value={ticketId} onChange={e => setTicketId(e.target.value)} placeholder="Enter ticket ID..." style={{
          flex:1, padding:'12px 16px', background:'#16213e', color:'#fff', border:'1px solid #333',
          borderRadius:8, fontSize:14, fontFamily:'monospace', outline:'none'
        }} />
        <button onClick={lookup} disabled={loading} style={{
          padding:'12px 24px', background:'#2c3e50', color:'#fff', border:'none',
          borderRadius:8, fontWeight:600, cursor:loading ? 'wait' : 'pointer', display:'flex', alignItems:'center', gap:6
        }}>
          <Search size={16} /> Lookup
        </button>
        <button onClick={copyId} style={{
          padding:'12px', background:'#1a1a2e', border:'1px solid #333', color:'#fff', borderRadius:8, cursor:'pointer'
        }}><Copy size={16} /></button>
      </div>

      {msg.text && (
        <div style={{ marginTop:8, padding:12, borderRadius:8,
          background:msg.type==='error' ? '#3d1f1f' : '#1a3d1f',
          color:msg.type==='error' ? '#e74c3c' : '#2ecc71', fontSize:13, display:'flex', alignItems:'center', gap:6 }}>
          {msg.type==='error' ? <XCircle size={16} /> : <CheckCircle size={16} />}
          {msg.text}
        </div>
      )}

      {ticket && (
        <div style={{ marginTop:20, padding:24, borderRadius:12, background:'#1a1a2e', border:`2px solid ${statusColor(ticket.status)}` }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
            <h3 style={{ margin:0, color:'#fff', fontSize:18 }}>Ticket Details</h3>
            <span style={{ padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600,
              background:statusColor(ticket.status)+'33', color:statusColor(ticket.status) }}>
              {ticket.status.toUpperCase()}
            </span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={{ padding:12, background:'#0f0f23', borderRadius:8 }}>
              <div style={{ fontSize:11, color:'#666', marginBottom:4 }}>FROM</div>
              <div style={{ color:'#fff', fontWeight:600 }}>{ticket.sourceStation}</div>
            </div>
            <div style={{ padding:12, background:'#0f0f23', borderRadius:8 }}>
              <div style={{ fontSize:11, color:'#666', marginBottom:4 }}>TO</div>
              <div style={{ color:'#fff', fontWeight:600 }}>{ticket.destinationStation}</div>
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div style={{ padding:12, background:'#0f0f23', borderRadius:8 }}>
              <div style={{ fontSize:11, color:'#666', marginBottom:4 }}>FARE</div>
              <div style={{ color:'#e94560', fontWeight:700, fontSize:20 }}>₹{ticket.fare}</div>
            </div>
            <div style={{ padding:12, background:'#0f0f23', borderRadius:8 }}>
              <div style={{ fontSize:11, color:'#666', marginBottom:4 }}>TICKET ID</div>
              <div style={{ color:'#fff', fontFamily:'monospace', fontSize:11, wordBreak:'break-all' }}>{ticket.ticketId}</div>
            </div>
          </div>

          {[
            { label:'Booked', icon: Clock, value: ticket.createdAt ? new Date(ticket.createdAt).toLocaleString() : '—' },
            { label:'Expires', icon: Clock, value: ticket.expiresAt ? new Date(ticket.expiresAt).toLocaleString() : '—' },
            { label:'Entry', icon: ArrowRight, value: ticket.entryUsed ? `✅ ${new Date(ticket.entryUsedAt).toLocaleString()}` : '⏳ Pending' },
            { label:'Exit', icon: LogOut, value: ticket.exitUsed ? `✅ ${new Date(ticket.exitUsedAt).toLocaleString()}` : '⏳ Pending' }
          ].map(item => (
            <div key={item.label} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 0', borderBottom:'1px solid #222' }}>
              <item.icon size={14} color="#666" />
              <span style={{ color:'#888', fontSize:13, width:60 }}>{item.label}</span>
              <span style={{ color:'#ccc', fontSize:13 }}>{item.value}</span>
            </div>
          ))}

          <div style={{ display:'flex', gap:12, marginTop:20 }}>
            <button onClick={() => action(api.entry)} disabled={loading || ticket.entryUsed} style={{
              flex:1, padding:'10px', background:ticket.entryUsed ? '#555' : '#2ecc71', color:'#fff', border:'none',
              borderRadius:8, fontWeight:600, fontSize:13, cursor:loading || ticket.entryUsed ? 'wait' : 'pointer'
            }}>
              {ticket.entryUsed ? 'Entry Done' : 'Validate Entry'}
            </button>
            <button onClick={() => action(api.exit)} disabled={loading || !ticket.entryUsed || ticket.exitUsed} style={{
              flex:1, padding:'10px', background:ticket.exitUsed || !ticket.entryUsed ? '#555' : '#3498db', color:'#fff', border:'none',
              borderRadius:8, fontWeight:600, fontSize:13, cursor:loading || !ticket.entryUsed || ticket.exitUsed ? 'wait' : 'pointer'
            }}>
              {ticket.exitUsed ? 'Exit Done' : ticket.entryUsed ? 'Validate Exit' : 'Entry First'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
