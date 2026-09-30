import React from 'react';
import { Building2, PhoneCall, Mail, MapPin, ShieldCheck, Award } from 'lucide-react';

export default function Footer({ setActiveTab }) {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-10 pb-8 border-t-2 border-orange-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Identity */}
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 text-white flex items-center justify-center font-bold shadow-md shadow-orange-500/20">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-base font-black text-white">
                  বিধায়ক সেবা কেন্দ্র (BSK)
                </span>
                <p className="text-xs text-orange-300">
                  মাননীয় বিধায়ক শ্রী প্রশান্ত দিগর (BJP) • ২০১ গোগঘাট বিধানসভা, হুগলী
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              গোগঘাট ১ ও গোগঘাট ২ ব্লকের ১৬টি গ্রাম পঞ্চায়েতের সাধারণ মানুষের প্রয়োজনে সার্বক্ষণিক নাগরিক সেবা পোর্টাল। স্বচ্ছ প্রশাসন, অন্ত্যোদয় ও দ্রুত সমাধানের লক্ষ্যে এই অনলাইন উদ্যোগ।
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs text-orange-400 font-semibold">
              <ShieldCheck className="w-4 h-4 text-orange-500" />
              <span>জনগণের দরবারে গোগঘাট বিধানসভা সেবা কেন্দ্র</span>
            </div>
          </div>

          {/* Quick links */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              দ্রুত লিঙ্ক
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  হোম (Home)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('complaint')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  অভিযোগ দায়ের (New Ticket)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('track')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  টিকিট সন্ধান (Track Status)
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('admin')}
                  className="hover:text-orange-400 transition-colors cursor-pointer"
                >
                  বিধায়ক অফিস কন্ট্রোল
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              যোগাযোগ ও কার্যালয়
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-400 shrink-0 mt-0.5" />
                <span>বিধায়ক মুখ্য কার্যালয়, কামারপুকুর - গোগঘাট লিঙ্ক রোড, হুগলী, পিন - ৭১২৬১৪</span>
              </div>
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-orange-400 shrink-0" />
                <span>হেল্পলাইন: 03211-255014</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-orange-400 shrink-0" />
                <span>ইমেল: mla@seva.gov.in</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-4 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} বিধায়ক সেবা কেন্দ্র, ২০১ গোগঘাট বিধানসভা (হুগলী)। সর্বস্বত্ব সংরক্ষিত।</p>
          <span className="text-orange-400/80 font-medium">মাননীয় বিধায়ক শ্রী প্রশান্ত দিগর (BJP) কার্যালয়</span>
        </div>
      </div>
    </footer>
  );
}
