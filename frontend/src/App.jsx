import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { TrainFront, MapPin, Ticket, Search, MessageCircle, HelpCircle, Home } from 'lucide-react';
import HomeView from './pages/HomeView';
import BookingView from './pages/BookingView';
import StationsView from './pages/StationsView';
import CheckTicketView from './pages/CheckTicketView';
import ChatWidget from './components/ChatWidget';

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/book', label: 'Book Ticket', icon: Ticket },
  { to: '/stations', label: 'Stations', icon: MapPin },
  { to: '/check', label: 'Check Ticket', icon: Search },
  { to: '/help', label: 'Help', icon: HelpCircle }
];

function NavBar() {
  const loc = useLocation();
  return (
    <nav style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 32px', background:'#1a1a2e', borderBottom:'3px solid #e94560' }}>
      <Link to="/" style={{ display:'flex', alignItems:'center', gap:10, textDecoration:'none', color:'#fff' }}>
        <TrainFront size={28} color="#e94560" />
        <span style={{ fontWeight:800, fontSize:20 }}>Bengaluru Metro</span>
      </Link>
      <div style={{ display:'flex', gap:24 }}>
        {NAV.map(n => (
          <Link key={n.to} to={n.to} style={{
            display:'flex', alignItems:'center', gap:6, textDecoration:'none',
            color: loc.pathname === n.to ? '#e94560' : '#ccc',
            fontWeight: loc.pathname === n.to ? 700 : 500, fontSize:14,
            borderBottom: loc.pathname === n.to ? '2px solid #e94560' : '2px solid transparent',
            paddingBottom:4, transition:'all .2s'
          }}>
            <n.icon size={16} />
            {n.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight:'100vh', background:'#0f0f23', color:'#e0e0e0' }}>
        <NavBar />
        <Routes>
          <Route path="/" element={<HomeView />} />
          <Route path="/book" element={<BookingView />} />
          <Route path="/stations" element={<StationsView />} />
          <Route path="/check" element={<CheckTicketView />} />
          <Route path="/help" element={<HelpView />} />
        </Routes>
        <ChatWidget />
        <Footer />
      </div>
    </BrowserRouter>
  );
}

function Footer() {
  return (
    <footer style={{ background:'#1a1a2e', padding:'40px 32px 24px', borderTop:'1px solid #333', marginTop:60 }}>
      <div style={{ maxWidth:1100, margin:'0 auto', display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:32 }}>
        <div>
          <h3 style={{ color:'#e94560', marginBottom:12 }}>Bengaluru Metro</h3>
          <p style={{ fontSize:13, color:'#888', lineHeight:1.6 }}>Fast, reliable, digital metro ticket booking for Bengaluru commuters.</p>
        </div>
        <div>
          <h4 style={{ color:'#aaa', marginBottom:12 }}>Quick Links</h4>
          {[['Book Ticket','/book'],['Stations','/stations'],['Check Ticket','/check']].map(([l,p]) => (
            <Link key={p} to={p} style={{ display:'block', color:'#666', fontSize:13, textDecoration:'none', marginBottom:6 }}>{l}</Link>
          ))}
        </div>
        <div>
          <h4 style={{ color:'#aaa', marginBottom:12 }}>Support</h4>
          <p style={{ fontSize:13, color:'#666', lineHeight:1.6 }}>Email: support@bmml.com<br />Phone: 1800-123-4567</p>
        </div>
      </div>
      <div style={{ textAlign:'center', marginTop:32, paddingTop:20, borderTop:'1px solid #222', fontSize:12, color:'#555' }}>
        © 2026 Bengaluru Metro Ticket Booking System. All rights reserved.
      </div>
    </footer>
  );
}

function HelpView() {
  return (
    <div style={{ maxWidth:800, margin:'0 auto', padding:40 }}>
      <h2 style={{ color:'#e94560', marginBottom:24 }}>How It Works</h2>
      {[
        { step: '1', title: 'Select Your Stations', desc: 'Choose your source and destination stations from the dropdowns on the Book Ticket page.' },
        { step: '2', title: 'Calculate Your Fare', desc: 'The system automatically calculates the fare based on the price difference between stations.' },
        { step: '3', title: 'Book Your Ticket', desc: 'Confirm the booking to receive a digital ticket with a unique ID.' },
        { step: '4', title: 'Entry Scan', desc: 'At the metro station, show your ticket ID at the entry kiosk for validation.' },
        { step: '5', title: 'Exit Scan', desc: 'After your journey, scan again at the exit kiosk to complete the trip.' }
      ].map(item => (
        <div key={item.step} style={{ display:'flex', gap:16, marginBottom:24, alignItems:'flex-start' }}>
          <div style={{ minWidth:40, height:40, borderRadius:'50%', background:'#e94560', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:18 }}>
            {item.step}
          </div>
          <div>
            <h3 style={{ margin:'0 0 4px', color:'#fff' }}>{item.title}</h3>
            <p style={{ margin:0, fontSize:14, color:'#888', lineHeight:1.5 }}>{item.desc}</p>
          </div>
        </div>
      ))}
      <div style={{ marginTop:40, padding:24, background:'#16213e', borderRadius:12, border:'1px solid #333' }}>
        <h3 style={{ color:'#e94560', marginTop:0 }}>Ticket Rules</h3>
        <ul style={{ fontSize:14, color:'#888', lineHeight:1.8, paddingLeft:20 }}>
          <li>Tickets are valid for 18 hours from booking.</li>
          <li>Two scans per ticket: entry first, then exit.</li>
          <li>No exit before entry.</li>
          <li>Once completed, a ticket cannot be reused.</li>
          <li>Use the "Check Ticket" page to validate entry/exit.</li>
        </ul>
      </div>
    </div>
  );
}
