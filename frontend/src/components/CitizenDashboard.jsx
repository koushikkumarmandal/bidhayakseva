import React, { useState, useEffect } from 'react';
import { 
  User, 
  Phone, 
  MapPin, 
  FileText, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowRight, 
  Printer, 
  PlusCircle, 
  ShieldCheck, 
  RefreshCw, 
  ExternalLink,
  Edit3,
  Loader2,
  Lock
} from 'lucide-react';
import { api } from '../services/api';
import { GOGHAT_GRAM_PANCHAYATS, getVillagesByPanchayat } from '../data/goghatData';

export default function CitizenDashboard({ citizenUser, onTrackTicket, onNewComplaint, onLogout }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    name: citizenUser?.name || '',
    address: citizenUser?.address || '',
    wardOrPanchayat: citizenUser?.wardOrPanchayat || GOGHAT_GRAM_PANCHAYATS[0] || 'Bali',
    villageOrArea: citizenUser?.villageOrArea || ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    if (citizenUser?.phone) {
      loadMyComplaints();
    }
  }, [citizenUser]);

  const loadMyComplaints = async () => {
    setLoading(true);
    try {
      // Fetches ONLY this citizen's complaints strictly by phone number
      const res = await api.getCitizenComplaints(citizenUser.phone);
      if (res.success) {
        setComplaints(res.data);
      }
    } catch (err) {
      console.error('Error loading citizen complaints:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await api.updateCitizenProfile({
        phone: citizenUser.phone,
        ...profileForm
      });
      if (res.success) {
        setEditingProfile(false);
        const updated = { ...citizenUser, ...profileForm };
        localStorage.setItem('bsk_citizen_user', JSON.stringify(updated));
      }
    } catch (err) {
      alert('প্রোফাইল আপডেট ত্রুটি: ' + err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Citizen Personal Profile Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 text-white border border-white/20 flex items-center justify-center font-black text-xl backdrop-blur">
              {citizenUser?.name?.charAt(0) || 'না'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black">{citizenUser?.name}</h1>
                <span className="bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>যাচাইকৃত (Verified)</span>
                </span>
                <span className="bg-amber-400/20 text-amber-200 border border-amber-400/30 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Clock className="w-3 h-3 text-amber-400" />
                  <span>৭ দিনের সেশন সক্রিয়</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-emerald-100 mt-1">
                <span className="flex items-center gap-1">
                  <Phone className="w-3 h-3 text-amber-300" />
                  <span className="font-mono font-bold">+91 {citizenUser?.phone}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-300" />
                  <span>{citizenUser?.wardOrPanchayat || 'গোগঘাট'} GP{citizenUser?.villageOrArea ? `, গ্রাম: ${citizenUser.villageOrArea}` : ''}</span>
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-[11px] text-emerald-200/90 mt-1 font-mono">
                {citizenUser?.voterId && (
                  <span>ভোটার: <strong className="text-white">{citizenUser.voterId}</strong></span>
                )}
                {(citizenUser?.aadhaar || citizenUser?.aadhaarLast4) && (
                  <span>• আধার: <strong className="text-white">XXXX-XXXX-{citizenUser.aadhaar ? citizenUser.aadhaar.slice(-4) : citizenUser.aadhaarLast4}</strong></span>
                )}
              </div>
              <p className="text-[11px] text-emerald-300/80 mt-1">
                স্থায়ী ঠিকানা: {citizenUser?.address || 'প্রদত্ত ঠিকানা'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNewComplaint()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              <span>নয়া আবেদন করুন</span>
            </button>
            <button
              onClick={() => setEditingProfile(!editingProfile)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold cursor-pointer"
              title="প্রোফাইল সম্পাদন"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={onLogout}
              className="p-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
              title="লগআউট"
            >
              লগআউট
            </button>
          </div>
        </div>

        {/* Inline Profile Edit */}
        {editingProfile && (
          <form onSubmit={handleUpdateProfile} className="mt-5 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs animate-in fade-in duration-200">
            <div>
              <label className="block text-emerald-200 uppercase font-bold mb-1">পূর্ণ নাম:</label>
              <input
                type="text"
                value={profileForm.name}
                onChange={e => setProfileForm({ ...profileForm, name: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-emerald-200 uppercase font-bold mb-1">স্থায়ী ঠিকানা:</label>
              <input
                type="text"
                value={profileForm.address}
                onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white"
              />
            </div>
            <div>
              <label className="block text-emerald-200 uppercase font-bold mb-1">গ্রাম পঞ্চায়েত (GP):</label>
              <select
                value={profileForm.wardOrPanchayat}
                onChange={e => {
                  const gp = e.target.value;
                  const vList = getVillagesByPanchayat(gp);
                  setProfileForm({
                    ...profileForm,
                    wardOrPanchayat: gp,
                    villageOrArea: vList[0] || ''
                  });
                }}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/20 text-white"
              >
                {GOGHAT_GRAM_PANCHAYATS.map((gp, i) => (
                  <option key={i} value={gp}>{gp} GP</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-emerald-200 uppercase font-bold mb-1">পঞ্চায়েত অধীনস্থ গ্রাম:</label>
              <select
                value={profileForm.villageOrArea}
                onChange={e => setProfileForm({ ...profileForm, villageOrArea: e.target.value })}
                className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/20 text-white"
              >
                {getVillagesByPanchayat(profileForm.wardOrPanchayat).map((v, i) => (
                  <option key={i} value={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-3 py-1 rounded-lg bg-white/10 text-white text-xs"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={savingProfile}
                className="px-4 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold"
              >
                {savingProfile ? 'সংরক্ষণ হচ্ছে...' : 'সেভ করুন'}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Citizen Personal Grievances Container - ONLY THIS CITIZEN'S DATA */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="font-black text-slate-900 text-base">
              আমার জমাকৃত অভিযোগ ও আবেদনপত্র ({complaints.length})
            </h2>
            <p className="text-xs text-slate-500">
              শুধুমাত্র আপনার মোবাইল নম্বরে নিবন্ধিত অভিযোগসমূহের ব্যক্তিগত তালিকা
            </p>
          </div>
          <button
            onClick={loadMyComplaints}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
            title="রিফ্রেশ করুন"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-2">
            <Loader2 className="w-7 h-7 text-emerald-600 animate-spin" />
            <p className="text-xs font-semibold">আপনার তথ্য লোড হচ্ছে...</p>
          </div>
        ) : complaints.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-4">
            <FileText className="w-10 h-10 text-slate-300 mx-auto" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-slate-800">আপনি এখনো কোনো অভিযোগ জমা দেননি</p>
              <p className="text-xs text-slate-400">গোগঘাট বিধানসভার যেকোনো সমস্যা সমাধানে নতুন আবেদন করতে পারেন</p>
            </div>
            <button
              onClick={() => onNewComplaint()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>নয়া আবেদন দায়ের করুন</span>
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {complaints.map((item) => (
              <div key={item.ticketId} className="p-5 hover:bg-slate-50/60 transition-colors space-y-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black font-mono text-emerald-900 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-200">
                      {item.ticketId}
                    </span>
                    {item.status === 'Pending' && (
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
                        Pending Review
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
                  </div>
                  <span className="text-xs text-slate-400">
                    {new Date(item.submittedAt || item.createdAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-900">{item.subject}</h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    <span>স্থান: <strong>{item.placeDetails?.wardOrPanchayat}</strong></span>
                    <span> • বিভাগ: <strong>{item.problemType}</strong></span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2 mt-1 leading-relaxed">{item.description}</p>
                </div>

                {/* Relief demanded */}
                <div className="bg-amber-50/70 p-2.5 rounded-xl border border-amber-200 text-xs">
                  <span className="font-bold text-amber-900">আপনার প্রত্যাশিত সুরাহা: </span>
                  <span className="text-amber-950 font-medium">{item.reliefNeeded}</span>
                </div>

                {/* MLA Remarks for this specific ticket */}
                {item.adminRemarks && (
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600">
                    <span className="font-bold text-slate-800">বিধায়ক দপ্তর থেকে উত্তর: </span>
                    <span>{item.adminRemarks}</span>
                  </div>
                )}

                <div className="flex justify-end items-center gap-2 pt-1">
                  <button
                    onClick={() => onTrackTicket(item.ticketId)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>অগ্রগতির বিবরণ দেখুন</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
