import { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import { api } from '../services/api';

export default function StationsView() {
  const [stations, setStations] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStations().then(r => { setStations(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = filter ? stations.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.line.toLowerCase().includes(filter.toLowerCase()) ||
    s.stationId.toLowerCase().includes(filter.toLowerCase())
  ) : stations;

  const lineColors = { 'Purple Line':'#9b59b6', 'Blue Line':'#3498db', 'Green Line':'#2ecc71', 'Red Line':'#e74c3c', 'Orange Line':'#f39c12' };

  if (loading) return <div style={{ padding:40, textAlign:'center', color:'#888' }}>Loading stations...</div>;

  return (
    <div style={{ maxWidth:900, margin:'0 auto', padding:32 }}>
      <h2 style={{ color:'#fff', fontSize:28, marginBottom:24 }}>Metro Stations</h2>
      <div style={{ position:'relative', marginBottom:24 }}>
        <Search size={18} color="#666" style={{ position:'absolute', left:14, top:14 }} />
        <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Search by name, line, or ID..." style={{
          width:'100%', padding:'12px 16px 12px 40px', background:'#16213e', color:'#fff', border:'1px solid #333',
          borderRadius:8, fontSize:14, outline:'none'
        }} />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12 }}>
        {filtered.map(s => (
          <div key={s.stationId} style={{
            padding:16, borderRadius:10, background:'#16213e', border:'1px solid #222',
            borderLeft:`4px solid ${lineColors[s.line] || '#666'}`, transition:'all .2s'
          }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'start' }}>
              <div>
                <div style={{ fontWeight:600, color:'#fff', fontSize:15 }}>{s.name}</div>
                <div style={{ fontSize:12, color:'#888', marginTop:2 }}>
                  <span style={{
                    display:'inline-block', padding:'2px 8px', borderRadius:12, fontSize:11,
                    background:lineColors[s.line] + '33', color:lineColors[s.line], fontWeight:600
                  }}>{s.line}</span>
                </div>
              </div>
              <div style={{ fontWeight:700, color:'#e94560', fontSize:16 }}>₹{s.price}</div>
            </div>
            <div style={{ fontSize:11, color:'#555', marginTop:8 }}>ID: {s.stationId}</div>
          </div>
        ))}
      </div>
      <p style={{ color:'#555', fontSize:13, textAlign:'center', marginTop:16 }}>
        Showing {filtered.length} of {stations.length} stations
      </p>
    </div>
  );
}
