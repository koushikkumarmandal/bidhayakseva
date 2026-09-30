import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Search, 
  ShieldCheck, 
  Home, 
  Menu, 
  X, 
  LogOut, 
  PhoneCall, 
  Phone, 
  User, 
  FolderClock,
  Sparkles,
  LogIn,
  CheckCircle2,
  Shield,
  Award,
  Clock
} from 'lucide-react';

export default function Navbar({ 
  activeTab, 
  setActiveTab, 
  adminUser, 
  onLogoutAdmin,
  citizenUser,
  onOpenCitizenAuth,
  onLogoutCitizen 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNav = (tab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  // Determine navbar styling mode
  // 'admin' = Logged-in MLA Admin
  // 'citizen' = Logged-in Citizen
  // 'guest' = Not logged in
  const isCitizenLoggedIn = !!citizenUser;
  const isAdminLoggedIn = !!adminUser;

  return (
    <header className={`sticky top-0 z-40 backdrop-blur transition-all duration-300 shadow-sm ${
      isAdminLoggedIn
        ? 'bg-gradient-to-b from-amber-50/90 to-white/95 border-b-2 border-orange-500'
        : isCitizenLoggedIn
        ? 'bg-gradient-to-b from-orange-50/70 to-white/95 border-b-2 border-orange-400'
        : 'bg-white/95 border-b border-orange-200'
    }`}>
      {/* ======================================================== */}
      {/* 1. TOP CIVIC TICKER - DYNAMIC ACCORDING TO AUTH STATE   */}
      {/* ======================================================== */}
      {isAdminLoggedIn ? (
        /* ADMIN / MLA LOGGED IN TICKER - DEEP SAFFRON & GOLD */
        <div className="bg-gradient-to-r from-orange-800 via-amber-700 to-orange-900 text-white text-xs py-1.5 px-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-slate-950 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-xs">
                <Award className="w-3 h-3 text-orange-950" />
                <span>MLA ADMIN PORTAL</span>
              </span>
              <span className="font-bold text-amber-100 flex items-center gap-1.5">
                <span>মাননীয় বিধায়ক শ্রী প্রশান্ত দিগর কার্যালয় • ২০১ গোগঘাট বিধানসভা (BJP)</span>
              </span>
            </div>
            <div className="flex items-center gap-3 text-orange-100 text-[11px] font-semibold">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>প্রশাসনিক নিয়ন্ত্রণ সক্রিয় (Live Master Control)</span>
              </span>
              <span className="hidden sm:inline text-amber-300/60">•</span>
              <button
                onClick={onLogoutAdmin}
                className="hover:text-amber-200 font-bold underline cursor-pointer"
              >
                লগআউট
              </button>
            </div>
          </div>
        </div>
      ) : isCitizenLoggedIn ? (
        /* CITIZEN LOGGED IN TICKER - WARM SAFFRON & CITIZEN BADGE */
        <div className="bg-gradient-to-r from-orange-700 via-amber-600 to-orange-700 text-white text-xs py-1.5 px-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-white text-orange-800 font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase shadow-2xs">
                নাগরিক একাউন্ট সক্রিয়
              </span>
              <span className="font-medium text-orange-100">
                স্বাগতম, <strong className="text-white">{citizenUser.name}</strong> • পঞ্চায়েত: <strong className="text-amber-200">{citizenUser.wardOrPanchayat || 'গোগঘাট'}</strong>
              </span>
            </div>
            <div className="flex items-center gap-3 text-orange-100 text-[11px]">
              <span className="flex items-center gap-1 font-semibold text-emerald-200 bg-emerald-900/40 px-2 py-0.5 rounded-full border border-emerald-400/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                <span>৭ দিনের সেশন চালু আছে</span>
              </span>
              <span className="hidden sm:inline text-orange-300/60">•</span>
              <span className="hidden md:inline">হেল্পলাইন: <strong>03211-255014</strong></span>
            </div>
          </div>
        </div>
      ) : (
        /* PUBLIC GUEST TICKER - BJP KESARI CIVIC TICKER */
        <div className="bg-gradient-to-r from-orange-600 via-amber-500 to-orange-600 text-white text-xs py-1.5 px-4 shadow-xs">
          <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="bg-slate-900 text-white font-black px-2 py-0.5 rounded text-[10px] tracking-wider uppercase">
                BJP • পশ্চিমবঙ্গ
              </span>
              <span className="font-bold text-white">
                গোগঘাট বিধানসভা কেন্দ্র (AC 201), হুগলী জেলা
              </span>
            </div>
            <div className="flex items-center gap-4 text-orange-100">
              <span className="flex items-center gap-1.5">
                <PhoneCall className="w-3.5 h-3.5 text-white" />
                <span>বিধায়ক হেল্পলাইন: <strong>03211-255014</strong></span>
              </span>
              <span className="hidden md:inline text-orange-200">•</span>
              <span className="hidden md:inline text-white font-semibold">
                জনসেবায় মাননীয় বিধায়ক প্রশান্ত দিগর
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 2. MAIN NAVBAR CONTENT                                   */}
      {/* ======================================================== */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          
          {/* Logo & Identity */}
          <div 
            onClick={() => handleNav('home')} 
            className="flex items-center gap-3 cursor-pointer select-none group"
          >
            {/* BJP Kesari Emblem */}
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-md transition-all group-hover:scale-105 ${
              isAdminLoggedIn
                ? 'bg-gradient-to-br from-amber-600 to-orange-800 shadow-orange-600/30'
                : 'bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 shadow-orange-500/25'
            }`}>
              {isAdminLoggedIn ? (
                <ShieldCheck className="w-7 h-7 text-white" />
              ) : (
                <Building2 className="w-6 h-6 text-white" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-slate-900">
                  বিধায়ক সেবা কেন্দ্র
                </span>
                <span className="bg-orange-100 text-orange-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-orange-300">
                  গোগঘাট AC 201
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium tracking-wide">
                মাননীয় বিধায়ক শ্রী প্রশান্ত দিগর (BJP) • গোগঘাট, হুগলী
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-2">
            <button
              onClick={() => handleNav('home')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'home'
                  ? 'bg-orange-50 text-orange-700 shadow-2xs border border-orange-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>হোম / Home</span>
            </button>

            {/* If NOT Admin, Show File Complaint Button */}
            {!isAdminLoggedIn && (
              <button
                onClick={() => {
                  if (!citizenUser) {
                    onOpenCitizenAuth();
                  } else {
                    handleNav('complaint');
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'complaint'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'bg-orange-50 text-orange-800 hover:bg-orange-100 border border-orange-300'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>অভিযোগ দায়ের / New Ticket</span>
              </button>
            )}

            {/* Logged-in Citizen Quick Access to My Tickets */}
            {citizenUser && (
              <button
                onClick={() => handleNav('my-complaints')}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'my-complaints'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200'
                }`}
              >
                <FolderClock className="w-4 h-4" />
                <span>আমার অভিযোগসমূহ (My Tickets)</span>
              </button>
            )}

            {/* Track Complaint Link */}
            <button
              onClick={() => handleNav('track')}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-orange-50 text-orange-700 shadow-2xs border border-orange-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>স্থিতি সন্ধান / Track</span>
            </button>

            <div className="h-5 w-px bg-slate-200 mx-1" />

            {/* -------------------------------------------------------- */}
            {/* CITIZEN PROFILE BUTTON (IF LOGGED IN)                    */}
            {/* -------------------------------------------------------- */}
            {citizenUser ? (
              <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border-2 border-orange-300 shadow-xs">
                <button
                  onClick={() => handleNav('my-complaints')}
                  className="flex items-center gap-2.5 text-xs font-bold text-orange-950 hover:text-orange-700 cursor-pointer"
                  title="আমার ড্যাশবোর্ড দেখুন"
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center text-xs font-black shadow-xs">
                    {citizenUser.name?.charAt(0) || 'না'}
                  </div>
                  <div className="text-left">
                    <p className="max-w-[120px] truncate leading-tight font-black">{citizenUser.name}</p>
                    <p className="text-[10px] text-orange-600 font-mono font-medium">+91 {citizenUser.phone}</p>
                  </div>
                </button>
                <button
                  onClick={onLogoutCitizen}
                  title="নাগরিক একাউন্ট থেকে লগআউট করুন"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer ml-1"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              /* CITIZEN LOGIN / OTP BUTTON (GUEST MODE) */
              !isAdminLoggedIn && (
                <button
                  onClick={onOpenCitizenAuth}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-orange-900 bg-orange-100/80 hover:bg-orange-200/80 border border-orange-300 transition-all cursor-pointer shadow-2xs"
                >
                  <Phone className="w-3.5 h-3.5 text-orange-600" />
                  <span>নাগরিক লগইন / ওটিপি</span>
                </button>
              )
            )}

            {/* -------------------------------------------------------- */}
            {/* ADMIN PORTAL BUTTON (IF LOGGED IN OR PUBLIC)             */}
            {/* -------------------------------------------------------- */}
            {adminUser ? (
              <div className="flex items-center gap-1.5 ml-1">
                <button
                  onClick={() => handleNav('admin')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'admin'
                      ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-600/25 ring-2 ring-orange-300'
                      : 'bg-orange-100 text-orange-950 border border-orange-300 hover:bg-orange-200'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-white" />
                  <span>বিধায়ক ডেস্ক (MLA Portal)</span>
                </button>
                <button
                  onClick={onLogoutAdmin}
                  title="প্রশাসনিক লগআউট"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => handleNav('admin')}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>বিধায়ক অফিস</span>
              </button>
            )}
          </nav>

          {/* Mobile menu trigger */}
          <div className="lg:hidden flex items-center gap-2">
            {!citizenUser && !adminUser && (
              <button
                onClick={onOpenCitizenAuth}
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-600 text-white flex items-center gap-1 cursor-pointer shadow-xs"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>লগইন</span>
              </button>
            )}

            {citizenUser && (
              <button
                onClick={() => handleNav('my-complaints')}
                className="w-8 h-8 rounded-full bg-orange-500 text-white font-black text-xs flex items-center justify-center"
              >
                {citizenUser.name?.charAt(0) || 'না'}
              </button>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-hidden cursor-pointer"
              aria-label="Toggle Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-orange-200 space-y-2">
            {citizenUser && (
              <div className="bg-orange-50 p-3 rounded-2xl border border-orange-200 flex justify-between items-center text-xs mb-2">
                <div>
                  <p className="font-bold text-orange-950">{citizenUser.name}</p>
                  <p className="text-[11px] text-orange-700 font-mono">+91 {citizenUser.phone}</p>
                  <p className="text-[10px] text-emerald-700 font-semibold">৭ দিনের সেশন সক্রিয়</p>
                </div>
                <button
                  onClick={() => {
                    onLogoutCitizen();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-600 font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-rose-200"
                >
                  লগআউট
                </button>
              </div>
            )}

            {adminUser && (
              <div className="bg-amber-100 p-3 rounded-2xl border border-amber-300 flex justify-between items-center text-xs mb-2">
                <div>
                  <p className="font-black text-orange-950">শ্রী প্রশান্ত দিগর কার্যালয় (MLA)</p>
                  <p className="text-[10px] text-orange-800 font-semibold">প্রশাসনিক কন্ট্রোল ডেস্ক</p>
                </div>
                <button
                  onClick={() => {
                    onLogoutAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="text-rose-600 font-bold text-xs bg-white px-2.5 py-1 rounded-lg border border-rose-200"
                >
                  লগআউট
                </button>
              </div>
            )}

            <button
              onClick={() => handleNav('home')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'home' ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>হোম / Home</span>
            </button>

            {!adminUser && (
              <button
                onClick={() => {
                  if (!citizenUser) {
                    setMobileMenuOpen(false);
                    onOpenCitizenAuth();
                  } else {
                    handleNav('complaint');
                  }
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'complaint' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-800'
                }`}
              >
                <FileText className="w-4 h-4" />
                <span>অভিযোগ দায়ের / New Ticket</span>
              </button>
            )}

            {citizenUser ? (
              <button
                onClick={() => handleNav('my-complaints')}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'my-complaints' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-900'
                }`}
              >
                <FolderClock className="w-4 h-4" />
                <span>আমার অভিযোগসমূহ (My Tickets)</span>
              </button>
            ) : (
              !adminUser && (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenCitizenAuth();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-50 text-orange-800 border border-orange-200"
                >
                  <Phone className="w-4 h-4" />
                  <span>নাগরিক লগইন / ওটিপি (Citizen OTP)</span>
                </button>
              )
            )}

            <button
              onClick={() => handleNav('track')}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-bold ${
                activeTab === 'track' ? 'bg-orange-50 text-orange-700' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>স্থিতি সন্ধান / Track Ticket</span>
            </button>

            <div className="pt-2 border-t border-slate-100">
              <button
                onClick={() => handleNav('admin')}
                className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-xs font-bold ${
                  activeTab === 'admin' ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-800'
                }`}
              >
                <span className="flex items-center gap-3">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{adminUser ? 'বিধায়ক ড্যাশবোর্ড (Goghat MLA Portal)' : 'বিধায়ক অফিস লগইন'}</span>
                </span>
                {adminUser && (
                  <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">
                    Active
                  </span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
