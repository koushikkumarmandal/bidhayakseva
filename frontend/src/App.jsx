import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HomeOverview from './components/HomeOverview';
import ComplaintForm from './components/ComplaintForm';
import TrackComplaint from './components/TrackComplaint';
import AdminPortal from './components/AdminPortal';
import CitizenDashboard from './components/CitizenDashboard';
import CitizenAuthModal from './components/CitizenAuthModal';
import Footer from './components/Footer';
import { api } from './services/api';
import { Wifi } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [trackTicketId, setTrackTicketId] = useState('');
  
  // Admin User State
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bsk_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Citizen User State (Registered & Logged in with Phone & Password, 7-day session)
  const [citizenUser, setCitizenUser] = useState(() => {
    try {
      const saved = localStorage.getItem('bsk_citizen_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [citizenAuthOpen, setCitizenAuthOpen] = useState(false);
  const [serverStatus, setServerStatus] = useState('checking');
  const [sessionNotice, setSessionNotice] = useState('');

  useEffect(() => {
    checkServer();
    verifyExistingCitizenSession();
  }, []);

  const verifyExistingCitizenSession = async () => {
    try {
      const sessionRaw = localStorage.getItem('bsk_citizen_session');
      if (!sessionRaw) return;
      const session = JSON.parse(sessionRaw);

      if (!session || !session.phone || !session.token) {
        handleCitizenLogout();
        return;
      }

      // Check client-side expiry
      if (session.sessionExpiresAt && new Date(session.sessionExpiresAt).getTime() < Date.now()) {
        setSessionNotice('আপনার ৭ দিনের সেশনের মেয়াদ শেষ হয়েছে। দয়া করে পুনরায় লগইন করুন।');
        handleCitizenLogout();
        return;
      }

      // Verify with backend
      const res = await api.verifyCitizenSession(session.phone, session.token);
      if (res && res.valid) {
        if (res.citizen) {
          setCitizenUser(res.citizen);
          localStorage.setItem('bsk_citizen_user', JSON.stringify(res.citizen));
        }
      } else {
        if (res && res.superseded) {
          setSessionNotice('অন্য কোনো ডিভাইস থেকে এই অ্যাকাউন্টে নতুন লগইন করা হয়েছে। এই ডিভাইসের সেশনটি বন্ধ করা হল।');
        } else if (res && res.expired) {
          setSessionNotice('আপনার ৭ দিনের সেশনের মেয়াদ শেষ হয়েছে। দয়া করে পুনরায় লগইন করুন।');
        }
        handleCitizenLogout(false);
      }
    } catch (e) {
      console.warn('Session verification fallback error:', e);
    }
  };

  const checkServer = async () => {
    try {
      const res = await api.getHealth();
      if (res.status === 'ok') {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  // Admin auth handlers
  const handleAdminLogin = (user) => {
    setAdminUser(user);
    localStorage.setItem('bsk_admin_user', JSON.stringify(user));
    setActiveTab('admin');
  };

  const handleAdminLogout = () => {
    setAdminUser(null);
    localStorage.removeItem('bsk_admin_user');
    setActiveTab('home');
  };

  // Citizen auth handlers (7-day session & single account per device)
  const handleCitizenAuthSuccess = (data) => {
    // data can be { citizen, token, sessionExpiresAt } or citizen directly
    const citizen = data.citizen || data;
    const token = data.token;
    const sessionExpiresAt = data.sessionExpiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    setCitizenUser(citizen);
    localStorage.setItem('bsk_citizen_user', JSON.stringify(citizen));

    if (token) {
      localStorage.setItem('bsk_citizen_session', JSON.stringify({
        phone: citizen.phone,
        token,
        sessionExpiresAt
      }));
    }
    setSessionNotice('');
  };

  const handleCitizenLogout = async (callApi = true) => {
    const curPhone = citizenUser?.phone;
    if (callApi && curPhone) {
      try {
        await api.citizenLogout(curPhone);
      } catch (err) {
        console.warn('Logout API error:', err);
      }
    }
    setCitizenUser(null);
    localStorage.removeItem('bsk_citizen_user');
    localStorage.removeItem('bsk_citizen_session');
    if (activeTab === 'my-complaints') {
      setActiveTab('home');
    }
  };

  const handleTrackPreset = (ticketId) => {
    setTrackTicketId(ticketId);
    setActiveTab('track');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-emerald-500 selection:text-white">
      {/* Navigation */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        adminUser={adminUser}
        onLogoutAdmin={handleAdminLogout}
        citizenUser={citizenUser}
        onOpenCitizenAuth={() => setCitizenAuthOpen(true)}
        onLogoutCitizen={handleCitizenLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Subtle Server Connection Status */}
        <div className="flex justify-end mb-4">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-white border border-slate-200 text-slate-600 shadow-2xs">
            {serverStatus === 'online' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>BSK পোর্টাল সক্রিয় (Live & Connected)</span>
              </>
            ) : serverStatus === 'checking' ? (
              <span>সংযোগ যাচাই হচ্ছে...</span>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>লোকাল মোড সক্রিয় (Resilient Mode)</span>
              </>
            )}
          </div>
        </div>

        {/* Session Notice / Concurrency Alert */}
        {sessionNotice && (
          <div className="mb-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs font-semibold flex items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping shrink-0" />
              <span>{sessionNotice}</span>
            </div>
            <button
              onClick={() => setSessionNotice('')}
              className="text-amber-800 hover:text-amber-950 font-bold px-2 py-0.5 rounded cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tab Routing */}
        {activeTab === 'home' && (
          <HomeOverview 
            citizenUser={citizenUser}
            onOpenCitizenAuth={() => setCitizenAuthOpen(true)}
            setActiveTab={(tab) => {
              if (tab === 'complaint' && !citizenUser) {
                setCitizenAuthOpen(true);
              }
              setActiveTab(tab);
            }} 
            onTrackPreset={handleTrackPreset}
          />
        )}

        {activeTab === 'complaint' && (
          <ComplaintForm 
            citizenUser={citizenUser}
            onOpenCitizenAuth={() => setCitizenAuthOpen(true)}
            onTicketCreated={(ticket) => {
              setTrackTicketId(ticket.ticketId);
            }}
            onTrackTicket={(ticketId) => {
              setTrackTicketId(ticketId);
              setActiveTab('track');
            }}
          />
        )}

        {activeTab === 'my-complaints' && (
          <CitizenDashboard 
            citizenUser={citizenUser}
            onTrackTicket={(ticketId) => {
              setTrackTicketId(ticketId);
              setActiveTab('track');
            }}
            onNewComplaint={() => setActiveTab('complaint')}
            onLogout={handleCitizenLogout}
          />
        )}

        {activeTab === 'track' && (
          <TrackComplaint 
            initialTicketId={trackTicketId} 
          />
        )}

        {activeTab === 'admin' && (
          <AdminPortal 
            adminUser={adminUser} 
            onLogin={handleAdminLogin}
            onLogout={handleAdminLogout}
          />
        )}
      </main>

      {/* Citizen Registration / Login Modal with Phone & OTP */}
      <CitizenAuthModal 
        isOpen={citizenAuthOpen}
        onClose={() => setCitizenAuthOpen(false)}
        onAuthSuccess={handleCitizenAuthSuccess}
      />

      {/* Footer */}
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
