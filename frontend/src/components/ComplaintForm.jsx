import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  User, 
  MapPin, 
  AlertTriangle, 
  CheckCircle2, 
  Copy, 
  Printer, 
  ExternalLink, 
  Sparkles, 
  Phone, 
  Mail, 
  Home, 
  IdCard, 
  Send,
  Loader2,
  Info,
  ShieldCheck,
  LogIn
} from 'lucide-react';
import { api } from '../services/api';
import { GOGHAT_GRAM_PANCHAYATS, GOGHAT_VILLAGES, getVillagesByPanchayat } from '../data/goghatData';

export default function ComplaintForm({ citizenUser, onOpenCitizenAuth, onTicketCreated, onTrackTicket }) {
  const [formData, setFormData] = useState({
    // Citizen Personal Details (Goghat AC 201)
    name: citizenUser?.name || '',
    phone: citizenUser?.phone || '',
    email: citizenUser?.email || '',
    address: citizenUser?.address || '',
    voterId: citizenUser?.voterId || '',
    aadhaar: citizenUser?.aadhaar || '',
    aadhaarLast4: citizenUser?.aadhaarLast4 || '',
    // Place Details
    wardOrPanchayat: citizenUser?.wardOrPanchayat || GOGHAT_GRAM_PANCHAYATS[0] || 'Bali',
    villageOrArea: citizenUser?.villageOrArea || '',
    landmark: '',
    pinCode: '712614',
    // Problem & Relief Details
    problemType: 'Roads & Infrastructure',
    subject: '',
    description: '',
    reliefNeeded: '',
    priority: 'Medium',
    attachmentUrl: ''
  });

  // When citizenUser logs in or changes, update form fields
  useEffect(() => {
    if (citizenUser) {
      setFormData(prev => ({
        ...prev,
        name: citizenUser.name || prev.name,
        phone: citizenUser.phone || prev.phone,
        email: citizenUser.email || prev.email,
        address: citizenUser.address || prev.address,
        wardOrPanchayat: citizenUser.wardOrPanchayat || prev.wardOrPanchayat,
        villageOrArea: citizenUser.villageOrArea || prev.villageOrArea,
        voterId: citizenUser.voterId || prev.voterId,
        aadhaar: citizenUser.aadhaar || prev.aadhaar,
        aadhaarLast4: citizenUser.aadhaarLast4 || (citizenUser.aadhaar ? citizenUser.aadhaar.slice(-4) : prev.aadhaarLast4)
      }));
    }
  }, [citizenUser]);

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState(null);
  const [copied, setCopied] = useState(false);

  const problemCategories = [
    'Roads & Infrastructure',
    'Drinking Water Supply',
    'Electricity & Streetlights',
    'Drainage & Sanitation',
    'Healthcare & Hospitals',
    'Ration & Food Security',
    'Education & Schools',
    'Social Welfare & Pensions',
    'Law & Order / Public Safety',
    'Agriculture & Irrigation',
    'Other Public Grievance'
  ];

  const wardOptions = GOGHAT_GRAM_PANCHAYATS;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePanchayatChange = (e) => {
    const gp = e.target.value;
    const villages = getVillagesByPanchayat(gp);
    setFormData(prev => ({
      ...prev,
      wardOrPanchayat: gp,
      villageOrArea: villages[0] || ''
    }));
  };

  const handleFillDemo = () => {
    setFormData({
      name: citizenUser?.name || 'কৌশিক মণ্ডল (Koushik Mandal)',
      phone: citizenUser?.phone || '7001223834',
      email: citizenUser?.email || 'koushik@example.com',
      address: citizenUser?.address || 'গ্রাম ও ডাকঘর: ঝরিয়া, থানা: গোগঘাট, পিন: ৭১২৬১৪',
      voterId: citizenUser?.voterId || 'WB/29/201/099124',
      aadhaar: citizenUser?.aadhaar || '700122383412',
      aadhaarLast4: citizenUser?.aadhaarLast4 || '3412',
      wardOrPanchayat: citizenUser?.wardOrPanchayat || 'Shyambazar',
      villageOrArea: citizenUser?.villageOrArea || 'Jharia',
      landmark: 'ঝরিয়া প্রাথমিক বিদ্যালয় ও শিব মন্দিরের সংযোগস্থল',
      pinCode: '712614',
      problemType: 'Drinking Water Supply',
      subject: 'ঝরিয়া ও সংলগ্ন শ্যামবাজার পাড়ায় পানীয় জলের মেন পাইপলাইন লিকেজ ও তীব্র জল সংকট',
      description: 'আমাদের পাড়ায় বিগত এক সপ্তাহ ধরে মূল পানীয় জলের পাইপলাইন ফেটে গিয়ে নর্দমার জলের সাথে মিশে গেছে। এর ফলে বাড়ি বাড়ি নোংরা ও দুর্গন্ধযুক্ত জল আসছে। অন্তত ২০০ টি পরিবার পানীয় জলের গভীর সংকটে রয়েছে।',
      reliefNeeded: 'অনতিবিলম্বে গোগঘাট PHE দপ্তরের তত্ত্বাবধানে ফাটা পাইপলাইন দ্রুত মেরামত এবং কাজ চলাকালীন অস্থায়ী পানীয় জলের ট্যাঙ্ক সরবরাহ করা হোক।',
      priority: 'High',
      attachmentUrl: 'https://images.unsplash.com/photo-1584467735871-8e85353a8413?auto=format&fit=crop&w=600&q=80'
    });
    setErrorMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    // If citizen is not logged in, prompt them to register/login with Phone & OTP
    if (!citizenUser) {
      if (onOpenCitizenAuth) {
        onOpenCitizenAuth();
        setErrorMsg('অভিযোগ দায়ের করার পূর্বে দয়া করে আপনার মোবাইল নম্বর ও ওটিপি দিয়ে লগইন বা রেজিস্টার করুন।');
        return;
      }
    }

    // Client-side validations
    if (!formData.name.trim()) {
      setErrorMsg('দয়া করে আবেদনকারীর নাম লিখুন (Please enter your name).');
      return;
    }
    if (!formData.phone.trim() || formData.phone.trim().length < 10) {
      setErrorMsg('দয়া করে একটি সঠিক ১০-সংখ্যার মোবাইল নম্বর দিন (Valid 10-digit mobile number required).');
      return;
    }
    if (!formData.address.trim()) {
      setErrorMsg('দয়া করে আপনার স্থায়ী ঠিকানা লিখুন (Please provide citizen address).');
      return;
    }
    if (!formData.voterId.trim()) {
      setErrorMsg('ভোটার কার্ড নম্বর (Voter EPIC Number) দেওয়া বাধ্যতামূলক।');
      return;
    }
    const cleanAadhaar = (formData.aadhaar || '').trim().replace(/\s/g, '');
    if (!/^\d{12}$/.test(cleanAadhaar)) {
      setErrorMsg('সঠিক ১২-সংখ্যার আধার কার্ড নম্বর দেওয়া বাধ্যতামূলক (Exactly 12-digit Aadhaar number is mandatory).');
      return;
    }
    if (!formData.villageOrArea.trim()) {
      setErrorMsg('দয়া করে ঘটনাস্থল বা পাড়ার নাম লিখুন (Village / Area is required).');
      return;
    }
    if (!formData.subject.trim()) {
      setErrorMsg('দয়া করে সমস্যার সংক্ষিপ্ত বিষয় বা শিরোনাম লিখুন (Complaint subject is required).');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('দয়া করে সমস্যার বিস্তারিত বিবরণ দিন (Problem description is required).');
      return;
    }
    if (!formData.reliefNeeded.trim()) {
      setErrorMsg('দয়া করে বিধায়ক দপ্তর থেকে কী সুরাহা বা সাহায্য প্রয়োজন (Relief Needed) তা স্পষ্টভাবে লিখুন।');
      return;
    }

    setLoading(true);

    const payload = {
      citizen: {
        name: formData.name.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim(),
        address: formData.address.trim(),
        voterId: formData.voterId.trim().toUpperCase(),
        aadhaar: cleanAadhaar,
        aadhaarLast4: cleanAadhaar.slice(-4)
      },
      placeDetails: {
        wardOrPanchayat: formData.wardOrPanchayat,
        villageOrArea: formData.villageOrArea.trim(),
        landmark: formData.landmark.trim(),
        pinCode: formData.pinCode.trim()
      },
      problemType: formData.problemType,
      subject: formData.subject.trim(),
      description: formData.description.trim(),
      reliefNeeded: formData.reliefNeeded.trim(),
      priority: formData.priority,
      attachmentUrl: formData.attachmentUrl
    };

    try {
      const res = await api.submitComplaint(payload);
      if (res.success) {
        setSuccessResult(res.data);
        if (onTicketCreated) onTicketCreated(res.data);
      } else {
        setErrorMsg(res.message || 'অভিযোগ জমা দিতে ত্রুটি হয়েছে। পুনরায় চেষ্টা করুন।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগ করা সম্ভব হয়নি: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTicket = (ticketId) => {
    navigator.clipboard.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto pb-12">
      {/* Top Citizen Auth Status Banner */}
      {citizenUser ? (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{citizenUser.name}</span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  যাচাইকৃত মোবাইল: +91 {citizenUser.phone}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                আপনার নিবন্ধিত তথ্য নিচে স্বয়ংক্রিয়ভাবে পূরণ করা হয়েছে
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleFillDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 border border-emerald-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>নমুনা সমস্যা পূরণ করুন (Sample Grievance)</span>
          </button>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900">
                নাগরিক মোবাইল ও ওটিপি দিয়ে লগইন করুন
              </p>
              <p className="text-xs text-slate-500">
                লগইন করলে আপনার সকল অভিযোগ স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে এবং সহজেই ট্র্যাক করতে পারবেন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onOpenCitizenAuth}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold shadow-md shadow-purple-700/20 transition-all cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>লগইন / রেজিস্টার করুন (OTP)</span>
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              নাগরিক পরিষেবা পোর্টাল • Citizen Grievance Redressal
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            নতুন অভিযোগ ও সমস্যার আবেদনপত্র
          </h1>
          <p className="text-sm text-slate-500">
            সমস্যার বিবরণ এবং আপনার কী সুরাহা প্রয়োজন (Relief Needed) তা স্পষ্টভাবে পূরণ করুন
          </p>
        </div>
      </div>

      {/* Success Modal / Card */}
      {successResult ? (
        <div className="bg-white rounded-3xl border-2 border-emerald-500 shadow-xl p-8 sm:p-10 space-y-6 text-center animate-in fade-in zoom-in-95 duration-300">
          <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-inner">
            <CheckCircle2 className="w-12 h-12" />
          </div>

          <div className="space-y-2">
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              আবেদন সফলভাবে গৃহীত হয়েছে
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              আপনার অভিযোগটি বিধায়ক সেবা কেন্দ্রে নিবন্ধিত হয়েছে!
            </h2>
            <p className="text-slate-600 text-sm max-w-lg mx-auto">
              মাননীয় বিধায়কের দপ্তর আপনার আবেদনটি অবিলম্বে সংশ্লিষ্ট প্রশাসনিক ইউনিটে পাঠাচ্ছে। এই টিকিট আইডি দিয়ে যেকোনো সময় অগ্রগতি ট্র্যাক করতে পারবেন।
            </p>
          </div>

          {/* Ticket ID Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 max-w-md mx-auto space-y-3 shadow-inner">
            <p className="text-xs uppercase font-bold text-slate-500 tracking-wider">
              আপনার অভিযোগ রেফারেন্স নম্বর (Ticket ID)
            </p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-black font-mono tracking-wider text-emerald-700 bg-white px-4 py-2 rounded-xl border border-emerald-200 shadow-xs">
                {successResult.ticketId}
              </span>
              <button
                onClick={() => handleCopyTicket(successResult.ticketId)}
                className="p-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 transition-colors cursor-pointer"
                title="কপি করুন"
              >
                {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600 font-semibold">টিকিট আইডি কপি করা হয়েছে!</p>}
          </div>

          {/* Summary Mini Table */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto text-left text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-slate-400 block font-medium">আবেদনকারী:</span>
              <strong className="text-slate-800 text-sm">{successResult.citizen.name}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">মোবাইল:</span>
              <strong className="text-slate-800 text-sm">{successResult.citizen.phone}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">ওয়ার্ড / এলাকা:</span>
              <strong className="text-slate-800 text-sm">{successResult.placeDetails.wardOrPanchayat}</strong>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">সমস্যার বিভাগ:</span>
              <strong className="text-emerald-700 text-sm">{successResult.problemType}</strong>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap justify-center items-center gap-3 pt-4">
            <button
              onClick={() => onTrackTicket(successResult.ticketId)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
            >
              <ExternalLink className="w-4 h-4" />
              <span>এই অভিযোগের অগ্রগতি ট্র্যাক করুন</span>
            </button>

            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm border border-slate-300 transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>রসিদ প্রিন্ট / সেভ করুন</span>
            </button>

            <button
              onClick={() => {
                setSuccessResult(null);
                setFormData({
                  name: citizenUser?.name || '',
                  phone: citizenUser?.phone || '',
                  email: citizenUser?.email || '',
                  address: citizenUser?.address || '',
                  voterId: citizenUser?.voterId || '',
                  aadhaarLast4: citizenUser?.aadhaarLast4 || '',
                  wardOrPanchayat: citizenUser?.wardOrPanchayat || 'Ward 14',
                  villageOrArea: citizenUser?.villageOrArea || '',
                  landmark: '',
                  pinCode: '700150',
                  problemType: 'Roads & Infrastructure',
                  subject: '',
                  description: '',
                  reliefNeeded: '',
                  priority: 'Medium',
                  attachmentUrl: ''
                });
              }}
              className="px-5 py-3 rounded-xl text-slate-600 hover:text-slate-900 font-semibold text-sm cursor-pointer"
            >
              আরেকটি অভিযোগ জমা দিন
            </button>
          </div>
        </div>
      ) : (
        /* The Registration Form */
        <form onSubmit={handleSubmit} className="space-y-8">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong>বিজ্ঞপ্তি:</strong> {errorMsg}
              </div>
            </div>
          )}

          {/* Section 1: Personal Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-base">
                ১
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-emerald-600" />
                  <span>ব্যক্তিগত বিবরণ (Citizen Personal Details)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  আপনার সঠিক পরিচয় ও যোগাযোগের তথ্য প্রদান করুন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  আবেদনকারীর পূর্ণ নাম (Full Name) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="যেমন: অনির্বাণ চক্রবর্তী"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  মোবাইল নম্বর (10-digit Phone) <span className="text-rose-600">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-sm font-semibold">+91</span>
                  <input
                    type="tel"
                    name="phone"
                    maxLength={10}
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="98XXXXXXXX"
                    required
                    readOnly={!!citizenUser?.phone}
                    className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl border text-sm font-mono font-bold ${
                      citizenUser?.phone
                        ? 'bg-slate-100 text-slate-700 border-slate-200 cursor-not-allowed'
                        : 'border-slate-300 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ইমেল ঠিকানা (Email ID - Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ভোটার কার্ড নম্বর (Voter EPIC No.) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="voterId"
                  value={formData.voterId}
                  onChange={handleChange}
                  placeholder="যেমন: WB/29/201/XXXXXX"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm uppercase font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ১২-সংখ্যার আধার নম্বর (12-Digit Aadhaar No.) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="aadhaar"
                  maxLength={12}
                  value={formData.aadhaar}
                  onChange={(e) => setFormData(prev => ({ ...prev, aadhaar: e.target.value.replace(/\D/g, '') }))}
                  placeholder="যেমন: 700122383412"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  স্থায়ী ঠিকানা (Complete Citizen Address) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="বাড়ি নং / ফ্ল্যাট, রাস্তা, ডাকঘর ও পূর্ণ ঠিকানা"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600 text-sm font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Place & Locality Details */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-base">
                ২
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <span>ঘটনাস্থল ও এলাকা বিবরণ (Goghat AC 201 Place Details)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  সমস্যাটি গোগঘাট বিধানসভার কোন গ্রাম পঞ্চায়েত ও কোন গ্রামে ঘটেছে তা নির্বাচন করুন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ১. গ্রাম পঞ্চায়েত (Gram Panchayat - 16 GPs) <span className="text-rose-600">*</span>
                </label>
                <select
                  name="wardOrPanchayat"
                  value={formData.wardOrPanchayat}
                  onChange={handlePanchayatChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-bold text-slate-900"
                >
                  {wardOptions.map((opt, i) => (
                    <option key={i} value={opt}>{opt} GP</option>
                  ))}
                </select>
                <span className="text-[11px] text-slate-400 font-medium block mt-1">
                  গোগঘাট বিধানসভার আওতাভুক্ত পঞ্চায়েত বেছে নিন
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  ২. পঞ্চায়েত অধীনস্থ গ্রাম (Goghat Village) <span className="text-rose-600">*</span>
                </label>
                <select
                  name="villageOrArea"
                  value={formData.villageOrArea}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-sm font-bold text-orange-950"
                >
                  <option value="" disabled>গ্রাম নির্বাচন করুন...</option>
                  {getVillagesByPanchayat(formData.wardOrPanchayat).map((v, i) => (
                    <option key={i} value={v}>{v}</option>
                  ))}
                </select>
                <span className="text-[11px] text-orange-700 font-semibold block mt-1">
                  * {formData.wardOrPanchayat} GP-এর আওতাভুক্ত {getVillagesByPanchayat(formData.wardOrPanchayat).length}টি গ্রাম
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  নিকটবর্তী পরিচিত ল্যান্ডমার্ক (Landmark)
                </label>
                <input
                  type="text"
                  name="landmark"
                  value={formData.landmark}
                  onChange={handleChange}
                  placeholder="যেমন: মিলন সঙ্ঘ ক্লাবের সামনে / প্রাইমারি স্কুলের পাশে"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  পিন কোড (PIN Code)
                </label>
                <input
                  type="text"
                  name="pinCode"
                  maxLength={6}
                  value={formData.pinCode}
                  onChange={handleChange}
                  placeholder="712614"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Problem Description & Relief Needed */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-base">
                ৩
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-600" />
                  <span>সমস্যা ও প্রত্যাশিত সুরাহার বিবরণ (Grievance & Relief Details)</span>
                </h3>
                <p className="text-xs text-slate-500">
                  কী ধরণের সমস্যা এবং বিধায়ক অফিস থেকে কী সুরাহা প্রয়োজন তা লিখুন
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  সমস্যার ধরন বা বিষয়শ্রেণী (Problem Category) <span className="text-rose-600">*</span>
                </label>
                <select
                  name="problemType"
                  value={formData.problemType}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm font-semibold text-slate-800"
                >
                  {problemCategories.map((cat, i) => (
                    <option key={i} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  জরুরিতা বা অগ্রাধিকার (Urgency Level)
                </label>
                <select
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm font-semibold"
                >
                  <option value="Low">সাধারণ (Normal / Low Priority)</option>
                  <option value="Medium">মাঝারি (Medium Priority)</option>
                  <option value="High">জরুরি (High Priority)</option>
                  <option value="Emergency">সর্বোচ্চ জরুরি (Emergency / Immediate Action)</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  অভিযোগের সংক্ষিপ্ত শিরোনাম (Subject / Title) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="যেমন: মেইন রোডের কালভার্ট ভেঙে গিয়ে তীব্র জলমগ্নতা ও দুর্ঘটনা"
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm font-semibold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  সমস্যার পূর্ণ বিবরণ (Detailed Problem Description) <span className="text-rose-600">*</span>
                </label>
                <textarea
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="কবে থেকে সমস্যা হচ্ছে, কতজন বাসিন্দা বা পরিবারের অসুবিধা হচ্ছে, ইতিপূর্বে কোথাও জানানো হয়েছিল কিনা ইত্যাদি বিশদে লিখুন..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 text-sm leading-relaxed"
                />
              </div>

              {/* Crucial Field: What Should Be Needed / Relief Needed */}
              <div className="sm:col-span-2 bg-amber-50/70 p-4 sm:p-5 rounded-2xl border-2 border-amber-300 space-y-2">
                <div className="flex items-center gap-2 text-amber-900">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <label className="block text-xs font-black uppercase tracking-wider">
                    বিধায়ক দপ্তর থেকে কী সমাধান বা সুরাহা প্রয়োজন? (What Action / Relief Is Needed) <span className="text-rose-600">*</span>
                  </label>
                </div>
                <p className="text-xs text-amber-800">
                  এখানে লিখুন ঠিক কী ধরণের সরকারি পদক্ষেপ চান — যেমন: বিধায়ক তহবিল থেকে অর্থ বরাদ্দ, রাস্তা সংস্কার, পানীয় জলের পাইপ বদল, ভ্রাম্যমাণ জলের ট্যাঙ্ক, স্ট্রিট লাইট লাগানো বা প্রশাসনিক পরিদর্শন।
                </p>
                <textarea
                  name="reliefNeeded"
                  rows={3}
                  value={formData.reliefNeeded}
                  onChange={handleChange}
                  placeholder="যেমন: অনতিবিলম্বে PWD বা পৌরসভার ইঞ্জিনিয়ার দ্বারা পরিদর্শন এবং বিধায়ক তহবিল থেকে জরুরি সংস্কারের প্রশাসনিক নির্দেশ জারি করা হোক..."
                  required
                  className="w-full px-3.5 py-2.5 rounded-xl border border-amber-300 bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500/30 focus:border-amber-600 text-sm font-medium leading-relaxed"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  সমস্যার ছবি বা নথির লিঙ্ক (Optional Photo / Document URL)
                </label>
                <input
                  type="url"
                  name="attachmentUrl"
                  value={formData.attachmentUrl}
                  onChange={handleChange}
                  placeholder="https://... (যদি ছবি বা প্রমাণপত্রের লিঙ্ক থাকে)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-slate-500/20 focus:border-slate-500 text-sm"
                />
              </div>
            </div>
          </div>

          {/* Form Declaration & Submit Button */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-500 space-y-1">
              <p className="font-semibold text-slate-700">স্বঘোষণা (Citizen Declaration):</p>
              <p>আমি ঘোষণা করছি যে প্রদত্ত সমস্ত তথ্য সত্য এবং সোনারপুর দক্ষিণ বিধানসভা এলাকার সমস্যা সম্পর্কিত।</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-base shadow-lg shadow-emerald-700/25 transition-all hover:scale-102 active:scale-98 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>জমা হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>অভিযোগপত্র জমা দিন (Submit Grievance)</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
