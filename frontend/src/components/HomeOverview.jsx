import React from 'react';
import { 
  FileText, 
  Search, 
  ShieldCheck, 
  ArrowRight, 
  PhoneCall, 
  MapPin, 
  Lightbulb, 
  Droplet, 
  Building, 
  HeartHandshake, 
  AlertCircle,
  Stethoscope,
  Sparkles,
  Phone,
  CheckCircle,
  Clock,
  Compass,
  Award,
  Users,
  MessageSquare
} from 'lucide-react';
import { GOGHAT_GRAM_PANCHAYATS } from '../data/goghatData';

export default function HomeOverview({ setActiveTab, citizenUser, onOpenCitizenAuth }) {
  // 3 Key Leaders
  const leaders = [
    {
      name: 'শ্রী নরেন্দ্র মোদী',
      title: 'মাননীয় প্রধানমন্ত্রী, ভারত সরকার',
      role: 'Hon\'ble Prime Minister of India',
      image: '/leaders/narendra_modi.jpg',
      motto: 'সবকা সাথ, সবকা বিকাশ, সবকা বিশ্বাস, সবকা প্রয়াস',
      badge: 'রাষ্ট্রনেতা'
    },
    {
name: 'শ্রী শুভেন্দু অধিকারী',
title: 'মাননীয় মুখ্যমন্ত্রী',
role: 'Chief Minister, Government of West Bengal',
image: '/leaders/suvendu_adhikari.jpg',
motto: 'গণতন্ত্র প্রতিষ্ঠা ও বাংলার মানুষের সার্বিক অধিকার রক্ষায় অবিচল সংগ্রাম',
badge: 'মুখ্যমন্ত্রী'

    },
    {
      name: 'শ্রী প্রশান্ত দিগর',
      title: 'মাননীয় বিধায়ক, ২০১ গোগঘাট বিধানসভা কেন্দ্র',
      role: 'Hon\'ble MLA, Goghat (BJP)',
      image: '/leaders/prashanta_digar.jpg',
      motto: 'গোগঘাটের ১৬টি পঞ্চায়েতের প্রতিটি নাগরিকের সেবা ও পরিকাঠামো উন্নয়নে নিবেদিত',
      badge: 'স্থানীয় বিধায়ক'
    }
  ];

  const serviceCategories = [
    { 
      title: 'রাস্তা ও গ্রামীণ পরিকাঠামো', 
      en: 'Roads & Rural Infrastructure', 
      icon: Building, 
      desc: 'পাকা রাস্তা সংস্কার, কালভার্ট মেরামত, গ্রামীণ ঢালাই রাস্তা ও সেতু সংক্রান্ত সমস্যা।' 
    },
    { 
      title: 'বিশুদ্ধ পানীয় জল সরবরাহ', 
      en: 'Drinking Water Supply (PHE)', 
      icon: Droplet, 
      desc: 'জনস্বাস্থ্য কারিগরি পাইপলাইন, নলকূপ মেরামত ও আর্সেনিকমুক্ত পানীয় জলের সুবিধা।' 
    },
    { 
      title: 'বিদ্যুৎ ও সৌর স্ট্রিট লাইট', 
      en: 'Electricity & Street Lighting', 
      icon: Lightbulb, 
      desc: 'কৃষি ট্রান্সফরমার, লো-ভোল্টেজ সমাধান, খুঁটি ও গ্রামীণ রাস্তায় আলোর ব্যবস্থা।' 
    },
    { 
      title: 'নিকাশি ও নর্দমা ব্যবস্থা', 
      en: 'Drainage & Sanitation', 
      icon: AlertCircle, 
      desc: 'নর্দমার জল নিষ্কাশন, বর্ষার জমা জল অপসারণ ও পলি পরিষ্কারের সরকারি উদ্যোগ।' 
    },
    { 
      title: 'স্বাস্থ্য ও গ্রামীণ হাসপাতাল', 
      en: 'Healthcare & Rural Hospitals', 
      icon: Stethoscope, 
      desc: 'কামারপুকুর গ্রামীণ হাসপাতাল ও গোগঘাট ব্লক স্বাস্থ্যকেন্দ্রে ওষুধ ও জরুরি পরিষেবা।' 
    },
    { 
      title: 'কৃষি ও সেচ সহায়তা', 
      en: 'Agriculture & Irrigation Relief', 
      icon: Compass, 
      desc: 'বোরো ও আমন চাষে সেচের জল, পাম্পের বিদ্যুৎ ও কৃষক কল্যাণ প্রকল্পের সুযোগ।' 
    }
  ];

  return (
    <div className="space-y-12 pb-16">
      {/* ======================================================== */}
      {/* 1. HERO SECTION - BJP SAFFRON CIVIC PORTAL               */}
      {/* ======================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-600 via-amber-600 to-orange-700 text-white shadow-2xl px-6 py-12 sm:px-12 sm:py-16">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
        
        {/* Tricolor decorative top stripe */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-orange-400 via-white to-emerald-400 opacity-90" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 border border-white/30 text-white text-xs sm:text-sm font-black backdrop-blur shadow-xs">
            <Sparkles className="w-4 h-4 text-amber-200" />
            <span>ভারতীয় জনতা পার্টি • গোগঘাট বিধানসভা কেন্দ্র (AC 201), হুগলী</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-sm">
            জনসেবায় নিবেদিত <br />
            <span className="text-amber-200">বিধায়ক সেবা কেন্দ্র</span>
          </h1>

          <p className="text-base sm:text-xl text-orange-50 max-w-3xl mx-auto font-normal leading-relaxed">
            মাননীয় বিধায়ক <strong>শ্রী প্রশান্ত দিগর</strong>-এর প্রত্যক্ষ উদ্যোগে গোগঘাট ১ ও গোগঘাট ২ ব্লকের সকল নাগরিকের অভাব-অভিযোগ ও দাবি সরাসরি নথিভুক্তির ডিজিটাল প্ল্যাটফর্ম।
          </p>

          {/* Action CTAs */}
          <div className="pt-4 flex flex-wrap justify-center items-center gap-4">
            <button
              onClick={() => {
                if (!citizenUser) {
                  onOpenCitizenAuth?.();
                } else {
                  setActiveTab('complaint');
                }
              }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-2xl bg-white hover:bg-orange-50 text-orange-950 font-black text-base shadow-xl shadow-orange-900/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <FileText className="w-5 h-5 text-orange-600" />
              <span>অভিযোগ ও আবেদন দায়ের করুন</span>
              <ArrowRight className="w-4 h-4 text-orange-600" />
            </button>

            {citizenUser ? (
              <button
                onClick={() => setActiveTab('my-complaints')}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-900/40 hover:bg-orange-900/60 text-white border border-white/30 font-bold text-base backdrop-blur transition-all cursor-pointer"
              >
                <CheckCircle className="w-5 h-5 text-amber-300" />
                <span>আমার পূর্ববর্তী অভিযোগসমূহ</span>
              </button>
            ) : (
              <button
                onClick={() => onOpenCitizenAuth?.()}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-orange-900/40 hover:bg-orange-900/60 text-white border border-white/30 font-bold text-base backdrop-blur transition-all cursor-pointer"
              >
                <Phone className="w-5 h-5 text-amber-300" />
                <span>নাগরিক লগইন / ওটিপি</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('admin')}
              className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold text-xs transition-all cursor-pointer shadow-md"
            >
              <ShieldCheck className="w-4 h-4 text-orange-400" />
              <span>বিধায়ক অফিস কন্ট্রোল</span>
            </button>
          </div>

          {/* Constituency Helpline Banner */}
          <div className="pt-6 border-t border-orange-400/40 flex flex-wrap justify-center items-center gap-6 text-xs sm:text-sm text-orange-100">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-amber-200" />
              <span>বিধায়ক কার্যালয় হেল্পলাইন: <strong>03211-255014</strong></span>
            </div>
            <div className="hidden sm:inline">•</div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-200" />
              <span>প্রধান কার্যালয়: কামারপুকুর - গোগঘাট লিঙ্ক রোড, হুগলী, ৭১২৬১৪</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 2. LEADERSHIP GALLERY - MODI, SUVENDU, PRASHANTA DIGAR   */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-100 text-orange-900 text-xs font-black uppercase tracking-wider">
            <Award className="w-3.5 h-3.5 text-orange-600" />
            <span>প্রেরণা ও নেতৃত্ব (Leadership)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            জনসেবায় অনুপ্রেরণা ও বলিষ্ঠ নেতৃত্ব
          </h2>
          <p className="text-slate-600 text-xs sm:text-sm">
            অন্ত্যোদয় ও স্বচ্ছ সুশাসনের আদর্শে গোগঘাটের সাধারণ মানুষের উন্নয়নে প্রতিজ্ঞাবদ্ধ
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {leaders.map((leader, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl border-2 border-orange-200/80 shadow-md hover:shadow-xl hover:border-orange-500 transition-all duration-300 overflow-hidden flex flex-col group"
            >
              {/* Leader Photo with BJP Kesari Overlay */}
              <div className="relative h-72 sm:h-80 overflow-hidden bg-gradient-to-b from-orange-100 to-amber-50">
                <img 
                  src={leader.image} 
                  alt={leader.name}
                  className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    // Fallback to placeholder if local image issue
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80';
                  }}
                />
                
                {/* Badge Overlay */}
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-orange-600 to-amber-600 text-white text-[11px] font-black uppercase tracking-wider shadow-md">
                    {leader.badge}
                  </span>
                </div>

                {/* Saffron gradient bottom vignette */}
                <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent" />
                
                <div className="absolute bottom-3 left-4 right-4 text-white">
                  <h3 className="text-lg font-black leading-tight drop-shadow-sm">
                    {leader.name}
                  </h3>
                  <p className="text-xs text-amber-200 font-semibold drop-shadow-xs">
                    {leader.title}
                  </p>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-3 bg-gradient-to-b from-white to-orange-50/30">
                <div>
                  <span className="text-[11px] font-bold text-orange-700 tracking-wide block uppercase">
                    {leader.role}
                  </span>
                  <p className="text-xs text-slate-700 mt-2 italic font-medium leading-relaxed bg-orange-50 p-3 rounded-xl border border-orange-200">
                    "{leader.motto}"
                  </p>
                </div>

                <div className="pt-2 border-t border-orange-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1 text-orange-700 font-bold">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>সার্বক্ষণিক নাগরিক পাশে</span>
                  </span>
                  <span className="font-bold text-slate-700">গোগঘাট AC 201</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 3. MLA PRASHANTA DIGAR'S SPECIAL MESSAGE CARD             */}
      {/* ======================================================== */}
      <section className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 rounded-3xl p-6 sm:p-8 border-2 border-orange-300 shadow-sm">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 border-4 border-orange-500 shadow-lg">
            <img 
              src="/leaders/prashanta_digar.jpg" 
              alt="মাননীয় বিধায়ক শ্রী প্রশান্ত দিগর" 
              className="w-full h-full object-cover object-top"
            />
          </div>

          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-600 text-white text-xs font-black uppercase">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>বিধায়কের সরাসরি বার্তা (MLA's Direct Message)</span>
            </div>
            
            <h3 className="text-xl sm:text-2xl font-black text-slate-900">
              "গোগঘাটের প্রতিটি মানুষের সমস্যা আমার নিজের সমস্যা।"
            </h3>
            
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
              গোগঘাট ১ ও গোগঘাট ২ ব্লকের কোনো নাগরিককে আর অভিযোগ নিয়ে সরকারি দপ্তরে দপ্তরে ঘুরতে হবে না। পানীয় জল, ভাঙা রাস্তা, বিদ্যুৎ বা চিকিৎসা—যেকোনো প্রয়োজনে এই বিধায়ক সেবা কেন্দ্রে আপনার সমস্যা সরাসরি জানান। আমার দপ্তর প্রতিটি আবেদনের গুরুত্ব অনুযায়ী যথাযথ ব্যবস্থা গ্রহণ করবে।
            </p>

            <div className="pt-1 flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-bold text-orange-950">
              <span>— <strong>শ্রী প্রশান্ত দিগর</strong>, মাননীয় বিধায়ক, ২০১ গোগঘাট বিধানসভা</span>
              <span className="hidden sm:inline">•</span>
              <span className="text-orange-700 font-mono">মোবাইল / হেল্পলাইন: 03211-255014</span>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 4. THREE STEP PROCESS - CITIZEN FRIENDLY                 */}
      {/* ======================================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
            নাগরিকদের জন্য সহজ ৩টি পদক্ষেপ
          </h2>
          <p className="text-slate-600 text-sm">
            গোগঘাট বিধানসভার যেকোনো পঞ্চায়েত ও পাড়ার নাগরিক ঘরে বসেই সরাসরি আবেদন পাঠাতে পারেন
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl border-2 border-orange-200/80 p-6 relative shadow-xs hover:border-orange-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-black text-xl mb-4 border border-orange-300">
              ১
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              মোবাইল ও পাসওয়ার্ড দিয়ে লগইন
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার ১০ সংখ্যার মোবাইল নম্বর দিয়ে লগইন করুন। একবার লগইন করলে ৭ দিন পর্যন্ত সেশন স্বয়ংক্রিয়ভাবে সক্রিয় থাকবে।
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-200/80 p-6 relative shadow-xs hover:border-orange-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-black text-xl mb-4 border border-amber-300">
              ২
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              পঞ্চায়েত ও গ্রাম বেছে অভিযোগ জানান
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার পঞ্চায়েত নির্বাচন করলেই স্বয়ংক্রিয়ভাবে গ্রামের তালিকা চলে আসবে। সমস্যা বিস্তারিত লিখে কী সুরাহা চান তা জানান।
            </p>
          </div>

          <div className="bg-white rounded-2xl border-2 border-orange-200/80 p-6 relative shadow-xs hover:border-orange-500 hover:shadow-md transition-all">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-xl mb-4 border border-emerald-300">
              ৩
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              ব্যক্তিগত ড্যাশবোর্ডে স্থিতি পর্যবেক্ষণ
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              আপনার আবেদনের অগ্রগতি কেবলমাত্র আপনি লগইন করে দেখতে পারবেন। সাধারণ কোনো ব্যবহারকারীর কাছে কোনো নাগরিকের ব্যক্তিগত ডাটা দৃশ্যমান নয়।
            </p>
          </div>
        </div>
      </section>

      {/* ======================================================== */}
      {/* 5. GOGHAT CIVIC SERVICE AREAS                            */}
      {/* ======================================================== */}
      <section className="bg-orange-50/40 rounded-3xl p-6 sm:p-8 border border-orange-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              পরিষেবার আওতাভুক্ত ক্ষেত্রসমূহ
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              গোগঘাট ১ ও গোগঘাট ২ ব্লকের নিম্নলিখিত পরিষেবা সংক্রান্ত যেকোনো অভাব-অভিযোগ জানাতে পারেন
            </p>
          </div>
          <button
            onClick={() => {
              if (!citizenUser) onOpenCitizenAuth?.();
              else setActiveTab('complaint');
            }}
            className="text-xs font-bold text-orange-700 hover:text-orange-800 flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-orange-300 shadow-2xs"
          >
            <span>আবেদন শুরু করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceCategories.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div 
                key={idx}
                className="p-5 rounded-2xl bg-white border border-orange-200/80 space-y-2 hover:border-orange-500 hover:shadow-xs transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center font-bold">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    {item.title}
                  </h4>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {item.en}
                  </span>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ======================================================== */}
      {/* 6. CONSTITUENCY DETAILS & 16 GRAM PANCHAYATS COVERED     */}
      {/* ======================================================== */}
      <section className="bg-white rounded-3xl border border-orange-200 p-6 sm:p-8 shadow-xs">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-orange-600"></span>
            <h3 className="text-lg font-black text-slate-900">
              গোগঘাট বিধানসভার আওতাভুক্ত ১৬টি গ্রাম পঞ্চায়েত (Official 16 Gram Panchayats)
            </h3>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            গোগঘাট বিধানসভা কেন্দ্র (AC 201), হুগলীর অন্তর্গত ১৬টি গ্রাম পঞ্চায়েত এবং ১৪১টি তালিকাভুক্ত গ্রামের প্রতিটি নাগরিকের নাগরিক অধিকার ও অভাব-অভিযোগ বিধায়ক সেবা কেন্দ্রের মাধ্যমে সরাসরি নথিভুক্ত করা হয়।
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2">
            {GOGHAT_GRAM_PANCHAYATS.map((gp, i) => (
              <div 
                key={i} 
                className="px-3 py-2 bg-orange-50/50 hover:bg-orange-100 hover:border-orange-400 transition-all text-orange-950 rounded-xl text-xs font-semibold border border-orange-200 flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-orange-600"></span>
                <span>{gp} GP</span>
              </div>
            ))}
          </div>
          <div className="text-[11px] text-slate-500 font-medium pt-1">
            * মোট ১৪১টি তালিকাভুক্ত গ্রাম (আদ্রা, কামারপুকুর, বদনগঞ্জ, ঝরিয়া, বালি, ইত্যাদি) সরাসরি এই সেবার আওতায় অন্তর্ভুক্ত। পঞ্চায়েত নির্বাচন করলেই সংশ্লিষ্ট গ্রামের তালিকা স্বয়ংক্রিয়ভাবে ফিল্টার হবে।
          </div>
        </div>
      </section>
    </div>
  );
}
