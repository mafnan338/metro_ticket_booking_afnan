import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Link, NavLink, useLocation } from 'react-router-dom';
import { TrainFront, MapPin, Ticket, ScanLine, HelpCircle, Home, Menu, X, Mail, Phone, Clock, ShieldCheck, LogIn, LogOut, Ban, Search } from 'lucide-react';
import HomeView from './pages/HomeView';
import BookingView from './pages/BookingView';
import StationsView from './pages/StationsView';
import CheckTicketView from './pages/CheckTicketView';
import ChatWidget from './components/ChatWidget';
import { PageHeader } from './components/ui';

const NAV = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/book', label: 'Book Ticket', icon: Ticket },
  { to: '/stations', label: 'Stations', icon: MapPin },
  { to: '/check', label: 'Check Ticket', icon: ScanLine },
  { to: '/help', label: 'Help', icon: HelpCircle }
];

function Brand() {
  return (
    <Link to="/" className="brand" aria-label="Bengaluru Metro home">
      <span className="brand-mark"><TrainFront size={20} /></span>
      <span>
        <div className="brand-name">Bengaluru Metro</div>
        <div className="brand-sub">Digital Ticketing</div>
      </span>
    </Link>
  );
}

function NavBar() {
  const [open, setOpen] = useState(false);
  const loc = useLocation();
  useEffect(() => { setOpen(false); }, [loc.pathname]);

  const links = NAV.map(n => (
    <NavLink key={n.to} to={n.to} end={n.to === '/'} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
      <n.icon size={16} /> {n.label}
    </NavLink>
  ));

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Brand />
        <nav className="nav-links" aria-label="Main">
          {links}
          <Link to="/book" className="btn btn-primary btn-sm nav-cta"><Ticket size={15} /> Book now</Link>
        </nav>
        <button className="nav-toggle" onClick={() => setOpen(o => !o)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
      {open && <nav className="mobile-menu" aria-label="Mobile">{links}</nav>}
    </header>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo(0, 0); }, [pathname]);
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <NavBar />
        <main className="main">
          <Routes>
            <Route path="/" element={<HomeView />} />
            <Route path="/book" element={<BookingView />} />
            <Route path="/stations" element={<StationsView />} />
            <Route path="/check" element={<CheckTicketView />} />
            <Route path="/help" element={<HelpView />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
        <ChatWidget />
      </div>
    </BrowserRouter>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="row" style={{ marginBottom: 14 }}>
              <span className="brand-mark"><TrainFront size={20} /></span>
              <span className="brand-name">Bengaluru Metro</span>
            </div>
            <p style={{ maxWidth: 300 }}>Fast, reliable, digital metro ticket booking for Bengaluru commuters.</p>
          </div>
          <div>
            <h4>Travel</h4>
            <Link to="/book">Book Ticket</Link>
            <Link to="/stations">Station Directory</Link>
            <Link to="/check">Check Ticket</Link>
          </div>
          <div>
            <h4>Help</h4>
            <Link to="/help">How it works</Link>
            <Link to="/help">Ticket rules</Link>
          </div>
          <div>
            <h4>Support</h4>
            <div className="footer-contact"><Mail size={15} /> support@bmml.com</div>
            <div className="footer-contact"><Phone size={15} /> 1800-123-4567</div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 Bengaluru Metro Ticket Booking System. All rights reserved.</span>
          <span>Built with React, Express, MongoDB & Claude</span>
        </div>
      </div>
    </footer>
  );
}

function HelpView() {
  const steps = [
    { icon: MapPin, title: 'Select your stations', desc: 'Choose source and destination on the Book Ticket page. You can search by name, line or station ID.' },
    { icon: Search, title: 'Review your fare', desc: 'The server calculates the fare as the price difference between the two stations.' },
    { icon: Ticket, title: 'Book your ticket', desc: 'Confirm the booking to receive a digital ticket with a unique ID and QR code.' },
    { icon: LogIn, title: 'Entry scan', desc: 'At the station, scan your ticket at the entry gate (or use the Check Ticket page to simulate it).' },
    { icon: LogOut, title: 'Exit scan', desc: 'After your journey, scan again at the exit gate to complete the trip.' }
  ];
  const rules = [
    { icon: Clock, text: 'Tickets are valid for 18 hours from booking.' },
    { icon: ShieldCheck, text: 'Two scans per ticket: entry first, then exit.' },
    { icon: Ban, text: 'Exit before entry is rejected, and each scan works only once.' },
    { icon: Ban, text: 'Completed or expired tickets cannot be reused.' }
  ];
  return (
    <div className="page">
      <div className="container container-sm">
        <PageHeader eyebrow="Help centre" icon={HelpCircle} title="How it works" subtitle="Everything you need to know about booking and using your digital metro ticket." />
        <div className="help-steps">
          {steps.map((s, i) => (
            <div key={s.title} className="card help-step">
              <div className="step-num"><s.icon size={20} /></div>
              <div>
                <div className="muted" style={{ fontSize: 12, fontWeight: 700 }}>STEP {i + 1}</div>
                <h3 style={{ fontSize: 17, margin: '2px 0 4px' }}>{s.title}</h3>
                <p className="muted" style={{ fontSize: 14 }}>{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="card card-pad" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 18, marginBottom: 16 }}>Ticket rules</h3>
          <ul className="info-list">
            {rules.map(r => <li key={r.text}><r.icon size={18} /> {r.text}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="page">
      <div className="container container-sm empty">
        <div className="empty-icon"><MapPin size={26} /></div>
        <h1 className="page-title" style={{ marginBottom: 10 }}>Page not found</h1>
        <p style={{ marginBottom: 20 }}>This stop doesn't exist on our network.</p>
        <Link to="/" className="btn btn-primary">Back to home</Link>
      </div>
    </div>
  );
}
