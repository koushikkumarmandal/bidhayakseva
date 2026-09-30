import React, { useState, useEffect } from 'react';
import { 
  Phone, 
  KeyRound, 
  User, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle, 
  X, 
  Loader2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Clock,
  ArrowLeft,
  CalendarCheck
} from 'lucide-react';
import { api } from '../services/api';
import { GOGHAT_GRAM_PANCHAYATS, GOGHAT_VILLAGES, getVillagesByPanchayat } from '../data/goghatData';

export default function CitizenAuthModal({ isOpen, onClose, onAuthSuccess }) {
  // Modes: 'login' | 'register' | 'forgot'
  const [mode, setMode] = useState('login');
  
  // Login fields
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Register fields (Goghat AC 201)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regWard, setRegWard] = useState(GOGHAT_GRAM_PANCHAYATS[0] || 'Bali');
  const [regVillage, setRegVillage] = useState(() => {
    const list = getVillagesByPanchayat(GOGHAT_GRAM_PANCHAYATS[0] || 'Bali');
    return list[0] || 'Bali';
  });
  const [regVoterId, setRegVoterId] = useState('');
  const [regAadhaar, setRegAadhaar] = useState('');

  // Forgot Password fields
  const [forgotStep, setForgotStep] = useState('phone'); // 'phone' | 'otp'
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');
  const [receivedOtp, setReceivedOtp] = useState('');
  const [twilioSent, setTwilioSent] = useState(false);
  const [twilioNote, setTwilioNote] = useState('');
  const [serviceSid, setServiceSid] = useState('VA19dcbc304edf9eca50f0a7ad504dd260');
  const [countdown, setCountdown] = useState(60);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [rateLimitInfo, setRateLimitInfo] = useState(null);

  const wardOptions = GOGHAT_GRAM_PANCHAYATS;

  useEffect(() => {
    let timer;
    if (mode === 'forgot' && forgotStep === 'otp' && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [mode, forgotStep, countdown]);

  if (!isOpen) return null;

  const resetAllAlerts = () => {
    setErrorMsg('');
    setSuccessMsg('');
    setRateLimitInfo(null);
  };

  // 1. Handle Regular Login
  const handleLogin = async (e) => {
    e.preventDefault();
    const phone = loginPhone.trim();
    const password = loginPassword.trim();

    if (!phone || phone.length !== 10) {
      setErrorMsg('সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন (10-digit mobile number required).');
      return;
    }
    if (!password) {
      setErrorMsg('দয়া করে আপনার পাসওয়ার্ড লিখুন।');
      return;
    }

    setLoading(true);
    resetAllAlerts();

    try {
      const res = await api.citizenLogin(phone, password);
      if (res.success) {
        onAuthSuccess({
          citizen: res.citizen,
          token: res.token,
          sessionExpiresAt: res.sessionExpiresAt
        });
        onClose();
      } else {
        setErrorMsg(res.message || 'লগইন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ ব্যর্থ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 2. Handle Registration (Mandatory Voter ID, 12-digit Aadhaar, Goghat GP & Village)
  const handleRegister = async (e) => {
    e.preventDefault();
    const phone = regPhone.trim();
    const password = regPassword.trim();
    const name = regName.trim();
    const address = regAddress.trim();
    const village = regVillage.trim();
    const voterId = regVoterId.trim().toUpperCase();
    const aadhaar = regAadhaar.trim().replace(/\s/g, '');

    if (!phone || phone.length !== 10) {
      setErrorMsg('সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন।');
      return;
    }
    if (!password || password.length < 4) {
      setErrorMsg('পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে (Minimum 4 characters).');
      return;
    }
    if (!name || !address) {
      setErrorMsg('আপনার পূর্ণ নাম এবং স্থায়ী ঠিকানা দেওয়া আবশ্যক।');
      return;
    }
    if (!village) {
      setErrorMsg('দয়া করে গোগঘাট বিধানসভার অন্তর্গত আপনার গ্রাম বা এলাকার নাম নির্বাচন অথবা টাইপ করুন।');
      return;
    }
    if (!voterId) {
      setErrorMsg('ভোটার কার্ড নম্বর (Voter EPIC Number) দেওয়া বাধ্যতামূলক।');
      return;
    }
    if (!/^\d{12}$/.test(aadhaar)) {
      setErrorMsg('সঠিক ১২-সংখ্যার আধার কার্ড নম্বর দেওয়া বাধ্যতামূলক (Exactly 12-digit Aadhaar number is mandatory).');
      return;
    }

    setLoading(true);
    resetAllAlerts();

    try {
      const res = await api.citizenRegister({
        phone,
        password,
        name,
        address,
        wardOrPanchayat: regWard,
        villageOrArea: village,
        voterId,
        aadhaar
      });

      if (res.success) {
        onAuthSuccess({
          citizen: res.citizen,
          token: res.token,
          sessionExpiresAt: res.sessionExpiresAt
        });
        onClose();
      } else {
        setErrorMsg(res.message || 'রেজিস্ট্রেশন ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ ব্যর্থ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 3. Handle Forgot Password - Send OTP via Twilio Verify
  const handleForgotSendOtp = async (e) => {
    if (e) e.preventDefault();
    const phone = forgotPhone.trim();

    if (!phone || phone.length !== 10) {
      setErrorMsg('সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন।');
      return;
    }

    setLoading(true);
    resetAllAlerts();

    try {
      const res = await api.citizenForgotPasswordSendOtp(phone);
      if (res.success) {
        setForgotStep('otp');
        setReceivedOtp(res.otp || '');
        setTwilioSent(!!res.twilioSent);
        setTwilioNote(res.twilioNote || '');
        if (res.serviceSid) setServiceSid(res.serviceSid);
        setCountdown(60);
        setSuccessMsg(res.message);
      } else {
        if (res.rateLimited) {
          setRateLimitInfo({ hoursLeft: res.hoursLeft });
        }
        setErrorMsg(res.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ ব্যর্থ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 4. Handle Forgot Password - Reset Password
  const handleForgotResetPassword = async (e) => {
    e.preventDefault();
    const phone = forgotPhone.trim();
    const otp = forgotOtp.trim();
    const newPass = forgotNewPassword.trim();
    const confirmPass = forgotConfirmPassword.trim();

    if (!otp) {
      setErrorMsg('দয়া করে প্রাপ্ত ওটিপি লিখুন।');
      return;
    }
    if (!newPass || newPass.length < 4) {
      setErrorMsg('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (newPass !== confirmPass) {
      setErrorMsg('উভয় পাসওয়ার্ড একই হতে হবে (Passwords do not match).');
      return;
    }

    setLoading(true);
    resetAllAlerts();

    try {
      const res = await api.citizenForgotPasswordReset({
        phone,
        otp,
        newPassword: newPass
      });

      if (res.success) {
        setSuccessMsg('✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
        setLoginPhone(phone);
        setLoginPassword(newPass);
        setTimeout(() => {
          setMode('login');
          setForgotStep('phone');
          setForgotOtp('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
        }, 1200);
      } else {
        if (res.rateLimited) {
          setRateLimitInfo({ hoursLeft: res.hoursLeft });
        }
        setErrorMsg(res.message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ ব্যর্থ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Auto-fill for testing
  const handleUseDemo = (phone, pass = 'citizen123') => {
    setLoginPhone(phone);
    setLoginPassword(pass);
    resetAllAlerts();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-5 text-white flex justify-between items-center relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-radial from-amber-400/20 to-transparent pointer-events-none" />
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-amber-300 font-bold border border-white/20">
              {mode === 'forgot' ? <KeyRound className="w-5 h-5 text-amber-300" /> : <Lock className="w-5 h-5 text-emerald-300" />}
            </div>
            <div>
              <h3 className="font-black text-base tracking-tight text-white flex items-center gap-1.5">
                <span>
                  {mode === 'login' && 'নাগরিক লগইন (Citizen Login)'}
                  {mode === 'register' && 'নতুন নাগরিক রেজিস্ট্রেশন'}
                  {mode === 'forgot' && 'পাসওয়ার্ড রিসেট (Twilio OTP)'}
                </span>
              </h3>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                গোগঘাট বিধানসভা কেন্দ্র (AC 201) • বিধায়ক সেবা কেন্দ্র
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Error Banner */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-semibold">{errorMsg}</span>
              {rateLimitInfo && (
                <div className="text-[11px] text-rose-700 bg-rose-100/70 p-1.5 rounded-lg flex items-center gap-1.5 mt-1 font-mono font-bold">
                  <Clock className="w-3.5 h-3.5 text-rose-600" />
                  <span>অবশিষ্ট সময়: প্রায় {rateLimitInfo.hoursLeft} ঘণ্টা পর পুনরায় রিসেট করা যাবে।</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Global Success Banner */}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2 animate-in fade-in duration-150">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-semibold">{successMsg}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          
          {/* ======================================================== */}
          {/* MODE 1: LOGIN (Phone + Password) */}
          {/* ======================================================== */}
          {mode === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="text-xs text-slate-500">
                আপনার ১০-সংখ্যার রেজিস্টার্ড মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে লগইন করুন।
              </div>

              {/* Phone Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  মোবাইল নম্বর (10-Digit Mobile) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-semibold">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9830XXXXXX"
                    required
                    className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono font-medium"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    পাসওয়ার্ড (Password) <span className="text-rose-600">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot');
                      setForgotPhone(loginPhone);
                      resetAllAlerts();
                    }}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    পাসওয়ার্ড ভুলে গেছেন?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-medium pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>যাচাই করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>লগইন করুন (Log In)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Switch to Register */}
              <div className="pt-2 text-center text-xs text-slate-600">
                নতুন নাগরিক?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setRegPhone(loginPhone);
                    resetAllAlerts();
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  নতুন অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>

              {/* Quick Demo Citizens */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <span className="text-[11px] text-slate-400 block font-semibold uppercase tracking-wider">
                  সহজ পরীক্ষার জন্য ডেমো নাগরিক:
                </span>
                <div className="grid grid-cols-3 gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleUseDemo('7001223834')}
                    className="p-1.5 text-left bg-emerald-50/70 hover:bg-emerald-100 hover:border-emerald-400 border border-emerald-300 rounded-xl transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-emerald-950 group-hover:text-emerald-800">কৌশিক মণ্ডল</p>
                    <p className="text-[10px] text-emerald-700 font-mono">7001223834</p>
                    <p className="text-[9px] text-emerald-800 font-mono">citizen123</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseDemo('9830123456')}
                    className="p-1.5 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">সুবীর কর্মকার</p>
                    <p className="text-[10px] text-slate-400 font-mono">9830123456</p>
                    <p className="text-[9px] text-emerald-700 font-mono">citizen123</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUseDemo('9123456780')}
                    className="p-1.5 text-left bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 rounded-xl transition-all cursor-pointer group"
                  >
                    <p className="text-xs font-bold text-slate-800 group-hover:text-emerald-800">রুমা মুখার্জী</p>
                    <p className="text-[10px] text-slate-400 font-mono">9123456780</p>
                    <p className="text-[9px] text-emerald-700 font-mono">citizen123</p>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODE 2: REGISTER (New Citizen) */}
          {/* ======================================================== */}
          {mode === 'register' && (
            <form onSubmit={handleRegister} className="space-y-3.5">
              <div className="text-xs text-slate-500">
                গোগঘাট বিধানসভা কেন্দ্রের নাগরিক হিসেবে আপনার বিবরণ দিন ও পাসওয়ার্ড সেট করুন।
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  পূর্ণ নাম (Full Name) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="যেমন: অনির্বাণ চক্রবর্তী"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    মোবাইল নম্বর <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="tel"
                    maxLength={10}
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="10-সংখ্যার নম্বর"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-mono font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    পাসওয়ার্ড তৈরি করুন <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="কমপক্ষে ৪ সংখ্যা"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ১. গ্রাম পঞ্চায়েত (Gram Panchayat) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={regWard}
                    onChange={(e) => {
                      const newGp = e.target.value;
                      setRegWard(newGp);
                      const availableVillages = getVillagesByPanchayat(newGp);
                      setRegVillage(availableVillages[0] || '');
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs bg-white font-semibold text-slate-800"
                  >
                    {wardOptions.map((w, idx) => (
                      <option key={idx} value={w}>{w} GP</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ২. পঞ্চায়েত অধীনস্থ গ্রাম (Village) <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={regVillage}
                    onChange={(e) => setRegVillage(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-xs bg-white font-semibold text-orange-950"
                  >
                    <option value="" disabled>গ্রাম নির্বাচন করুন...</option>
                    {getVillagesByPanchayat(regWard).map((v, idx) => (
                      <option key={idx} value={v}>{v}</option>
                    ))}
                  </select>
                  <span className="text-[10px] text-orange-700 font-medium block mt-0.5">
                    * {regWard} পঞ্চায়েতের গ্রামসমূহ ({getVillagesByPanchayat(regWard).length}টি গ্রাম)
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  স্থায়ী ঠিকানা (Complete Address) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={regAddress}
                  onChange={(e) => setRegAddress(e.target.value)}
                  placeholder="বাড়ি নং / পাড়া / রোড ও পূর্ণ ঠিকানা"
                  required
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ভোটার কার্ড নম্বর (Voter ID) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    value={regVoterId}
                    onChange={(e) => setRegVoterId(e.target.value.toUpperCase())}
                    placeholder="WB/29/201/XXXXXX"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs uppercase font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    ১২-সংখ্যার আধার নম্বর (Aadhaar) <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={12}
                    value={regAadhaar}
                    onChange={(e) => setRegAadhaar(e.target.value.replace(/\D/g, ''))}
                    placeholder="১২-সংখ্যার আধার নম্বর"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* 7-Day Session Security Note */}
              <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>
                  <strong>নিরাপদ সেশন:</strong> লগইন অবস্থায় আপনার অ্যাকাউন্ট এই ডিভাইসে ৭ দিন পর্যন্ত সক্রিয় থাকবে।
                </span>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ করা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-center text-xs text-slate-600 pt-1">
                ইতিমধ্যে অ্যাকাউন্ট আছে?{' '}
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    resetAllAlerts();
                  }}
                  className="font-bold text-emerald-700 hover:text-emerald-800 underline cursor-pointer"
                >
                  লগইন করুন
                </button>
              </div>
            </form>
          )}

          {/* ======================================================== */}
          {/* MODE 3: FORGOT PASSWORD (Twilio Verify OTP & Once-a-day) */}
          {/* ======================================================== */}
          {mode === 'forgot' && (
            <div className="space-y-4">
              {/* Back to Login link */}
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  resetAllAlerts();
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>লগইন পেজে ফিরে যান</span>
              </button>

              {/* STRICT RULE NOTICE BANNER */}
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-950">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <CalendarCheck className="w-4 h-4 text-amber-700" />
                  <span>সুরক্ষা নির্দেশিকা (Strict Security Policy):</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  সাইবার সুরক্ষা ও ওটিপি অপব্যবহার রোধে <strong>দিনে কেবল ১ বারই</strong> পাসওয়ার্ড পরিবর্তন করা যাবে।
                </p>
                <div className="text-[10px] text-amber-700 font-mono">
                  Twilio Verify Service SID: <strong className="text-emerald-800">{serviceSid}</strong>
                </div>
              </div>

              {/* FORGOT STEP 1: ENTER PHONE & SEND OTP */}
              {forgotStep === 'phone' ? (
                <form onSubmit={handleForgotSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      রেজিস্টার্ড মোবাইল নম্বর লিখুন <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm font-semibold">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        value={forgotPhone}
                        onChange={(e) => setForgotPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="10-সংখ্যার নম্বর"
                        required
                        className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                        <span>Twilio ওটিপি পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Twilio ওটিপি পাঠান (Send OTP)</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              ) : (
                /* FORGOT STEP 2: ENTER OTP & NEW PASSWORD */
                <form onSubmit={handleForgotResetPassword} className="space-y-4">
                  {/* Active Phone Notice */}
                  <div className="flex justify-between items-center bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400 font-medium">মোবাইল:</span>
                      <strong className="text-slate-900 font-mono">+91 {forgotPhone}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForgotStep('phone')}
                      className="text-emerald-700 hover:text-emerald-800 font-bold text-[11px] underline cursor-pointer"
                    >
                      নম্বর বদল
                    </button>
                  </div>

                  {/* Twilio SMS Notice / Auto-Fill helper */}
                  {twilioSent ? (
                    <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-3.5 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between font-bold text-emerald-950">
                        <span className="flex items-center gap-1.5">
                          <ShieldCheck className="w-4 h-4 text-emerald-700" />
                          <span>Twilio Verify লাইভ SMS পাঠানো হয়েছে</span>
                        </span>
                        <span className="bg-emerald-200 text-[10px] px-2 py-0.5 rounded-full uppercase">SMS Sent</span>
                      </div>
                      <p className="text-[11px] text-emerald-900 leading-tight">
                        আপনার মোবাইলে Twilio থেকে প্রেরিত ৬-সংখ্যার কোডটি নিচের ঘরে লিখুন।
                      </p>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-amber-900 flex items-center gap-1.5">
                          <KeyRound className="w-3.5 h-3.5 text-amber-600" />
                          <span>Twilio Verify ওটিপি কোড</span>
                        </span>
                        <span className="text-[11px] text-amber-800 font-mono font-bold">
                          কোড: {receivedOtp || '123456'}
                        </span>
                      </div>
                      {twilioNote && (
                        <p className="text-[10px] text-amber-800 bg-amber-100/60 p-1.5 rounded-lg leading-tight">
                          💡 <strong>নোট:</strong> Twilio Trial অ্যাকাউন্টে শুধুমাত্র ভেরিফাইড নম্বরে SMS যায়। পরীক্ষার জন্য আপনি অটো-ফিল ব্যবহার করতে পারেন।
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={() => setForgotOtp(receivedOtp || '123456')}
                        className="w-full py-1.5 rounded-lg bg-amber-400/40 hover:bg-amber-400/60 text-amber-950 text-[11px] font-bold border border-amber-300 transition-colors cursor-pointer flex items-center justify-center gap-1"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                        <span>১ ক্লিকে ওটিপি বসান (Auto-Fill {receivedOtp || '123456'})</span>
                      </button>
                    </div>
                  )}

                  {/* OTP Input */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      ৬ সংখ্যার ওটিপি লিখুন <span className="text-rose-600">*</span>
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={forgotOtp}
                      onChange={(e) => setForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-center text-lg font-mono font-bold tracking-widest text-emerald-800"
                    />
                  </div>

                  {/* New Password & Confirm */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        নতুন পাসওয়ার্ড <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        value={forgotNewPassword}
                        onChange={(e) => setForgotNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৪ অক্ষর"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        নিশ্চিত করুন <span className="text-rose-600">*</span>
                      </label>
                      <input
                        type="password"
                        value={forgotConfirmPassword}
                        onChange={(e) => setForgotConfirmPassword(e.target.value)}
                        placeholder="একই পাসওয়ার্ড"
                        required
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>পাসওয়ার্ড আপডেট হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4" />
                        <span>পাসওয়ার্ড পরিবর্তন করুন</span>
                      </>
                    )}
                  </button>

                  <div className="text-center">
                    <button
                      type="button"
                      disabled={countdown > 0 || loading}
                      onClick={() => handleForgotSendOtp()}
                      className="text-[11px] font-bold text-slate-500 hover:text-emerald-700 cursor-pointer disabled:opacity-50"
                    >
                      {countdown > 0 ? `পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন (${countdown}s)` : 'পুনরায় ওটিপি পাঠান (Resend OTP)'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
