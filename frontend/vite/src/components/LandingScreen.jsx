import React from 'react';
import { Users, MessageSquare, FileCheck, Layers, UserCheck, Printer, Award, User, ArrowLeft, Search, Sparkles } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function LandingScreen({ initChatSession, handleSendMessage }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  // URL-based page tracking (as passed from App.jsx is not strictly needed if we use internal state or router)
  const isSessionToggle = window.location.pathname === '/session-toggle';

  if (isSessionToggle) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-12 animate-fade-in no-print">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Choose Session Mode / सत्र मोड चुनें</h2>
          <p className="text-slate-500">Select who is operating NagarikSaathi to customize the dashboard view.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4">
          <div 
            onClick={() => { initChatSession('operator'); navigate('/chat'); }}
            className="p-8 bg-white border border-slate-200 hover:border-amber-600/50 hover:bg-slate-50/50 rounded-2xl cursor-pointer shadow-sm transition-all flex flex-col items-center text-center space-y-4 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 group-hover:bg-amber-100/50 border border-amber-100 flex items-center justify-center transition-colors">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">CSC / VLE Operator Mode</h3>
              <p className="text-xs text-amber-600 font-mono tracking-widest uppercase font-bold">RECOMMENDED FOR DEMO</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                I am helping a citizen find schemes. Shows operator live stats, printable summary outputs, and metrics.
              </p>
            </div>
          </div>

          <div 
            onClick={() => { initChatSession('self'); navigate('/chat'); }}
            className="p-8 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-2xl cursor-pointer shadow-sm transition-all flex flex-col items-center text-center space-y-4 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Citizen Mode (Self)</h3>
              <p className="text-xs text-gray-500 font-mono tracking-widest uppercase font-bold">INDIVIDUAL SEARCH</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                I am asking for myself. A clean, minimal search view for standard citizens to look up criteria directly.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home / पीछे जाएं
          </button>
        </div>
      </div>
    );
  }

  // Normal Landing Page
  return (
    <div className="space-y-16 animate-fade-in no-print pb-12">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 text-white shadow-2xl">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-amber-900/40 z-0" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl z-0" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-green-500/20 rounded-full blur-3xl z-0" />

        <div className="relative z-10 px-6 py-16 md:py-24 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-amber-300 text-xs font-bold tracking-widest uppercase backdrop-blur-md">
            <Sparkles className="w-4 h-4" /> Empowering Rural India
          </div>
          
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-tight">
            {t.heroTitle1} <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
              {t.heroTitle2}
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            {t.heroSubtitle}
          </p>

          {/* Search Bar & Primary Actions */}
          <div className="max-w-2xl mx-auto mt-8 bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-xl">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder={t.searchPlaceholder}
                className="w-full bg-transparent border-none text-white px-12 py-4 focus:outline-none focus:ring-0 placeholder-slate-400 text-lg"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    initChatSession('self');
                    setTimeout(() => {
                      handleSendMessage(null, e.target.value.trim());
                    }, 100);
                  }
                }}
              />
            </div>
            <button 
              onClick={() => navigate('/session-toggle')}
              className="px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-900 shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <MessageSquare className="w-5 h-5" />
              {t.aiSaathi}
            </button>
          </div>
          
          <div className="pt-4 flex justify-center">
             <button 
                onClick={() => navigate('/screener')}
                className="text-amber-200 hover:text-white underline underline-offset-4 text-sm font-medium transition-colors"
              >
                Or try the detailed Eligibility Screener
              </button>
          </div>
        </div>
      </div>

      {/* Quick-start Pills */}
      <div className="max-w-5xl mx-auto space-y-6">
        <h3 className="text-center text-sm font-bold tracking-widest text-slate-400 uppercase">
          Quick Category Search / त्वरित श्रेणियां
        </h3>
        <div className="flex flex-wrap justify-center gap-4">
          {[
            { en: "Agriculture", hi: "कृषि", query: "Show me farming schemes like PM Kisan" },
            { en: "Women Welfare", hi: "महिला कल्याण", query: "Schemes for girls and women livelihood" },
            { en: "Pension & Security", hi: "पेंशन और सुरक्षा", query: "Old age pension and life insurance" },
            { en: "Health", hi: "स्वास्थ्य", query: "Free treatment and hospital coverage" },
            { en: "Education & Skills", hi: "शिक्षा और कौशल", query: "Scholarships for students" }
          ].map((cat, idx) => (
            <button
              key={idx}
              onClick={() => {
                initChatSession('self');
                navigate('/chat');
                setTimeout(() => {
                  handleSendMessage(null, cat.query);
                }, 100);
              }}
              className="px-6 py-3 rounded-xl bg-white border border-slate-200 hover:border-amber-500 hover:shadow-md text-slate-700 transition-all font-medium text-sm flex items-center gap-3"
            >
              <Layers className="w-4 h-4 text-amber-500" />
              <span>{lang === 'hi' ? cat.hi : cat.en}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Premium Info Cards */}
      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto pt-8">
        {[
          {
            icon: <UserCheck className="w-7 h-7 text-amber-600" />,
            title: "Operator-First Workflow",
            desc: "Optimized interface for CSC operators to handle high citizen traffic, tracking match speeds and counts."
          },
          {
            icon: <Printer className="w-7 h-7 text-amber-600" />,
            title: "Printable Scheme Sheets",
            desc: "Generate clean physical handouts with clear document checklists for citizens to take home."
          },
          {
            icon: <Award className="w-7 h-7 text-amber-600" />,
            title: "Verified Metadata",
            desc: "Every recommendation shows an official verification date badge linked directly to official portals."
          }
        ].map((card, idx) => (
          <div key={idx} className="p-8 bg-white border border-slate-100 rounded-2xl space-y-4 transition-all hover:shadow-xl shadow-sm group">
            <div className="w-14 h-14 rounded-xl bg-amber-50 group-hover:bg-amber-100 flex items-center justify-center transition-colors">
              {card.icon}
            </div>
            <h4 className="text-xl font-bold text-slate-900">{card.title}</h4>
            <p className="text-slate-500 leading-relaxed font-medium">{card.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
