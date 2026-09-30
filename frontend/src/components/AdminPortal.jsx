import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Search, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  Download, 
  RefreshCw, 
  Lock, 
  LogOut, 
  Check, 
  X, 
  Loader2, 
  Building2, 
  User, 
  Phone, 
  MapPin, 
  Sparkles, 
  AlertTriangle,
  ChevronRight,
  Filter,
  Trash2,
  KeyRound,
  ArrowLeft,
  CalendarCheck,
  Edit3,
  Save,
  CreditCard
} from 'lucide-react';
import { api } from '../services/api';
import { GOGHAT_GRAM_PANCHAYATS, getVillagesByPanchayat } from '../data/goghatData';

export default function AdminPortal({ adminUser, onLogin, onLogout }) {
  // Login form state
  const [email, setEmail] = useState('mla@seva.gov.in');
  const [password, setPassword] = useState('admin123');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin Forgot Password state (Twilio OTP & Once-a-day rule)
  const [adminViewMode, setAdminViewMode] = useState('login'); // 'login' | 'forgot'
  const [adminForgotStep, setAdminForgotStep] = useState('identifier'); // 'identifier' | 'otp'
  const [adminForgotIdentifier, setAdminForgotIdentifier] = useState('mla@seva.gov.in');
  const [adminForgotOtp, setAdminForgotOtp] = useState('');
  const [adminForgotNewPassword, setAdminForgotNewPassword] = useState('');
  const [adminForgotConfirmPassword, setAdminForgotConfirmPassword] = useState('');
  const [adminForgotLoading, setAdminForgotLoading] = useState(false);
  const [adminForgotError, setAdminForgotError] = useState('');
  const [adminForgotSuccess, setAdminForgotSuccess] = useState('');
  const [adminRateLimitInfo, setAdminRateLimitInfo] = useState(null);
  const [adminReceivedOtp, setAdminReceivedOtp] = useState('');
  const [adminTwilioSent, setAdminTwilioSent] = useState(false);
  const [adminMaskedPhone, setAdminMaskedPhone] = useState('');
  const [adminCountdown, setAdminCountdown] = useState(60);

  // Dashboard & Tickets State
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    approved: 0,
    rejected: 0,
    urgentCount: 0
  });
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters & Search
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [gpFilter, setGpFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedTicket, setSelectedTicket] = useState(null); // Full Dossier
  const [actionModal, setActionModal] = useState(null); // { ticket, targetStatus }
  const [actionRemarks, setActionRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [assignedDept, setAssignedDept] = useState('');
  const [updating, setUpdating] = useState(false);
  const [toastMsg, setToastMsg] = useState('');
  const [deleteConfirmTicket, setDeleteConfirmTicket] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Full Edit Modal State ("Everything is editable")
  const [editTicket, setEditTicket] = useState(null);
  const [editFormData, setEditFormData] = useState({
    citizen: {
      name: '',
      phone: '',
      email: '',
      address: '',
      voterId: '',
      aadhaar: ''
    },
    placeDetails: {
      wardOrPanchayat: '',
      villageOrArea: '',
      landmark: '',
      pinCode: '712614'
    },
    problemType: 'Roads & Infrastructure',
    subject: '',
    description: '',
    reliefNeeded: '',
    priority: 'Normal',
    status: 'Pending',
    assignedDepartment: 'Goghat MLA Grievance Cell',
    adminRemarks: '',
    rejectionReason: ''
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [availableVillagesForEdit, setAvailableVillagesForEdit] = useState([]);
  const [customVillageInEdit, setCustomVillageInEdit] = useState(false);

  useEffect(() => {
    if (adminUser) {
      loadData();
    }
  }, [adminUser, statusFilter, categoryFilter, gpFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.getAdminStats();
      if (statsRes.success) {
        setStats(statsRes.stats);
      }

      const complaintsRes = await api.getComplaints({
        status: statusFilter,
        problemType: categoryFilter,
        ward: gpFilter,
        q: searchQuery
      });

      if (complaintsRes.success) {
        setComplaints(complaintsRes.data);
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadData();
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await api.adminLogin(email, password);
      if (res.success) {
        onLogin(res.admin);
      } else {
        setLoginError(res.message || 'ভুল ইউজারনেম বা পাসওয়ার্ড।');
      }
    } catch (err) {
      setLoginError('সার্ভার সংযোগে ত্রুটি: ' + err.message);
    } finally {
      setLoggingIn(false);
    }
  };

  useEffect(() => {
    let timer;
    if (adminViewMode === 'forgot' && adminForgotStep === 'otp' && adminCountdown > 0) {
      timer = setInterval(() => setAdminCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [adminViewMode, adminForgotStep, adminCountdown]);

  const handleAdminForgotSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!adminForgotIdentifier.trim()) {
      setAdminForgotError('মাননীয় বিধায়কের রেজিস্টার্ড ইমেল অথবা মোবাইল নম্বর দিন।');
      return;
    }

    setAdminForgotLoading(true);
    setAdminForgotError('');
    setAdminForgotSuccess('');
    setAdminRateLimitInfo(null);

    try {
      const res = await api.adminForgotPasswordSendOtp(adminForgotIdentifier.trim());
      if (res.success) {
        setAdminForgotStep('otp');
        setAdminReceivedOtp(res.otp || '');
        setAdminTwilioSent(!!res.twilioSent);
        setAdminMaskedPhone(res.maskedPhone || '');
        setAdminCountdown(60);
        setAdminForgotSuccess(res.message);
      } else {
        if (res.rateLimited) {
          setAdminRateLimitInfo({ hoursLeft: res.hoursLeft });
        }
        setAdminForgotError(res.message || 'ওটিপি পাঠাতে সমস্যা হয়েছে।');
      }
    } catch (err) {
      setAdminForgotError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setAdminForgotLoading(false);
    }
  };

  const handleAdminForgotReset = async (e) => {
    e.preventDefault();
    if (!adminForgotOtp.trim()) {
      setAdminForgotError('দয়া করে প্রাপ্ত ওটিপি কোডটি লিখুন।');
      return;
    }
    if (!adminForgotNewPassword.trim() || adminForgotNewPassword.trim().length < 4) {
      setAdminForgotError('নতুন পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।');
      return;
    }
    if (adminForgotNewPassword.trim() !== adminForgotConfirmPassword.trim()) {
      setAdminForgotError('উভয় পাসওয়ার্ড একই হতে হবে (Passwords do not match).');
      return;
    }

    setAdminForgotLoading(true);
    setAdminForgotError('');
    setAdminForgotSuccess('');
    setAdminRateLimitInfo(null);

    try {
      const res = await api.adminForgotPasswordReset({
        identifier: adminForgotIdentifier.trim(),
        otp: adminForgotOtp.trim(),
        newPassword: adminForgotNewPassword.trim()
      });

      if (res.success) {
        setAdminForgotSuccess('✅ পাসওয়ার্ড সফলভাবে পরিবর্তিত হয়েছে! এখন নতুন পাসওয়ার্ড দিয়ে লগইন করুন।');
        setPassword(adminForgotNewPassword.trim());
        setTimeout(() => {
          setAdminViewMode('login');
          setAdminForgotStep('identifier');
          setAdminForgotOtp('');
          setAdminForgotNewPassword('');
          setAdminForgotConfirmPassword('');
        }, 1500);
      } else {
        if (res.rateLimited) {
          setAdminRateLimitInfo({ hoursLeft: res.hoursLeft });
        }
        setAdminForgotError(res.message || 'পাসওয়ার্ড রিসেট ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      setAdminForgotError('সার্ভারে যোগাযোগ করতে ব্যর্থ হয়েছে: ' + err.message);
    } finally {
      setAdminForgotLoading(false);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4000);
  };

  const openActionModal = (ticket, targetStatus) => {
    setActionModal({ ticket, targetStatus });
    setRejectionReason(
      targetStatus === 'Rejected'
        ? 'বিধায়ক তহবিল নির্দেশিকা অনুযায়ী ব্যক্তিগত কাজের জন্য সরকারি তহবিল বরাদ্দ অনুমোদনযোগ্য নয়।'
        : ''
    );
    setActionRemarks(
      targetStatus === 'In Progress'
        ? 'বিধায়ক দপ্তর আবেদনটি পর্যালোচনা করে অবিলম্বে মাঠপর্যায়ে তদন্ত ও ব্যবস্থা গ্রহণের নির্দেশ জারি করেছে।'
        : targetStatus === 'Approved'
        ? 'মাননীয় বিধায়ক আবেদনটি অনুমোদন করেছেন। প্রয়োজনীয় অর্থ ও প্রশাসনিক অনুমোদন মঞ্জুর করা হয়েছে।'
        : ''
    );
    setAssignedDept(ticket.assignedDepartment || 'Goghat MLA Grievance Cell');
  };

  const handleApplyStatus = async () => {
    if (!actionModal) return;
    setUpdating(true);
    try {
      const payload = {
        status: actionModal.targetStatus,
        adminRemarks: actionRemarks,
        rejectionReason: actionModal.targetStatus === 'Rejected' ? rejectionReason : '',
        assignedDepartment: assignedDept,
        priority: actionModal.ticket.priority
      };

      const res = await api.updateComplaintStatus(actionModal.ticket.ticketId, payload);
      if (res.success) {
        showToast(`টিকিট ${res.data.ticketId} স্ট্যাটাস "${actionModal.targetStatus}" করা হয়েছে`);
        setActionModal(null);
        setSelectedTicket(null);
        await loadData();
      } else {
        alert(res.message || 'স্ট্যাটাস আপডেট ব্যর্থ হয়েছে');
      }
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTicket) return;
    setDeleting(true);
    try {
      const res = await api.deleteComplaint(deleteConfirmTicket.ticketId);
      if (res.success) {
        showToast(`টিকিট ${deleteConfirmTicket.ticketId} ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হয়েছে!`);
        setDeleteConfirmTicket(null);
        setSelectedTicket(null);
        await loadData();
      } else {
        alert(res.message || 'ডিলিট করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      alert('ত্রুটি: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      const res = await api.exportComplaints();
      if (res.success && res.data) {
        const headers = ['Ticket ID', 'Status', 'Citizen Name', 'Phone', 'Voter ID', 'Aadhaar (Full 12 Digits)', 'Gram Panchayat', 'Village', 'Category', 'Subject', 'Relief Needed', 'Date'];
        const rows = [headers.join(',')];
        res.data.forEach(item => {
          rows.push([
            `"${item.ticketId}"`,
            `"${item.status}"`,
            `"${item.citizen?.name?.replace(/"/g, '""')}"`,
            `"${item.citizen?.phone}"`,
            `"${item.citizen?.voterId || ''}"`,
            `"${item.citizen?.aadhaar || (item.citizen?.aadhaarLast4 ? 'XXXX-XXXX-' + item.citizen.aadhaarLast4 : '')}"`,
            `"${item.placeDetails?.wardOrPanchayat}"`,
            `"${item.placeDetails?.villageOrArea}"`,
            `"${item.problemType}"`,
            `"${item.subject?.replace(/"/g, '""')}"`,
            `"${item.reliefNeeded?.replace(/"/g, '""')}"`,
            `"${new Date(item.submittedAt || item.createdAt).toLocaleDateString('en-IN')}"`
          ].join(','));
        });
        const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Goghat_MLA_Tickets_Full_${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
      }
    } catch (e) {
      alert('এক্সপোর্ট ত্রুটি: ' + e.message);
    }
  };

  // -------------------------------------------------------------
  // FULL EDIT COMPLAINT HANDLERS ("everything is editable")
  // -------------------------------------------------------------
  const openEditModal = (item) => {
    const currentGP = item.placeDetails?.wardOrPanchayat || GOGHAT_GRAM_PANCHAYATS[0];
    const villages = getVillagesByPanchayat(currentGP);
    setAvailableVillagesForEdit(villages);

    const currentVillage = item.placeDetails?.villageOrArea || (villages[0] || '');
    const isCustom = !villages.includes(currentVillage);
    setCustomVillageInEdit(isCustom);

    setEditTicket(item);
    setEditFormData({
      citizen: {
        name: item.citizen?.name || '',
        phone: item.citizen?.phone || '',
        email: item.citizen?.email || '',
        address: item.citizen?.address || '',
        voterId: item.citizen?.voterId || '',
        aadhaar: item.citizen?.aadhaar || (item.citizen?.aadhaarLast4 || '')
      },
      placeDetails: {
        wardOrPanchayat: currentGP,
        villageOrArea: currentVillage,
        landmark: item.placeDetails?.landmark || '',
        pinCode: item.placeDetails?.pinCode || '712614'
      },
      problemType: item.problemType || 'Roads & Infrastructure',
      subject: item.subject || '',
      description: item.description || '',
      reliefNeeded: item.reliefNeeded || '',
      priority: item.priority || 'Normal',
      status: item.status || 'Pending',
      assignedDepartment: item.assignedDepartment || 'Goghat MLA Grievance Cell',
      adminRemarks: item.adminRemarks || '',
      rejectionReason: item.rejectionReason || ''
    });
  };

  const handlePanchayatChangeInEdit = (gpName) => {
    const villages = getVillagesByPanchayat(gpName);
    setAvailableVillagesForEdit(villages);
    setCustomVillageInEdit(false);
    setEditFormData(prev => ({
      ...prev,
      placeDetails: {
        ...prev.placeDetails,
        wardOrPanchayat: gpName,
        villageOrArea: villages.length > 0 ? villages[0] : ''
      }
    }));
  };

  const handleSaveFullEdit = async (e) => {
    e.preventDefault();
    if (!editTicket) return;

    if (!editFormData.subject.trim() || !editFormData.description.trim()) {
      alert('অভিযোগের বিষয় ও বিবরণ আবশ্যক।');
      return;
    }

    setEditSubmitting(true);
    try {
      const targetId = editTicket._id || editTicket.ticketId;
      const res = await api.updateComplaintFull(targetId, editFormData);
      if (res.success) {
        showToast(`টিকিট ${editTicket.ticketId} সফলভাবে সম্পাদিত ও আপডেট করা হয়েছে!`);
        setEditTicket(null);
        await loadData();
        if (selectedTicket && (selectedTicket._id === targetId || selectedTicket.ticketId === targetId)) {
          setSelectedTicket(res.data || { ...selectedTicket, ...editFormData });
        }
      } else {
        alert(res.message || 'সম্পাদনা সংরক্ষণ ব্যর্থ হয়েছে।');
      }
    } catch (err) {
      alert('সার্ভার ত্রুটি: ' + err.message);
    } finally {
      setEditSubmitting(false);
    }
  };

  // -------------------------------------------------------------
  // ADMIN LOGIN & FORGOT PASSWORD VIEW
  // -------------------------------------------------------------
  if (!adminUser) {
    return (
      <div className="max-w-md mx-auto my-12 animate-in fade-in zoom-in-95">
        <div className="bg-white rounded-3xl border border-orange-200 shadow-xl p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-orange-600 text-white mx-auto flex items-center justify-center shadow-md shadow-orange-500/20">
              {adminViewMode === 'forgot' ? (
                <KeyRound className="w-8 h-8 text-white" />
              ) : (
                <ShieldCheck className="w-8 h-8 text-white" />
              )}
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-[11px] font-extrabold uppercase tracking-wider">
              BJP • গোগঘাট বিধানসভা (AC 201)
            </div>
            <h2 className="text-2xl font-black text-slate-900">
              {adminViewMode === 'forgot' ? 'বিধায়ক পাসওয়ার্ড রিসেট' : 'মাননীয় বিধায়ক অফিস কন্ট্রোল'}
            </h2>
            <p className="text-xs text-slate-600 font-medium">
              শ্রী প্রশান্ত দিগর (বিধায়ক) • কেন্দ্রীয় অভিযোগ নিয়ন্ত্রণ ডেস্ক
            </p>
          </div>

          {/* ======================================================= */}
          {/* VIEW 1: REGULAR ADMIN LOGIN */}
          {/* ======================================================= */}
          {adminViewMode === 'login' ? (
            <>
              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    প্রশাসনিক ইমেল বা মোবাইল (Email or Phone)
                  </label>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-bold text-slate-700 uppercase">
                      পাসওয়ার্ড (Password)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setAdminViewMode('forgot');
                        setAdminForgotError('');
                        setAdminForgotSuccess('');
                        setAdminRateLimitInfo(null);
                      }}
                      className="text-[11px] font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
                    >
                      পাসওয়ার্ড ভুলে গেছেন?
                    </button>
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loggingIn}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white font-bold text-sm shadow-md shadow-orange-600/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {loggingIn ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>লগইন হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>প্রশাসনিক পোর্টালে প্রবেশ করুন</span>
                    </>
                  )}
                </button>
              </form>

              {/* Quick 1-Click Demo Fill */}
              <div className="pt-4 border-t border-slate-100 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setEmail('mla@seva.gov.in');
                    setPassword('admin123');
                  }}
                  className="text-xs font-bold text-orange-700 hover:text-orange-800 inline-flex items-center gap-1 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>১ ক্লিকে ডেমো বসান (mla@seva.gov.in / admin123)</span>
                </button>
              </div>
            </>
          ) : (
            /* ======================================================= */
            /* VIEW 2: ADMIN FORGOT PASSWORD (Twilio OTP & Once-a-day) */
            /* ======================================================= */
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => {
                  setAdminViewMode('login');
                  setAdminForgotError('');
                  setAdminForgotSuccess('');
                }}
                className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>লগইন পেজে ফিরে যান</span>
              </button>

              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-1.5 text-xs text-amber-950">
                <div className="flex items-center gap-1.5 font-bold text-amber-900">
                  <CalendarCheck className="w-4 h-4 text-amber-700" />
                  <span>প্রশাসনিক নিরাপত্তা নীতি (Admin Security Policy):</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed font-medium">
                  সাইবার সুরক্ষা ও অননুমোদিত অ্যাক্সেস রোধে <strong>দিনে কেবল ১ বারই</strong> বিধায়ক পাসওয়ার্ড রিসেট সম্ভব।
                </p>
                <div className="text-[10px] text-amber-700 font-mono">
                  Twilio Verify Service: <strong className="text-orange-800">VA19dcbc304edf9eca50f0a7ad504dd260</strong>
                </div>
              </div>

              {adminForgotError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-semibold">{adminForgotError}</span>
                    {adminRateLimitInfo && (
                      <div className="text-[11px] text-rose-700 bg-rose-100 p-1 rounded font-mono font-bold">
                        ⏳ প্রায় {adminRateLimitInfo.hoursLeft} ঘণ্টা পর পুনরায় রিসেট করা যাবে।
                      </div>
                    )}
                  </div>
                </div>
              )}

              {adminForgotSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                  <span className="font-semibold">{adminForgotSuccess}</span>
                </div>
              )}

              {adminForgotStep === 'identifier' ? (
                <form onSubmit={handleAdminForgotSendOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      রেজিস্টার্ড ইমেল অথবা মোবাইল নম্বর
                    </label>
                    <input
                      type="text"
                      value={adminForgotIdentifier}
                      onChange={(e) => setAdminForgotIdentifier(e.target.value)}
                      placeholder="mla@seva.gov.in অথবা 9830XXXXXX"
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={adminForgotLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {adminForgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>Twilio ওটিপি পাঠানো হচ্ছে...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Twilio ওটিপি পাঠান (Send OTP)</span>
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <form onSubmit={handleAdminForgotReset} className="space-y-4">
                  <div className="bg-slate-50 px-3 py-2 rounded-xl border border-slate-200 text-xs flex justify-between items-center">
                    <div>
                      <span className="text-slate-400">প্রেরিত নম্বর: </span>
                      <strong className="text-slate-800 font-mono">+91 {adminMaskedPhone || '******3456'}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminForgotStep('identifier')}
                      className="text-orange-600 font-bold text-[11px] underline"
                    >
                      পরিবর্তন
                    </button>
                  </div>

                  {!adminTwilioSent && (
                    <div className="bg-amber-50 border border-amber-300 rounded-xl p-2.5 text-xs flex justify-between items-center">
                      <span className="text-amber-800 font-mono">কোড: <strong>{adminReceivedOtp || '123456'}</strong></span>
                      <button
                        type="button"
                        onClick={() => setAdminForgotOtp(adminReceivedOtp || '123456')}
                        className="px-2 py-1 rounded bg-amber-400/50 hover:bg-amber-400 text-amber-950 text-[10px] font-bold border border-amber-300"
                      >
                        ১ ক্লিকে বসান
                      </button>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      ৬ সংখ্যার ওটিপি কোড (OTP)
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      value={adminForgotOtp}
                      onChange={(e) => setAdminForgotOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXXXX"
                      required
                      className="w-full px-4 py-2 rounded-xl border border-slate-300 text-center text-lg font-mono font-bold tracking-widest text-orange-600"
                    />
                  </div>

                  <div className="space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        নতুন পাসওয়ার্ড (New Password)
                      </label>
                      <input
                        type="password"
                        value={adminForgotNewPassword}
                        onChange={(e) => setAdminForgotNewPassword(e.target.value)}
                        placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        নিশ্চিত করুন (Confirm Password)
                      </label>
                      <input
                        type="password"
                        value={adminForgotConfirmPassword}
                        onChange={(e) => setAdminForgotConfirmPassword(e.target.value)}
                        placeholder="একই পাসওয়ার্ড লিখুন"
                        required
                        className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-medium"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={adminForgotLoading}
                    className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {adminForgotLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>রিসেট হচ্ছে...</span>
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
                      disabled={adminCountdown > 0 || adminForgotLoading}
                      onClick={() => handleAdminForgotSendOtp()}
                      className="text-[11px] font-bold text-slate-500 hover:text-orange-600 cursor-pointer disabled:opacity-50"
                    >
                      {adminCountdown > 0 ? `পুনরায় ওটিপি পাঠাতে অপেক্ষা করুন (${adminCountdown}s)` : 'পুনরায় ওটিপি পাঠান'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // LOGGED-IN ADMIN DASHBOARD - BJP SAFFRON STYLED & POWERFUL
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-200">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 border border-orange-500/50 animate-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold">{toastMsg}</span>
        </div>
      )}

      {/* Header Bar - BJP Kesari Theme */}
      <div className="bg-gradient-to-r from-orange-600 via-amber-600 to-orange-700 rounded-3xl p-6 text-white shadow-lg shadow-orange-600/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-orange-100">
              BJP • ২০১ গোগঘাট বিধানসভা • মাননীয় বিধায়ক কার্যালয়
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-1 text-white">
            শ্রী প্রশান্ত দিগর (বিধায়ক) • অভিযোগ ব্যবস্থাপনা ও কন্ট্রোল ডেস্ক
          </h1>
          <p className="text-xs text-orange-100 mt-0.5">
            সম্পূর্ণ প্রশাসনিক ক্ষমতা: স্ট্যাটাস পরিবর্তন, ডাটাবেস এডিট ও সম্পূর্ণ আধার কার্ড প্রদর্শন
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition-colors cursor-pointer backdrop-blur border border-white/20"
          >
            <Download className="w-4 h-4" />
            <span>CSV পূর্ণ রিপোর্ট</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer border border-white/20"
            title="রিফ্রেশ"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>লগআউট</span>
          </button>
        </div>
      </div>

      {/* Simple 5 Clean Metric Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'all'
              ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-orange-400'
              : 'bg-white text-slate-800 border-slate-200 hover:border-slate-300'
          }`}
        >
          <span className="text-[11px] font-bold uppercase tracking-wider opacity-70 block">মোট প্রাপ্ত অভিযোগ</span>
          <p className="text-2xl font-black mt-1">{stats.total || 0}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('Pending')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Pending'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md ring-2 ring-amber-300'
              : 'bg-amber-50/70 text-amber-900 border-amber-200 hover:border-amber-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider block">নতুন পর্যালোচনা</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black mt-1">{stats.pending || 0}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('In Progress')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'In Progress'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-300'
              : 'bg-blue-50/70 text-blue-900 border-blue-200 hover:border-blue-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider block">প্রক্রিয়াধীন</span>
            <Clock className="w-4 h-4 text-blue-500 animate-spin" />
          </div>
          <p className="text-2xl font-black mt-1">{stats.inProgress || 0}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('Approved')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            statusFilter === 'Approved'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-300'
              : 'bg-emerald-50/70 text-emerald-900 border-emerald-200 hover:border-emerald-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider block">অনুমোদিত</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-black mt-1">{stats.approved || 0}</p>
        </div>

        <div 
          onClick={() => setStatusFilter('Rejected')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer col-span-2 sm:col-span-1 ${
            statusFilter === 'Rejected'
              ? 'bg-rose-600 text-white border-rose-600 shadow-md ring-2 ring-rose-300'
              : 'bg-rose-50/70 text-rose-900 border-rose-200 hover:border-rose-300'
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-[11px] font-bold uppercase tracking-wider block">প্রত্যাখ্যাত</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black mt-1">{stats.rejected || 0}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-center justify-between">
          {/* Search box */}
          <form onSubmit={handleSearch} className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="টিকিট আইডি, নাগরিকের নাম, ফোন, আধার, বিষয়..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            />
          </form>

          {/* Gram Panchayat Filter */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={gpFilter}
              onChange={(e) => setGpFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">১৬টি গ্রাম পঞ্চায়েত (All GPs)</option>
              {GOGHAT_GRAM_PANCHAYATS.map((gp, i) => (
                <option key={i} value={gp}>{gp} GP</option>
              ))}
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700 focus:ring-2 focus:ring-orange-500"
            >
              <option value="all">সমস্ত বিষয়শ্রেণী (All Categories)</option>
              <option value="Roads & Infrastructure">রাস্তা ও পরিকাঠামো</option>
              <option value="Drinking Water Supply">বিশুদ্ধ পানীয় জল (PHE)</option>
              <option value="Electricity & Streetlights">বিদ্যুৎ ও আলো</option>
              <option value="Drainage & Sanitation">নিকাশি ও ড্রেনেজ</option>
              <option value="Healthcare & Hospitals">স্বাস্থ্য ও হাসপাতাল</option>
              <option value="Agriculture & Irrigation">কৃষি ও সেচ</option>
              <option value="Other Public Grievance">অন্যান্য অভিযোগ</option>
            </select>
          </div>
        </div>

        {/* Status Tab Filter Pills */}
        <div className="flex flex-wrap gap-2 pt-1 border-t border-slate-100">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'all' ? 'bg-orange-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            সব টিকিট ({stats.total || 0})
          </button>
          <button
            onClick={() => setStatusFilter('Pending')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Pending' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}
          >
            পর্যালোচনাধীন ({stats.pending || 0})
          </button>
          <button
            onClick={() => setStatusFilter('In Progress')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'In Progress' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-800 border border-blue-200'
            }`}
          >
            প্রক্রিয়াধীন ({stats.inProgress || 0})
          </button>
          <button
            onClick={() => setStatusFilter('Approved')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Approved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            অনুমোদিত ({stats.approved || 0})
          </button>
          <button
            onClick={() => setStatusFilter('Rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              statusFilter === 'Rejected' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}
          >
            প্রত্যাখ্যাত ({stats.rejected || 0})
          </button>
        </div>
      </div>

      {/* Clean Tickets Cards List */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex justify-between items-center text-xs font-bold text-slate-600 bg-slate-50/50">
          <span>তালিকাভুক্ত অভিযোগ ({complaints.length})</span>
          {loading && (
            <span className="flex items-center gap-1 text-slate-500 font-normal">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>লোড হচ্ছে...</span>
            </span>
          )}
        </div>

        {complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <p className="text-sm font-semibold">কোনো অভিযোগ পাওয়া যায়নি</p>
            <p className="text-xs">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((item) => (
              <div 
                key={item.ticketId}
                className="p-5 hover:bg-orange-50/20 transition-colors space-y-3.5"
              >
                {/* Top Row: Ticket ID, Status Badge, GP, Village, Date */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="text-sm font-black font-mono text-orange-950 bg-orange-100 px-2.5 py-1 rounded-lg border border-orange-300">
                      {item.ticketId}
                    </span>

                    {/* Status Pill */}
                    {item.status === 'Pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Pending
                      </span>
                    )}
                    {item.status === 'In Progress' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        In Progress
                      </span>
                    )}
                    {item.status === 'Approved' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Approved
                      </span>
                    )}
                    {item.status === 'Rejected' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
                        Rejected
                      </span>
                    )}

                    <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
                      GP: {item.placeDetails?.wardOrPanchayat}
                    </span>

                    {item.placeDetails?.villageOrArea && (
                      <span className="text-xs font-medium text-slate-600 bg-slate-100/70 px-2 py-0.5 rounded-md border border-slate-200">
                        গ্রাম: {item.placeDetails?.villageOrArea}
                      </span>
                    )}
                  </div>

                  <span className="text-xs text-slate-400">
                    {new Date(item.submittedAt || item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                {/* Citizen Info & Subject */}
                <div>
                  <h3 className="text-base font-bold text-slate-900">{item.subject}</h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span>নাগরিক: <strong className="text-slate-800">{item.citizen?.name}</strong></span>
                    <span>•</span>
                    <span>মোবাইল: <strong className="text-slate-800 font-mono">+91 {item.citizen?.phone}</strong></span>
                    <span>•</span>
                    <span>বিভাগ: <strong className="text-orange-700">{item.problemType}</strong></span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1.5 leading-relaxed">{item.description}</p>
                </div>

                {/* Citizen Aadhaar & Voter Card (Admin Full Visibility - Explicit User Requirement) */}
                <div className="bg-orange-50/80 border border-orange-200/90 rounded-xl p-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-orange-600 shrink-0" />
                    <span className="font-bold text-orange-950">সম্পূর্ণ আধার কার্ড নম্বর (Admin View): </span>
                    <span className="font-mono font-black text-sm text-orange-900 bg-white px-2 py-0.5 rounded border border-orange-300">
                      {item.citizen?.aadhaar 
                        ? item.citizen.aadhaar 
                        : (item.citizen?.aadhaarLast4 ? `XXXX-XXXX-${item.citizen.aadhaarLast4}` : 'আধার নেই')}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-700">ভোটার আইডি (EPIC): </span>
                    <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                      {item.citizen?.voterId || 'উল্লেখ নেই'}
                    </span>
                  </div>
                </div>

                {/* Highlighted Relief Demanded */}
                <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900">নাগরিকের প্রত্যাশিত সুরাহা (Relief Demanded): </span>
                  <span className="text-amber-950 font-medium">{item.reliefNeeded}</span>
                </div>

                {/* Current Admin Remarks if any */}
                {item.adminRemarks && (
                  <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                    <span className="font-bold text-slate-700">বর্তমান মন্তব্য: </span>
                    <span>{item.adminRemarks}</span>
                  </div>
                )}

                {/* MLA Power: Action Buttons + Full Edit Button */}
                <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    {/* Full Edit Button ("everything is editable") */}
                    <button
                      onClick={() => openEditModal(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-300 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                      title="সমস্ত বিবরণ সম্পাদনা করুন (Edit All Details)"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-orange-600" />
                      <span>সম্পাদনা করুন (Edit)</span>
                    </button>

                    {/* Mark In Progress */}
                    {item.status !== 'In Progress' && (
                      <button
                        onClick={() => openActionModal(item, 'In Progress')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        <span>ইন প্রগ্রেস</span>
                      </button>
                    )}

                    {/* Approve */}
                    {item.status !== 'Approved' && (
                      <button
                        onClick={() => openActionModal(item, 'Approved')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition-all cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>অনুমোদন</span>
                      </button>
                    )}

                    {/* Reject */}
                    {item.status !== 'Rejected' && (
                      <button
                        onClick={() => openActionModal(item, 'Rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>বাতিল</span>
                      </button>
                    )}

                    {/* Delete Any Ticket */}
                    <button
                      onClick={() => setDeleteConfirmTicket(item)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 hover:bg-rose-50 text-slate-500 hover:text-rose-700 border border-slate-200 hover:border-rose-300 text-xs font-bold transition-all cursor-pointer"
                      title="ডাটাবেস থেকে ডিলিট করুন (Permanently delete from database)"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                      <span>মুছুন</span>
                    </button>
                  </div>

                  {/* View Details */}
                  <button
                    onClick={() => setSelectedTicket(item)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>বিস্তারিত নথিপত্র</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ======================================================= */}
      {/* FULL COMPLAINT EDIT MODAL ("Everything is Editable")    */}
      {/* ======================================================= */}
      {editTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8 border-2 border-orange-500">
            <div className="flex justify-between items-start border-b border-orange-200 pb-3">
              <div>
                <span className="text-xs uppercase font-extrabold text-orange-600 tracking-wider">
                  প্রশাসনিক সম্পূর্ণ সম্পাদনা ডেস্ক (Admin Full Edit)
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-xl font-black font-mono text-slate-900">{editTicket.ticketId}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-900 border border-orange-300">
                    সব তথ্য পরিবর্তনযোগ্য (Everything Editable)
                  </span>
                </div>
              </div>
              <button
                onClick={() => setEditTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveFullEdit} className="space-y-5">
              {/* Group 1: Citizen Personal Details */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-orange-600" />
                  <span>১. আবেদনকারী নাগরিকের তথ্য (Citizen Details)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">নাগরিকের নাম *</label>
                    <input
                      type="text"
                      value={editFormData.citizen.name}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        citizen: { ...editFormData.citizen, name: e.target.value }
                      })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="text"
                      maxLength={10}
                      value={editFormData.citizen.phone}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        citizen: { ...editFormData.citizen, phone: e.target.value.replace(/\D/g, '') }
                      })}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">ইমেল (ঐচ্ছিক)</label>
                    <input
                      type="email"
                      value={editFormData.citizen.email}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        citizen: { ...editFormData.citizen, email: e.target.value }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      ভোটার কার্ড নম্বর (EPIC No)
                    </label>
                    <input
                      type="text"
                      value={editFormData.citizen.voterId}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        citizen: { ...editFormData.citizen, voterId: e.target.value.toUpperCase() }
                      })}
                      placeholder="যেমন: WBG1234567"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:ring-2 focus:ring-orange-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-orange-900 mb-1">
                      সম্পূর্ণ ১২ সংখ্যার আধার নম্বর (Full 12-digit Aadhaar) *
                    </label>
                    <input
                      type="text"
                      maxLength={12}
                      value={editFormData.citizen.aadhaar}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        citizen: { ...editFormData.citizen, aadhaar: e.target.value.replace(/\D/g, '') }
                      })}
                      placeholder="১২ সংখ্যার আধার নম্বর"
                      className="w-full px-3 py-2 rounded-xl border border-orange-300 text-xs font-mono font-bold tracking-wider text-orange-950 focus:ring-2 focus:ring-orange-500 bg-orange-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">স্থায়ী ঠিকানা (Permanent Address)</label>
                  <input
                    type="text"
                    value={editFormData.citizen.address}
                    onChange={(e) => setEditFormData({
                      ...editFormData,
                      citizen: { ...editFormData.citizen, address: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Group 2: Place & Cascading Gram Panchayat -> Village Details */}
              <div className="space-y-3 bg-orange-50/40 p-4 rounded-2xl border border-orange-200">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-orange-600" />
                  <span>২. অবস্থান ও পঞ্চায়েত বিবরণ (Cascading GP & Village Selection)</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Gram Panchayat */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">গ্রাম পঞ্চায়েত (GP) *</label>
                    <select
                      value={editFormData.placeDetails.wardOrPanchayat}
                      onChange={(e) => handlePanchayatChangeInEdit(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      {GOGHAT_GRAM_PANCHAYATS.map((gp, i) => (
                        <option key={i} value={gp}>{gp} Gram Panchayat</option>
                      ))}
                    </select>
                  </div>

                  {/* Cascading Village Selection */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-[11px] font-bold text-slate-700">গ্রাম বা এলাকা (Village) *</label>
                      <button
                        type="button"
                        onClick={() => setCustomVillageInEdit(!customVillageInEdit)}
                        className="text-[10px] text-orange-700 font-bold hover:underline"
                      >
                        {customVillageInEdit ? 'তালিকা থেকে বাছুন' : 'হাতে লিখুন'}
                      </button>
                    </div>

                    {customVillageInEdit ? (
                      <input
                        type="text"
                        value={editFormData.placeDetails.villageOrArea}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          placeDetails: { ...editFormData.placeDetails, villageOrArea: e.target.value }
                        })}
                        placeholder="গ্রামের নাম লিখুন"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-orange-500"
                      />
                    ) : (
                      <select
                        value={editFormData.placeDetails.villageOrArea}
                        onChange={(e) => setEditFormData({
                          ...editFormData,
                          placeDetails: { ...editFormData.placeDetails, villageOrArea: e.target.value }
                        })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
                      >
                        {availableVillagesForEdit.map((village, idx) => (
                          <option key={idx} value={village}>{village}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">কাছাকাছি ল্যান্ডমার্ক</label>
                    <input
                      type="text"
                      value={editFormData.placeDetails.landmark}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        placeDetails: { ...editFormData.placeDetails, landmark: e.target.value }
                      })}
                      placeholder="যেমন: কামারপুকুর চটি, স্কুল মোড়"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">পিন কোড (PIN)</label>
                    <input
                      type="text"
                      maxLength={6}
                      value={editFormData.placeDetails.pinCode}
                      onChange={(e) => setEditFormData({
                        ...editFormData,
                        placeDetails: { ...editFormData.placeDetails, pinCode: e.target.value.replace(/\D/g, '') }
                      })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-orange-500"
                    />
                  </div>
                </div>
              </div>

              {/* Group 3: Problem Description & Relief */}
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                  <span>৩. অভিযোগের তথ্য ও প্রত্যাশিত সুরাহা</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">সমস্যার বিষয়শ্রেণী *</label>
                    <select
                      value={editFormData.problemType}
                      onChange={(e) => setEditFormData({ ...editFormData, problemType: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Roads & Infrastructure">রাস্তা ও পরিকাঠামো</option>
                      <option value="Drinking Water Supply">বিশুদ্ধ পানীয় জল (PHE)</option>
                      <option value="Electricity & Streetlights">বিদ্যুৎ ও আলো</option>
                      <option value="Drainage & Sanitation">নিকাশি ও ড্রেনেজ</option>
                      <option value="Healthcare & Hospitals">স্বাস্থ্য ও হাসপাতাল</option>
                      <option value="Agriculture & Irrigation">কৃষি ও সেচ</option>
                      <option value="Other Public Grievance">অন্যান্য অভিযোগ</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">জরুরি মাত্রা (Priority)</label>
                    <select
                      value={editFormData.priority}
                      onChange={(e) => setEditFormData({ ...editFormData, priority: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Normal">সাধারণ (Normal)</option>
                      <option value="High">উচ্চ অগ্রাধিকার (High)</option>
                      <option value="Emergency">অতীব জরুরি (Emergency)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">অভিযোগের শিরোনাম / বিষয় *</label>
                  <input
                    type="text"
                    value={editFormData.subject}
                    onChange={(e) => setEditFormData({ ...editFormData, subject: e.target.value })}
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">অভিযোগের পূর্ণ বিবরণ *</label>
                  <textarea
                    rows={3}
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-amber-900 mb-1">
                    কী সুরাহা বা সাহায্য প্রয়োজন (Relief Needed) *
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.reliefNeeded}
                    onChange={(e) => setEditFormData({ ...editFormData, reliefNeeded: e.target.value })}
                    required
                    className="w-full p-2.5 rounded-xl border border-amber-300 text-xs font-medium bg-amber-50/50 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              {/* Group 4: Administrative Action & Status */}
              <div className="space-y-3 bg-orange-100/50 p-4 rounded-2xl border border-orange-200">
                <h4 className="text-xs font-black text-orange-950 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-orange-700" />
                  <span>৪. প্রশাসনিক সিদ্ধান্ত ও দপ্তর (Admin Actions & Status)</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">বর্তমান স্ট্যাটাস</label>
                    <select
                      value={editFormData.status}
                      onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Pending">Pending (পর্যালোচনাধীন)</option>
                      <option value="In Progress">In Progress (প্রক্রিয়াধীন)</option>
                      <option value="Approved">Approved (অনুমোদিত)</option>
                      <option value="Rejected">Rejected (প্রত্যাখ্যাত)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">সংশ্লিষ্ট দপ্তর</label>
                    <select
                      value={editFormData.assignedDepartment}
                      onChange={(e) => setEditFormData({ ...editFormData, assignedDepartment: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="Goghat MLA Grievance Cell">Goghat MLA Grievance Cell</option>
                      <option value="PWD Road Division (Arambagh & Goghat)">PWD Road Division (পূর্ত দপ্তর)</option>
                      <option value="Public Health Engineering (PHE) Water">PHE Drinking Water (পানীয় জল)</option>
                      <option value="WBSEDCL Goghat Electrical Sub-Division">WBSEDCL বিদ্যুৎ দপ্তর</option>
                      <option value="Panchayat Samiti Sanitation (Goghat-I & II)">নিকাশি ও ড্রেনেজ শাখা</option>
                      <option value="Kamarpukur Rural Hospital / Goghat BPHC">স্বাস্থ্য ও হাসপাতাল প্রশাসন</option>
                      <option value="BDO Office (Goghat-I / Goghat-II)">বিডিও অফিস</option>
                    </select>
                  </div>
                </div>

                {editFormData.status === 'Rejected' && (
                  <div>
                    <label className="block text-[11px] font-bold text-rose-800 mb-1">বাতিলের কারণ (Rejection Reason)</label>
                    <input
                      type="text"
                      value={editFormData.rejectionReason}
                      onChange={(e) => setEditFormData({ ...editFormData, rejectionReason: e.target.value })}
                      placeholder="যেমন: তথ্যের ঘাটতি বা ব্যক্তিগত নির্মাণ"
                      className="w-full px-3 py-2 rounded-xl border border-rose-300 text-xs font-medium focus:ring-2 focus:ring-rose-500 bg-rose-50/50"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    বিধায়ক দপ্তরের সরকারি মন্তব্য (Official Response to Citizen)
                  </label>
                  <textarea
                    rows={2}
                    value={editFormData.adminRemarks}
                    onChange={(e) => setEditFormData({ ...editFormData, adminRemarks: e.target.value })}
                    placeholder="নাগরিক তার ড্যাশবোর্ডে এই মন্তব্য দেখতে পাবেন..."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-orange-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditTicket(null)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
                >
                  বাতিল করুন
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md shadow-orange-600/30 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  {editSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>সংরক্ষণ হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>পরিবর্তন নিশ্চিত ও সংরক্ষণ করুন</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIMPLE ACTION DIALOG (In Progress / Approve / Reject) */}
      {actionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base">
                স্ট্যাটাস পরিবর্তন: <span className="text-orange-600">{actionModal.targetStatus}</span>
              </h3>
              <button
                onClick={() => setActionModal(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
              <div className="flex justify-between">
                <span className="font-mono font-bold text-slate-800">{actionModal.ticket.ticketId}</span>
                <span className="text-slate-500">{actionModal.ticket.placeDetails?.wardOrPanchayat}</span>
              </div>
              <p className="font-bold text-slate-900">{actionModal.ticket.subject}</p>
            </div>

            {/* If Reject, require rejection ground */}
            {actionModal.targetStatus === 'Rejected' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-rose-800 uppercase">
                  বাতিলের কারণ (Rejection Reason)
                </label>
                <textarea
                  rows={2}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-rose-300 text-xs font-medium focus:ring-2 focus:ring-rose-500/20"
                />
              </div>
            )}

            {/* Official Remark for Citizen */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 uppercase">
                নাগরিকের জন্য সরকারি মন্তব্য (Official Response)
              </label>
              <textarea
                rows={3}
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="নাগরিককে অবগত করার মন্তব্য..."
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-orange-500/20"
              />
            </div>

            {/* Department */}
            {actionModal.targetStatus !== 'Rejected' && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  সংশ্লিষ্ট বিভাগ (Assigned Department)
                </label>
                <select
                  value={assignedDept}
                  onChange={(e) => setAssignedDept(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium bg-white"
                >
                  <option value="Goghat MLA Grievance Cell">Goghat MLA Grievance Cell</option>
                  <option value="PWD Road Division (Arambagh & Goghat)">PWD Road Division (পূর্ত দপ্তর)</option>
                  <option value="Public Health Engineering (PHE) Water">PHE Drinking Water (পানীয় জল)</option>
                  <option value="WBSEDCL Goghat Electrical Sub-Division">WBSEDCL বিদ্যুৎ দপ্তর</option>
                  <option value="Panchayat Samiti Sanitation (Goghat-I & II)">নিকাশি ও ড্রেনেজ শাখা</option>
                  <option value="Kamarpukur Rural Hospital / Goghat BPHC">স্বাস্থ্য ও হাসপাতাল প্রশাসন</option>
                  <option value="BDO Office (Goghat-I / Goghat-II)">বিডিও অফিস</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActionModal(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                disabled={updating}
                onClick={handleApplyStatus}
                className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                {updating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>সংরক্ষণ ও কার্যকর করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FULL TICKET DETAILS MODAL */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 my-8">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs uppercase font-bold text-orange-600">অভিযোগ সংক্রান্ত সম্পূর্ণ নথিপত্র</span>
                <div className="flex items-center gap-2 mt-0.5">
                  <h3 className="text-xl font-black font-mono text-slate-900">{selectedTicket.ticketId}</h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {selectedTicket.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Citizen Details */}
            <div className="grid grid-cols-2 gap-2.5 text-xs bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <div>
                <span className="text-slate-400 block font-medium">আবেদনকারী:</span>
                <strong className="text-slate-900 text-sm">{selectedTicket.citizen?.name}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">মোবাইল:</span>
                <strong className="text-slate-900 text-sm font-mono">+91 {selectedTicket.citizen?.phone}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">গ্রাম পঞ্চায়েত:</span>
                <strong className="text-slate-800">{selectedTicket.placeDetails?.wardOrPanchayat}</strong>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">গ্রাম / এলাকা:</span>
                <span className="text-slate-800 font-semibold">{selectedTicket.placeDetails?.villageOrArea}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">স্থায়ী ঠিকানা:</span>
                <span className="text-slate-700">{selectedTicket.citizen?.address}</span>
              </div>
            </div>

            {/* Aadhaar Full Number & Voter ID - Admin Security Box */}
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 flex flex-wrap justify-between items-center gap-2">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 block">
                  আধার কার্ড নম্বর (Admin View - সম্পূর্ণ ১২ সংখ্যা):
                </span>
                <span className="text-base font-black font-mono text-orange-950">
                  {selectedTicket.citizen?.aadhaar || (selectedTicket.citizen?.aadhaarLast4 ? `XXXX-XXXX-${selectedTicket.citizen.aadhaarLast4}` : 'তথ্য নেই')}
                </span>
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-orange-800 block">
                  ভোটার কার্ড নম্বর (EPIC No):
                </span>
                <span className="text-base font-black font-mono text-orange-950">
                  {selectedTicket.citizen?.voterId || 'তথ্য নেই'}
                </span>
              </div>
            </div>

            {/* Problem & Relief */}
            <div className="space-y-2.5 text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase block">অভিযোগের বিষয়:</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedTicket.subject}</p>
              </div>

              <div>
                <span className="text-slate-400 font-bold uppercase block">পূর্ণ বিবরণ:</span>
                <p className="text-slate-700 mt-1 bg-slate-50 p-3 rounded-xl border border-slate-200 leading-relaxed">
                  {selectedTicket.description}
                </p>
              </div>

              <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                <span className="text-amber-900 font-bold uppercase block">
                  কী সুরাহা বা সাহায্য প্রয়োজন (Relief Needed):
                </span>
                <p className="text-amber-950 font-medium mt-0.5">{selectedTicket.reliefNeeded}</p>
              </div>
            </div>

            {/* Quick action triggers inside modal */}
            <div className="pt-2 flex flex-wrap justify-between items-center gap-2 border-t border-slate-100">
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => openEditModal(selectedTicket)}
                  className="px-3 py-1.5 bg-orange-50 text-orange-800 hover:bg-orange-100 rounded-lg text-xs font-bold border border-orange-300 cursor-pointer flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>সম্পাদনা করুন</span>
                </button>
                <button
                  onClick={() => openActionModal(selectedTicket, 'In Progress')}
                  className="px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold border border-blue-200 cursor-pointer"
                >
                  In Progress
                </button>
                <button
                  onClick={() => openActionModal(selectedTicket, 'Approved')}
                  className="px-3 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-bold border border-emerald-300 cursor-pointer"
                >
                  Approve
                </button>
                <button
                  onClick={() => openActionModal(selectedTicket, 'Rejected')}
                  className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-bold border border-rose-200 cursor-pointer"
                >
                  Reject
                </button>
                <button
                  onClick={() => setDeleteConfirmTicket(selectedTicket)}
                  className="px-3 py-1.5 bg-rose-100 text-rose-800 hover:bg-rose-200 rounded-lg text-xs font-bold border border-rose-300 cursor-pointer flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>মুছে ফেলুন</span>
                </button>
              </div>
              <button
                onClick={() => setSelectedTicket(null)}
                className="px-4 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PERMANENT DELETE CONFIRMATION MODAL */}
      {deleteConfirmTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 border-2 border-rose-500">
            <div className="flex items-center gap-3 text-rose-600 border-b border-rose-100 pb-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">ডাটাবেস থেকে মুছে ফেলার নিশ্চিতকরণ</h3>
                <p className="text-xs text-rose-600 font-semibold">Permanently Delete from Database</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-mono font-bold text-slate-900 text-sm">{deleteConfirmTicket.ticketId}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  deleteConfirmTicket.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                  deleteConfirmTicket.status === 'Rejected' ? 'bg-rose-100 text-rose-800' :
                  deleteConfirmTicket.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {deleteConfirmTicket.status}
                </span>
              </div>
              <p className="font-semibold text-slate-800">{deleteConfirmTicket.subject}</p>
              <p className="text-slate-500">আবেদনকারী: {deleteConfirmTicket.citizen?.name} (+91 {deleteConfirmTicket.citizen?.phone})</p>
              <p className="text-slate-500">গ্রাম পঞ্চায়েত: {deleteConfirmTicket.placeDetails?.wardOrPanchayat}</p>
            </div>

            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <p>
                <strong>সতর্কবার্তা:</strong> এই টিকিটটি ডাটাবেস থেকে স্থায়ীভাবে মুছে ফেলা হবে। অনুমোদিত বা বাতিল হওয়া যেকোনো রেকর্ড চিরতরে ডিলিট হয়ে যাবে।
              </p>
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteConfirmTicket(null)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold cursor-pointer"
              >
                না, বাতিল করুন
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md cursor-pointer flex items-center gap-1.5"
              >
                {deleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>হ্যাঁ, স্থায়ীভাবে ডিলিট করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
