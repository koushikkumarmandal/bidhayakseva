import React, { useState, useEffect } from 'react';
import { 
  Search, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  XCircle, 
  Printer, 
  Building2, 
  User, 
  MapPin, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  ArrowRight,
  Info,
  Loader2,
  Phone
} from 'lucide-react';
import { api } from '../services/api';

export default function TrackComplaint({ initialTicketId }) {
  const [query, setQuery] = useState(initialTicketId || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [ticketData, setTicketData] = useState(null);
  const [multipleResults, setMultipleResults] = useState([]);

  useEffect(() => {
    if (initialTicketId) {
      setQuery(initialTicketId);
      performSearch(initialTicketId);
    }
  }, [initialTicketId]);

  const performSearch = async (searchTerm) => {
    const term = (searchTerm || query).trim();
    if (!term) {
      setErrorMsg('দয়া করে আপনার অভিযোগ টিকিট আইডি বা ১০ সংখ্যার মোবাইল নম্বর দিন।');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    setTicketData(null);
    setMultipleResults([]);

    try {
      const res = await api.trackComplaint(term);
      if (res.success) {
        if (res.multiple && res.data.length > 0) {
          setMultipleResults(res.data);
          setTicketData(res.data[0]); // default to first
        } else if (res.data) {
          setTicketData(res.data);
        } else {
          setErrorMsg('কোনো অভিযোগ পাওয়া যায়নি। টিকিট আইডি চেক করুন।');
        }
      } else {
        setErrorMsg(res.message || 'কোনো অভিযোগ খুঁজে পাওয়া যায়নি।');
      }
    } catch (err) {
      setErrorMsg('সার্ভারে যোগাযোগে সমস্যা হয়েছে: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    performSearch(query);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>পর্যালোচনাধীন (Pending Review)</span>
          </span>
        );
      case 'In Progress':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold border border-blue-300">
            <Clock className="w-3.5 h-3.5 text-blue-600 animate-spin" />
            <span>পদক্ষেপ প্রক্রীয়াধীন (In Progress)</span>
          </span>
        );
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>অনুমোদিত ও বরাদ্দ (Approved & Sanctioned)</span>
          </span>
        );
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>প্রত্যাখ্যাত (Rejected / Ineligible)</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-800 text-xs font-bold">
            {status}
          </span>
        );
    }
  };

  // Step calculations for progress bar
  const getStepStatus = (currentStatus) => {
    if (currentStatus === 'Rejected') {
      return { step1: 'completed', step2: 'completed', step3: 'rejected', step4: 'rejected' };
    }
    if (currentStatus === 'Approved') {
      return { step1: 'completed', step2: 'completed', step3: 'completed', step4: 'completed' };
    }
    if (currentStatus === 'In Progress') {
      return { step1: 'completed', step2: 'completed', step3: 'current', step4: 'upcoming' };
    }
    // Pending
    return { step1: 'completed', step2: 'current', step3: 'upcoming', step4: 'upcoming' };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Search Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
              অভিযোগের স্থিতি পর্যবেক্ষণ • Live Status Tracker
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            আপনার অভিযোগের অগ্রগতি ট্র্যাক করুন
          </h1>
          <p className="text-sm text-slate-500">
            টিকিট রেফারেন্স নম্বর (যেমন: BSK-2026-1001) অথবা নিবন্ধিত ১০-সংখ্যার মোবাইল নম্বর দিয়ে সার্চ করুন
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="টিকিট আইডি দিন (যেমন: BSK-2026-1001) বা মোবাইল নম্বর..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-medium"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>সন্ধান চলছে...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>স্থিতি সন্ধান করুন</span>
              </>
            )}
          </button>
        </form>

      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-800 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* If Multiple results found for a phone number */}
      {multipleResults.length > 1 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-2">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            এই ফোন নম্বরে {multipleResults.length} টি অভিযোগ নথিভুক্ত রয়েছে (Select a ticket):
          </p>
          <div className="flex flex-wrap gap-2">
            {multipleResults.map((t, idx) => (
              <button
                key={idx}
                onClick={() => setTicketData(t)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 border transition-all cursor-pointer ${
                  ticketData?.ticketId === t.ticketId
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{t.ticketId}</span>
                <span className="text-[10px] opacity-80">({t.status})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Ticket Details & Stepper */}
      {ticketData && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Main Status Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                  অভিযোগের টিকিট আইডি (Ticket ID)
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-2xl sm:text-3xl font-black font-mono text-slate-900">
                    {ticketData.ticketId}
                  </h2>
                  {getStatusBadge(ticketData.status)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>প্রিন্ট / সেভ করুন</span>
                </button>
              </div>
            </div>

            {/* Visual Stepper */}
            {(() => {
              const step = getStepStatus(ticketData.status);
              return (
                <div className="py-2">
                  <div className="grid grid-cols-4 gap-2 sm:gap-4 relative text-center">
                    {/* Step 1 */}
                    <div className="space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/20">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-900">১. আবেদন গৃহীত</p>
                      <p className="text-[10px] text-slate-400 hidden sm:block">Submitted</p>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-2">
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                        step.step2 === 'completed'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : step.step2 === 'current'
                          ? 'bg-amber-500 text-white ring-4 ring-amber-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step.step2 === 'completed' ? <CheckCircle2 className="w-5 h-5" /> : '২'}
                      </div>
                      <p className="text-xs font-bold text-slate-900">২. পর্যালোচনাধীন</p>
                      <p className="text-[10px] text-slate-400 hidden sm:block">Pending Review</p>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-2">
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                        step.step3 === 'completed'
                          ? 'bg-emerald-600 text-white shadow-md'
                          : step.step3 === 'current'
                          ? 'bg-blue-600 text-white ring-4 ring-blue-200'
                          : step.step3 === 'rejected'
                          ? 'bg-rose-600 text-white'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step.step3 === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : step.step3 === 'rejected' ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          '৩'
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {step.step3 === 'rejected' ? '৩. তদন্ত সম্পন্ন' : '৩. প্রক্রিয়াধীন'}
                      </p>
                      <p className="text-[10px] text-slate-400 hidden sm:block">In Progress</p>
                    </div>

                    {/* Step 4 */}
                    <div className="space-y-2">
                      <div className={`w-10 h-10 mx-auto rounded-full flex items-center justify-center font-bold text-sm ${
                        step.step4 === 'completed'
                          ? 'bg-emerald-600 text-white shadow-md ring-4 ring-emerald-200'
                          : step.step4 === 'rejected'
                          ? 'bg-rose-600 text-white shadow-md ring-4 ring-rose-200'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {step.step4 === 'completed' ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : step.step4 === 'rejected' ? (
                          <XCircle className="w-5 h-5" />
                        ) : (
                          '৪'
                        )}
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        {step.step4 === 'rejected' ? '৪. প্রত্যাখ্যাত' : '৪. অনুমোদিত ও বরাদ্দ'}
                      </p>
                      <p className="text-[10px] text-slate-400 hidden sm:block">
                        {step.step4 === 'rejected' ? 'Rejected' : 'Approved & Sanctioned'}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Official MLA Office Remarks Box */}
            <div className={`p-5 rounded-2xl border ${
              ticketData.status === 'Approved'
                ? 'bg-emerald-50/80 border-emerald-300'
                : ticketData.status === 'Rejected'
                ? 'bg-rose-50/80 border-rose-300'
                : ticketData.status === 'In Progress'
                ? 'bg-blue-50/80 border-blue-300'
                : 'bg-amber-50/80 border-amber-300'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldCheck className="w-5 h-5 text-slate-800" />
                <h3 className="text-sm font-bold text-slate-900">
                  বিধায়ক দপ্তরের সরকারি মন্তব্য ও পদক্ষেপ (Official Response from MLA Office)
                </h3>
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                "{ticketData.adminRemarks || 'অভিযোগটি বিধায়ক সেবা কেন্দ্রে পর্যালোচনাধীন রয়েছে।'}"
              </p>

              {ticketData.rejectionReason && (
                <div className="mt-3 pt-3 border-t border-rose-200 text-xs text-rose-900">
                  <strong>বাতিলের কারণ (Rejection Ground):</strong> {ticketData.rejectionReason}
                </div>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-500" />
                  <span>সংশ্লিষ্ট বিভাগ: <strong>{ticketData.assignedDepartment || 'MLA Grievance Cell'}</strong></span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>দাখিলের তারিখ: <strong>{new Date(ticketData.submittedAt || ticketData.createdAt).toLocaleDateString('bn-IN')}</strong></span>
                </span>
              </div>
            </div>

            {/* Details Cards Grid */}
            <div className="grid md:grid-cols-2 gap-6 pt-2">
              {/* Problem Details */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <FileText className="w-4 h-4 text-emerald-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    অভিযোগ ও সমস্যার বিবরণ
                  </h4>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs text-slate-400 block">বিষয়শ্রেণী (Category):</span>
                    <strong className="text-emerald-700 font-bold">{ticketData.problemType}</strong>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">বিষয় (Subject):</span>
                    <p className="font-bold text-slate-900">{ticketData.subject}</p>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block">পূর্ণ বিবরণ (Description):</span>
                    <p className="text-slate-700 text-xs leading-relaxed">{ticketData.description}</p>
                  </div>
                  
                  {/* Crucial Section: Relief Needed */}
                  <div className="bg-amber-100/60 p-3 rounded-xl border border-amber-200">
                    <span className="text-xs font-bold text-amber-900 block">
                      কী ধরণের সুরাহা চাওয়া হয়েছে (Relief Needed):
                    </span>
                    <p className="text-xs text-amber-950 font-medium mt-1">
                      {ticketData.reliefNeeded}
                    </p>
                  </div>
                </div>
              </div>

              {/* Citizen & Location Details */}
              <div className="space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    নাগরিক ও এলাকার বিবরণ
                  </h4>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">আবেদনকারী:</span>
                    <strong className="text-slate-900 text-sm">{ticketData.citizen?.name}</strong>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 block">মোবাইল:</span>
                      <strong className="text-slate-800 font-mono">{ticketData.citizen?.phone}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">ভোটার আইডি / আধার:</span>
                      <strong className="text-slate-800 font-mono">
                        {ticketData.citizen?.voterId || (ticketData.citizen?.aadhaarLast4 ? `XXXX-XXXX-${ticketData.citizen?.aadhaarLast4}` : 'প্রদত্ত নয়')}
                      </strong>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 block">ওয়ার্ড বা গ্রাম পঞ্চায়েত:</span>
                    <strong className="text-blue-700 text-sm">{ticketData.placeDetails?.wardOrPanchayat}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block">গ্রাম / পাড়া ও ল্যান্ডমার্ক:</span>
                    <strong className="text-slate-800">{ticketData.placeDetails?.villageOrArea}</strong>
                    {ticketData.placeDetails?.landmark && (
                      <span className="text-slate-500"> (ল্যান্ডমার্ক: {ticketData.placeDetails.landmark})</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block">পিন কোড:</span>
                    <span className="font-mono text-slate-700">{ticketData.placeDetails?.pinCode || '700150'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action History Timeline */}
            {ticketData.actionHistory && ticketData.actionHistory.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-slate-200">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>পদক্ষেপের ইতিবৃত্ত (Action Timeline Log)</span>
                </h4>
                <div className="space-y-2">
                  {ticketData.actionHistory.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-3 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-slate-800">{item.status}</span>
                          <span className="text-slate-400 text-[10px]">
                            {new Date(item.updatedAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-600 mt-0.5">{item.remarks}</p>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          দ্বারা: {item.updatedBy}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
