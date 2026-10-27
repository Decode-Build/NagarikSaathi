import React from 'react';
import { Menu, ShieldCheck, Globe, Wifi } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Header({ toggleSidebar }) {
  const { lang, setLang } = useLanguage();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print shadow-xs">
      {/* Indian National Tricolor Ribbon */}
      <div className="h-1 w-full flex">
        <div className="w-1/3 bg-[#FF9933]" />
        <div className="w-1/3 bg-white" />
        <div className="w-1/3 bg-[#138808]" />
      </div>

      <div className="h-16 flex items-center justify-between px-4 sm:px-6">
        {/* Left: Mobile Toggle & Portal Identity */}
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleSidebar}
            className="p-2 -ml-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg md:hidden"
            aria-label="Toggle navigation"
          >
            <Menu size={22} />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-700 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs border border-blue-800">
              ना
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-base sm:text-lg font-display">
                  NagarikSaathi
                </span>
                <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  नागरिक साथी
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block font-medium">
                {lang === 'hi' ? 'राष्ट्रीय कल्याणकारी योजना एवं आवेदन पूर्ति मंच' : 'National Welfare Scheme Discovery & Fulfillment Platform'}
              </p>
            </div>
          </div>
        </div>

        {/* Right: Live Operator Status & Language Switcher */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* CSC Center Online Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>CSC Sehore Center</span>
            <span className="text-emerald-400">|</span>
            <span className="font-mono text-[11px] text-emerald-700">ID: MP-CSC-8921</span>
          </div>

          {/* Bilingual Switcher */}
          <div className="bg-slate-100 p-1 rounded-lg border border-slate-200 flex items-center shadow-2xs">
            <button
              onClick={() => { if (lang !== 'en') { setLang('en'); localStorage.setItem('appLang', 'en'); } }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                lang === 'en' 
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>EN</span>
              <span className="text-[10px] font-normal opacity-70">English</span>
            </button>
            <button
              onClick={() => { if (lang !== 'hi') { setLang('hi'); localStorage.setItem('appLang', 'hi'); } }}
              className={`px-3 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 ${
                lang === 'hi' 
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200 font-extrabold' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>HI</span>
              <span className="text-[10px] font-normal opacity-70">हिंदी</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
