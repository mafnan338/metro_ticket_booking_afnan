import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, TrainFront, Clock, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function HomeView() {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStations().then(r => setStations(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        padding: '80px 32px', textAlign: 'center', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ position:'relative', zIndex:1, maxWidth:700, margin:'0 auto' }}>
          <h1 style={{ fontSize:48, fontWeight:800, color:'#fff', marginBottom:16, lineHeight:1.2 }}>
            Your Journey,<br />Just a Tap Away
          </h1>
          <p style={{ fontSize:18, color:'#aaa', marginBottom:32, lineHeight:1.6 }}>
            Book Bengaluru Metro tickets digitally. Fast, secure, and hassle-free.
          </p>
          <div style={{ display:'flex', gap:16, justifyContent:'center', flexWrap:'wrap' }}>
            <Link to="/book" style={{
              padding:'14px 32px', background:'#e94560', color:'#fff', borderRadius:8,
              textDecoration:'none', fontWeight:600, fontSize:16, transition:'all .2s'
            }}>Book Ticket</Link>
            <Link to="/stations" style={{
              padding:'14px 32px', background:'transparent', color:'#e94560', border:'2px solid #e94560',
              borderRadius:8, textDecoration:'none', fontWeight:600, fontSize:16, transition:'all .2s'
            }}>Explore Stations</Link>
          </div>
        </div>
        <div style={{ position:'absolute', top:-80, right:-80, width:300, height:300, borderRadius:'50%', background:'rgba(233,69,96,0.08)' }} />
        <div style={{ position:'absolute', bottom:-60, left:-60, width:200, height:200, borderRadius:'50%', background:'rgba(233,69,96,0.05)' }} />
      </section>

      {/* Stats */}
      <section style={{ padding:'40px 32px', maxWidth:900, margin:'0 auto', display:'flex', justifyContent:'center', gap:48, flexWrap:'wrap' }}>
        {[
          { icon: TrainFront, label: 'Stations', value: loading ? '...' : stations.length },
          { icon: Clock, label: '5-Min Booking', value: '24/7' },
          { icon: ShieldCheck, label: 'Secure Tickets', value: '100%' }
        ].map((s, i) => (
          <div key={i} style={{ textAlign:'center' }}>
            <s.icon size={32} color="#e94560" style={{ marginBottom:8 }} />
            <div style={{ fontSize:32, fontWeight:800, color:'#fff' }}>{s.value}</div>
            <div style={{ fontSize:13, color:'#888', textTransform:'uppercase', letterSpacing:1 }}>{s.label}</div>
          </div>
        ))}
      </section>

      {/* How it works */}
      <section style={{ padding:'60px 32px', maxWidth:1000, margin:'0 auto' }}>
        <h2 style={{ textAlign:'center', color:'#fff', fontSize:32, marginBottom:48 }}>How It Works</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:24 }}>
          {[
            { step: '1', title: 'Select Stations', desc: 'Pick source & destination' },
            { step: '2', title: 'Calculate Fare', desc: 'Instant fare calculation' },
            { step: '3', title: 'Book Ticket', desc: 'Get your digital ticket' },
            { step: '4', title: 'Travel', desc: 'Scan entry, then exit' }
          ].map(item => (
            <div key={item.step} style={{
              background:'#16213e', padding:24, borderRadius:12, textAlign:'center',
              border:'1px solid #222', transition:'all .2s'
            }}>
              <div style={{ width:48, height:48, borderRadius:'50%', background:'#e94560', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 16px', fontWeight:700, fontSize:20, color:'#fff' }}>
                {item.step}
              </div>
              <h3 style={{ color:'#fff', fontSize:16, marginBottom:8 }}>{item.title}</h3>
              <p style={{ color:'#888', fontSize:13, margin:0 }}>{item.desc}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign:'center', marginTop:32 }}>
          <Link to="/book" style={{ color:'#e94560', textDecoration:'none', fontWeight:600, display:'inline-flex', alignItems:'center', gap:8 }}>
            Get Started <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Stations preview */}
      <section style={{ padding:'40px 32px 80px', maxWidth:1000, margin:'0 auto' }}>
        <h2 style={{ color:'#fff', marginBottom:24 }}>Metro Lines</h2>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))', gap:12 }}>
          {[...new Set(stations.map(s => s.line))].map(line => {
            const colors = { 'Purple Line':'#9b59b6', 'Blue Line':'#3498db', 'Green Line':'#2ecc71', 'Red Line':'#e74c3c', 'Orange Line':'#f39c12' };
            return (
              <div key={line} style={{ padding:16, borderRadius:8, background:colors[line] || '#666', color:'#fff', fontWeight:600, fontSize:14, textAlign:'center' }}>
                {line}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
