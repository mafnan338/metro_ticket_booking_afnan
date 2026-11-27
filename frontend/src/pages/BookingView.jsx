import { useState, useEffect } from 'react';
import { ArrowDownUp, CheckCircle, XCircle, Clock, Copy, QrCode } from 'lucide-react';
import { api } from '../services/api';

export default function BookingView() {
  const [stations, setStations] = useState([]);
  const [source, setSource] = useState('');
  const [dest, setDest] = useState('');
  const [fareData, setFareData] = useState(null);
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api.getStations().then(r => setStations(r.data)).catch(() => setMsg({ type:'error', text:'Failed to load stations' }));
  }, []);

  const swap = () => { const t = source; setSource(dest); setDest(t); };

  const calcFare = async () => {
    if (!source || !dest) return setMsg({ type:'error', text:'Select both stations' });
    if (source === dest) return setMsg({ type:'error', text:'Source and destination must differ' });
    setLoading(true); setMsg({});
    try {
      const r = await api.calculateFare({ sourceStationId: source, destinationStationId: dest });
      setFareData(r.data);
      setTicket(null);
    } catch (e) { setMsg({ type:'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const book = async () => {
    if (!source || !dest) return setMsg({ type:'error', text:'Select both stations' });
    setLoading(true); setMsg({});
    try {
      const r = await api.bookTicket({ sourceStationId: source, destinationStationId: dest });
      setTicket(r.data);
      setFareData(r.data);
    } catch (e) { setMsg({ type:'error', text: e.message }); }
    finally { setLoading(false); }
  };

  const copyId = () => {
    if (!ticket) return;
    navigator.clipboard.writeText(ticket.ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lineColors = { 'Purple Line':'#9b59b6', 'Blue Line':'#3498db', 'Green Line':'#2ecc71', 'Red Line':'#e74c3c', 'Orange Line':'#f39c12' };

  const stationSelect = (val, setter) => (
    <select value={val} onChange={e => setter(e.target.value)} style={{
      width:'100%', padding:'12px 16px', background:'#16213e', color:'#fff', border:'1px solid #333',
      borderRadius:8, fontSize:14, outline:'none'
    }}>
      <option value="">Select station...</option>
      {stations.map(s => (
        <option key={s.stationId} value={s.stationId}>{s.name} ({s.line}) — Price: ₹{s.price}</option>
      ))}
    </select>
  );

  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:32 }}>
      <h2 style={{ color:'#fff', fontSize:28, marginBottom:32, textAlign:'center' }}>Book a Ticket</h2>

      <div style={{ background:'#16213e', borderRadius:12, padding:28, border:'1px solid #222' }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:16, alignItems:'end' }}>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Source Station</label>
            {stationSelect(source, setSource)}
          </div>
          <button onClick={swap} title="Swap" style={{
            padding:12, background:'#1a1a2e', border:'1px solid #333', borderRadius:8, color:'#e94560',
            cursor:'pointer', marginBottom:2, transition:'all .2s'
          }}><ArrowDownUp size={20} /></button>
          <div>
            <label style={{ display:'block', fontSize:12, color:'#888', marginBottom:6, textTransform:'uppercase', letterSpacing:1 }}>Destination Station</label>
            {stationSelect(dest, setDest)}
          </div>
        </div>

        <div style={{ display:'flex', gap:12, marginTop:20 }}>
          <button onClick={calcFare} disabled={loading || !source || !dest} style={{
            flex:1, padding:'12px 24px', background:loading ? '#555' : '#2c3e50', color:'#fff', border:'none',
            borderRadius:8, fontWeight:600, fontSize:14, cursor:loading ? 'wait' : 'pointer'
          }}>
            {loading ? 'Calculating...' : 'Calculate Fare'}
          </button>
          <button onClick={book} disabled={loading || !fareData} style={{
            flex:1, padding:'12px 24px', background:loading || !fareData ? '#555' : '#e94560', color:'#fff', border:'none',
            borderRadius:8, fontWeight:600, fontSize:14, cursor:(loading || !fareData) ? 'wait' : 'pointer'
          }}>
            {loading ? 'Booking...' : 'Book Ticket'}
          </button>
        </div>
      </div>

      {msg.text && (
        <div style={{ marginTop:16, padding:14, borderRadius:8, background:msg.type==='error' ? '#3d1f1f' : '#1a3d1f',
          color:msg.type==='error' ? '#e74c3c' : '#2ecc71', fontSize:14, display:'flex', alignItems:'center', gap:8 }}>
          {msg.type==='error' ? <XCircle size={18} /> : <CheckCircle size={18} />}
          {msg.text}
        </div>
      )}

      {fareData && !ticket && (
        <div style={{ marginTop:20, padding:20, borderRadius:12, background:'#1a1a2e', border:'1px solid #333' }}>
          <h3 style={{ color:'#fff', margin:'0 0 12px', fontSize:16 }}>Fare Summary</h3>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
            <span style={{ color:'#888' }}>From</span><span style={{ color:'#fff' }}>{fareData.sourceStationName}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:14, marginBottom:8 }}>
            <span style={{ color:'#888' }}>To</span><span style={{ color:'#fff' }}>{fareData.destinationStationName}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:18, fontWeight:700, paddingTop:12, borderTop:'1px solid #333' }}>
            <span style={{ color:'#888' }}>Fare</span><span style={{ color:'#e94560' }}>₹{fareData.fare}</span>
          </div>
        </div>
      )}

      {ticket && (
        <div style={{ marginTop:20, padding:24, borderRadius:12, background:'#1a1a2e', border:'2px solid #2ecc71', position:'relative' }}>
          <div style={{ position:'absolute', top:12, right:12, display:'flex', gap:8 }}>
            <button onClick={copyId} style={{ padding:6, background:'#333', border:'none', borderRadius:4, color:'#fff', cursor:'pointer', fontSize:12, display:'flex', alignItems:'center', gap:4 }}>
              <Copy size={12} /> {copied ? 'Copied!' : 'Copy ID'}
            </button>
          </div>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <QrCode size={80} color="#e94560" style={{ margin:'0 auto', display:'block' }} />
            <p style={{ fontSize:11, color:'#666', marginTop:8 }}>QR Code is decorative. Validate with ticket ID.</p>
          </div>
          <div style={{ textAlign:'center', marginBottom:16 }}>
            <span style={{ display:'inline-block', padding:'4px 12px', borderRadius:20, fontSize:12, fontWeight:600,
              background:ticket.status==='completed' ? '#2ecc71' : ticket.status==='expired' ? '#e74c3c' : '#3498db', color:'#fff' }}>
              {ticket.status.toUpperCase()}
            </span>
          </div>
          {[
            ['Ticket ID', ticket.ticketId],
            ['From', ticket.sourceStation],
            ['To', ticket.destinationStation],
            ['Fare', `₹${ticket.fare}`],
            ['Booked', new Date(ticket.createdAt).toLocaleString()],
            ['Expires', new Date(ticket.expiresAt).toLocaleString()],
            ['Entry', ticket.entryUsed ? `✅ ${new Date(ticket.entryUsedAt).toLocaleString()}` : 'Not used'],
            ['Exit', ticket.exitUsed ? `✅ ${new Date(ticket.exitUsedAt).toLocaleString()}` : 'Not used']
          ].map(([l,v]) => (
            <div key={l} style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid #222', fontSize:13 }}>
              <span style={{ color:'#888' }}>{l}</span><span style={{ color:'#fff', fontFamily:'monospace' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
