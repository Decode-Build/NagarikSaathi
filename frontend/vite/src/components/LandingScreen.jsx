import React from 'react';
import { Users, MessageSquare, FileCheck, Layers, UserCheck, Printer, Award, User, ArrowLeft } from 'lucide-react';

export default function LandingScreen({ page, setPage, t, langMode, initChatSession, handleSendMessage }) {
  if (page === 'landing') {
    return (
      <div className="space-y-12 animate-fade-in no-print">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-6 pt-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-700 text-xs font-semibold tracking-wide uppercase">
            <Users className="w-3.5 h-3.5 text-amber-600" /> For CSC/VLE Operators & Rural Communities
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-slate-900 leading-tight font-display">
            {t[langMode].heroTitle} <br />
            <span className="text-amber-600 font-display">
              {t[langMode].heroSubTitle}
            </span>
          </h1>
          <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto">
            {t[langMode].heroDesc}
          </p>

          {/* Two CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button 
              onClick={() => setPage('session-toggle')}
              className="px-8 py-4 rounded-xl font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2 group text-base"
            >
              <MessageSquare className="w-5 h-5 group-hover:rotate-6 transition-transform" />
              {t[langMode].startChat}
            </button>
            
            <button 
              onClick={() => setPage('screener')}
              className="px-8 py-4 rounded-xl font-bold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-base shadow-sm"
            >
              <FileCheck className="w-5 h-5 text-slate-500" />
              {t[langMode].checkEligibility}
            </button>
          </div>
        </div>

        {/* Quick-start Pills */}
        <div className="max-w-4xl mx-auto space-y-4">
          <h3 className="text-center text-xs font-bold tracking-wider text-slate-400 uppercase">
            Quick Category Search / त्वरित श्रेणियां
          </h3>
          <div className="flex flex-wrap justify-center gap-3">
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
                  setTimeout(() => {
                    handleSendMessage(null, cat.query);
                  }, 100);
                }}
                className="px-5 py-2.5 rounded-full bg-white border border-slate-200 hover:border-amber-600/50 hover:bg-slate-50 text-slate-700 transition-all text-sm flex items-center gap-2 shadow-sm"
              >
                <Layers className="w-3.5 h-3.5 text-amber-600" />
                <span>{langMode === 'hi' ? cat.hi : cat.en}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Premium Info Cards */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto pt-6">
          {[
            {
              icon: <UserCheck className="w-6 h-6 text-amber-600" />,
              title: "Operator-First Workflow",
              desc: "Optimized interface for CSC operators to handle high citizen traffic, tracking match speeds and counts."
            },
            {
              icon: <Printer className="w-6 h-6 text-amber-600" />,
              title: "Printable Scheme Sheets",
              desc: "Generate clean physical handouts with clear document checklists for Meena Devi to take home."
            },
            {
              icon: <Award className="w-6 h-6 text-amber-700" />,
              title: "Verified Metadata",
              desc: "Every recommendation shows an official verification date badge linked directly to official portals."
            }
          ].map((card, idx) => (
            <div key={idx} className="p-6 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl space-y-3 transition-all hover:translate-y-[-2px] shadow-sm">
              <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100">
                {card.icon}
              </div>
              <h4 className="text-lg font-bold text-slate-900">{card.title}</h4>
              <p className="text-sm text-slate-500 leading-relaxed">{card.desc}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (page === 'session-toggle') {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-12 animate-fade-in no-print">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Choose Session Mode / सत्र मोड चुनें</h2>
          <p className="text-slate-500">Select who is operating NagarikSaathi to customize the dashboard view.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-4">
          {/* Option A: Operator Mode */}
          <div 
            onClick={() => initChatSession('operator')}
            className="p-8 bg-white border border-slate-200 hover:border-amber-600/50 hover:bg-slate-50/50 rounded-2xl cursor-pointer shadow-sm transition-all flex flex-col items-center text-center space-y-4 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-50 group-hover:bg-amber-100/50 border border-amber-100 flex items-center justify-center transition-colors">
              <Users className="w-8 h-8 text-amber-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">CSC / VLE Operator Mode</h3>
              <p className="text-xs text-amber-600 font-mono tracking-widest uppercase font-bold">RECOMMENDED FOR DEMO</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                I am helping a citizen (e.g., Meena Devi) find schemes. Shows operator live stats strip, quick printable summary outputs, and session metrics.
              </p>
            </div>
          </div>

          {/* Option B: Self-service Mode */}
          <div 
            onClick={() => initChatSession('self')}
            className="p-8 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 rounded-2xl cursor-pointer shadow-sm transition-all flex flex-col items-center text-center space-y-4 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
              <User className="w-8 h-8 text-slate-400" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-900">Citizen Mode (Self)</h3>
              <p className="text-xs text-slate-400 font-mono tracking-widest uppercase font-bold">INDIVIDUAL SEARCH</p>
              <p className="text-sm text-slate-500 leading-relaxed">
                I am asking for myself. A clean, minimal search view for standard citizens to look up criteria directly.
              </p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <button 
            onClick={() => setPage('landing')}
            className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home / पीछे जाएं
          </button>
        </div>
      </div>
    );
  }

  return null;
}
