import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Search, 
  Sparkles, 
  Mic, 
  RefreshCw, 
  ShieldCheck, 
  Landmark, 
  Wheat, 
  HeartHandshake, 
  TrendingUp, 
  GraduationCap, 
  ArrowRight,
  User,
  ArrowLeft,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function LandingScreen({ 
  initChatSession, 
  handleSendMessage,
  startVoiceInput,
  isListening,
  isAudioProcessing 
}) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const isSessionToggle = window.location.pathname === '/session-toggle';

  if (isSessionToggle) {
    return (
      <div className="max-w-3xl mx-auto space-y-8 py-12 px-4 animate-fade-in no-print">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold tracking-wide uppercase font-mono">
            🏛️ Role Configuration
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Choose Session Mode / सत्र मोड चुनें
          </h2>
          <p className="text-slate-600 text-sm max-w-md mx-auto">
            Select who is operating NagarikSaathi to optimize metrics, analytics, and printable outputs.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6 pt-2">
          {/* CSC Operator Card */}
          <div 
            onClick={() => { initChatSession('operator'); navigate('/chat'); }}
            className="p-8 bg-white border-2 border-slate-200 hover:border-blue-600 hover:shadow-xl rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center space-y-4 group relative overflow-hidden"
          >
            <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-extrabold border border-emerald-200">
              RECOMMENDED FOR DEMO
            </div>
            <div className="w-16 h-16 rounded-2xl bg-blue-50 group-hover:bg-blue-600 group-hover:text-white text-blue-600 border border-blue-100 flex items-center justify-center transition-all shadow-xs">
              <Users className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900 group-hover:text-blue-700 transition-colors">
                CSC / VLE Operator Mode
              </h3>
              <p className="text-xs text-blue-700 font-bold uppercase tracking-wider font-mono">
                Village Level Entrepreneur
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Assisting rural citizens. Enables VLE fee schedule, printable scheme handouts, live impact analytics, and application registries.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-blue-700 inline-flex items-center gap-1">
              Launch Operator Console <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Citizen Self Card */}
          <div 
            onClick={() => { initChatSession('self'); navigate('/chat'); }}
            className="p-8 bg-white border-2 border-slate-200 hover:border-slate-400 hover:shadow-lg rounded-2xl cursor-pointer transition-all flex flex-col items-center text-center space-y-4 group"
          >
            <div className="w-16 h-16 rounded-2xl bg-slate-100 group-hover:bg-slate-200 text-slate-700 border border-slate-200 flex items-center justify-center transition-all">
              <User className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-extrabold text-slate-900">
                Citizen Direct Search
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider font-mono">
                Individual Beneficiary
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Personal scheme look-up. Simplified minimal conversational flow for direct queries on scholarships, loans, and pensions.
              </p>
            </div>
            <div className="pt-2 text-xs font-bold text-slate-700 inline-flex items-center gap-1">
              Start Citizen Session <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </div>

        <div className="text-center pt-2">
          <button 
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors font-semibold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home / पीछे जाएं
          </button>
        </div>
      </div>
    );
  }

  // Primary Landing Page
  return (
    <div className="space-y-12 animate-fade-in no-print pb-16 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* National DPI Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white shadow-2xl border border-slate-800">
        {/* Subtle Tricolor Top Accent */}
        <div className="h-1 w-full flex">
          <div className="w-1/3 bg-[#FF9933]" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-[#138808]" />
        </div>

        {/* Ambient Glows */}
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-emerald-600/15 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 px-6 py-12 md:py-20 max-w-4xl mx-auto text-center space-y-6">
          {/* National Platform Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-slate-200 text-xs font-bold tracking-wider uppercase backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Digital Public Infrastructure · Digital India</span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight font-display">
            {lang === 'hi' ? 'हर नागरिक का हक, हर योजना का लाभ' : 'Every Citizen’s Right, Every Scheme Delivered'}
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-300 to-amber-200">
              {lang === 'hi' ? 'नागरिक साथी (NagarikSaathi)' : 'AI-Powered Welfare Discovery & Fulfillment'}
            </span>
          </h1>
          
          <p className="text-base sm:text-lg text-slate-300 font-medium leading-relaxed max-w-2xl mx-auto">
            {lang === 'hi' 
              ? 'ग्रामीण नागरिकों और सीएससी ऑपरेटरों के लिए 1,050+ केंद्रीय और राज्य योजनाओं की पात्रता जांच, दस्तावेज़ सत्यापन और त्वरित WhatsApp डिलीवरी।'
              : 'Connecting 900+ million citizens with 1,050+ verified central and state welfare programs via multimodal voice AI, document OCR, and WhatsApp automation.'}
          </p>

          {/* Unified Voice & Text Search Interface */}
          <div className="max-w-2xl mx-auto mt-6 bg-white/10 backdrop-blur-md border border-white/20 p-2 rounded-2xl flex flex-col sm:flex-row gap-2 shadow-2xl items-center">
            <div className="flex-1 relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text"
                placeholder={lang === 'hi' ? 'समस्या बताएं (उदा. किसान बीज सब्सिडी, विधवा पेंशन, छात्रवृत्ति)' : 'Type your need (e.g. farmer seed loan in MP, widow pension)'}
                className="w-full bg-transparent border-none text-white pl-12 pr-4 py-3.5 focus:outline-none focus:ring-0 placeholder-slate-400 text-base font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    initChatSession('self');
                    navigate('/chat');
                    setTimeout(() => {
                      handleSendMessage(null, e.target.value.trim());
                    }, 150);
                  }
                }}
              />
            </div>

            {/* Voice Input Mic with Active Waveform */}
            <button
              type="button"
              onClick={() => {
                initChatSession('self');
                navigate('/chat');
                setTimeout(() => {
                  if (startVoiceInput) startVoiceInput();
                }, 200);
              }}
              className={`px-4 py-3.5 rounded-xl border transition-all flex items-center justify-center gap-2 ${
                isListening 
                  ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                  : 'bg-white/10 hover:bg-white/20 border-white/20 text-amber-300 hover:text-white'
              }`}
              title={lang === 'hi' ? 'आवाज़ से बोलें' : 'Speak your query'}
            >
              {isAudioProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Mic className="w-5 h-5" />
                  <span className="text-xs font-bold hidden sm:inline">
                    {lang === 'hi' ? 'बोलें' : 'Speak'}
                  </span>
                </>
              )}
            </button>

            {/* Launch AI Saathi */}
            <button 
              onClick={() => {
                initChatSession('operator');
                navigate('/chat');
              }}
              className="w-full sm:w-auto px-6 py-3.5 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/40 transition-all flex items-center justify-center gap-2 whitespace-nowrap text-sm"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{lang === 'hi' ? 'AI साथी शुरू करें' : 'Launch AI Saathi'}</span>
            </button>
          </div>

          {/* Quick Screener Link */}
          <div className="pt-2 flex items-center justify-center gap-4 text-xs">
            <button 
              onClick={() => navigate('/screener')}
              className="text-amber-300 hover:text-white underline underline-offset-4 font-semibold transition-colors flex items-center gap-1"
            >
              <span>{lang === 'hi' ? 'विस्तृत पात्रता स्क्रीनर खोलें' : 'Or open the Multi-Variable Eligibility Screener'}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* 4 Pillars of National Impact */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            icon: <Landmark className="w-6 h-6 text-blue-600" />,
            count: "1,050+",
            title: lang === 'hi' ? "सत्यापित योजनाएं" : "Welfare Schemes",
            subtitle: lang === 'hi' ? "28 राज्य एवं 8 केंद्र शासित प्रदेश" : "Central & State Portals Ingested"
          },
          {
            icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
            count: "₹2.4L Cr",
            title: lang === 'hi' ? "डीबीटी प्रत्यक्ष लाभ" : "DBT Benefit Scope",
            subtitle: lang === 'hi' ? "सीधे बैंक खाते में सहायता" : "Direct Benefit Bank Transfer"
          },
          {
            icon: <Mic className="w-6 h-6 text-amber-600" />,
            count: "2 Languages",
            title: lang === 'hi' ? "द्विभाषी वॉइस AI" : "Bilingual Voice AI",
            subtitle: lang === 'hi' ? "हिंदी एवं अंग्रेजी में बोलकर खोजें" : "Devanagari & English Speech"
          },
          {
            icon: <ShieldCheck className="w-6 h-6 text-purple-600" />,
            count: "100%",
            title: lang === 'hi' ? "DPDP कानून अनुपालन" : "Zero-Storage Compliant",
            subtitle: lang === 'hi' ? "आधार एवं बायोमेट्रिक सुरक्षित" : "Proactive Aadhaar Masking"
          }
        ].map((stat, idx) => (
          <div 
            key={idx}
            className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition-all space-y-2"
          >
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 w-fit">
              {stat.icon}
            </div>
            <div>
              <p className="text-2xl font-black text-slate-900 tracking-tight font-display">{stat.count}</p>
              <p className="text-sm font-bold text-slate-800">{stat.title}</p>
              <p className="text-xs text-slate-500 font-medium">{stat.subtitle}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Category Explorer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 font-display">
              {lang === 'hi' ? 'प्रमुख कल्याणकारी श्रेणियां' : 'Top Welfare Scheme Categories'}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {lang === 'hi' ? 'सीधे श्रेणी चुनकर योजनाएं देखें' : 'Select a domain to instantly filter eligible welfare programs'}
            </p>
          </div>
          <button 
            onClick={() => navigate('/schemes')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1"
          >
            <span>{lang === 'hi' ? 'सभी 1,050+ योजनाएं देखें' : 'View all 1,050+ schemes'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              icon: <Wheat className="w-5 h-5 text-emerald-700" />,
              en: "Agriculture & Farmers",
              hi: "कृषि एवं किसान कल्याण",
              desc: "PM-Kisan, Fasal Bima, Kisan Credit Card, Soil Health",
              query: "I am a farmer needing crop loans and fertilizer support",
              bgColor: "bg-emerald-50/70 border-emerald-200 text-emerald-900"
            },
            {
              icon: <HeartHandshake className="w-5 h-5 text-rose-700" />,
              en: "Women & Child Care",
              hi: "महिला एवं बाल विकास",
              desc: "Sukanya Samriddhi, PMMVY, Matru Vandana, Ujjwala",
              query: "Schemes for pregnant women and girl child savings",
              bgColor: "bg-rose-50/70 border-rose-200 text-rose-900"
            },
            {
              icon: <GraduationCap className="w-5 h-5 text-blue-700" />,
              en: "Education & Skills",
              hi: "शिक्षा एवं कौशल विकास",
              desc: "Post-Matric SC/ST Scholarships, PM Vishwakarma, Skill India",
              query: "Scholarships for rural students and artisan toolkits",
              bgColor: "bg-blue-50/70 border-blue-200 text-blue-900"
            },
            {
              icon: <Landmark className="w-5 h-5 text-amber-700" />,
              en: "Pensions & Social Security",
              hi: "पेंशन एवं सामाजिक सुरक्षा",
              desc: "Indira Gandhi Old Age Pension, Widow Pension, PMJJBY",
              query: "Old age pension for senior citizens with low income",
              bgColor: "bg-amber-50/70 border-amber-200 text-amber-900"
            }
          ].map((cat, idx) => (
            <div
              key={idx}
              onClick={() => {
                initChatSession('operator');
                navigate('/chat');
                setTimeout(() => {
                  handleSendMessage(null, cat.query);
                }, 150);
              }}
              className={`p-5 rounded-2xl border ${cat.bgColor} hover:shadow-md cursor-pointer transition-all space-y-3 flex flex-col justify-between group`}
            >
              <div className="space-y-2">
                <div className="p-2 rounded-xl bg-white/80 w-fit shadow-2xs">
                  {cat.icon}
                </div>
                <h3 className="font-extrabold text-sm group-hover:underline">
                  {lang === 'hi' ? cat.hi : cat.en}
                </h3>
                <p className="text-xs opacity-80 leading-relaxed font-medium">
                  {cat.desc}
                </p>
              </div>
              <div className="text-[11px] font-bold flex items-center justify-between pt-2 border-t border-current/15">
                <span>{lang === 'hi' ? 'योजनाएं खोजें' : 'Query Schemes'}</span>
                <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CSC VLE Operator Quick Access Banner */}
      <div className="p-6 sm:p-8 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 border border-blue-800/50">
        <div className="space-y-2 text-center md:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-bold tracking-wider uppercase font-mono">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
            CSC Operator Scheduled Fee: ₹30 – ₹50 / Filing
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold font-display">
            {lang === 'hi' ? 'सीएससी संचालक डैशबोर्ड एवं रजिस्ट्री' : 'CSC VLE Operator Console & Impact Dashboard'}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium">
            {lang === 'hi' 
              ? 'ग्राम स्तरीय उद्यमियों के लिए लाइव ट्रैकर, प्रिंट योग्य चेकलिस्ट, और आवेदन इतिहास।'
              : 'Track applications in real-time, print laminated checklists for citizens, and monitor village-level economic impact.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => navigate('/admin')}
            className="px-5 py-3 rounded-xl bg-white text-blue-950 font-extrabold text-xs shadow-md hover:bg-slate-100 transition-all"
          >
            Open Operator Dashboard
          </button>
          <button 
            onClick={() => navigate('/tracking')}
            className="px-5 py-3 rounded-xl bg-blue-700/80 hover:bg-blue-700 text-white font-bold text-xs border border-blue-600 transition-all"
          >
            Track Application Status
          </button>
        </div>
      </div>
    </div>
  );
}
