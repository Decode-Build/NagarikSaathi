"use client";
import React, { useState, useEffect } from 'react';
import SearchBox from '@/components/SearchBox';
import EligibilityChecker, { EligibilityData } from '@/components/EligibilityChecker';
import SchemeCard from '@/components/SchemeCard';
import PrintableHandout from '@/components/PrintableHandout';
import { mockSchemes, Scheme } from '@/data/schemes';
import { Languages, Info } from 'lucide-react';

const translations = {
  en: {
    title: "NagarikSaathi",
    home: "Home",
    allSchemes: "All Schemes",
    cscLogin: "CSC Login",
    heroTitle1: "Discover Government Schemes",
    heroTitle2: "Simplified for India",
    heroSubtitle: "Find, screen, and apply for central and state government benefits using your voice or guided eligibility checks.",
    tabVoice: "Voice / Text Search",
    tabEligibility: "Eligibility Checker",
    searchPlaceholder: "Ask for schemes (e.g. I am a farmer, I need support...)",
    finding: "Finding the best schemes for you...",
    recommended: "Recommended Schemes",
    recommendedSub: "Based on your input, here are the top matches.",
    resultsFound: "results found",
    noSchemes: "No Schemes Found Yet",
    noSchemesSub: "Use the search box or eligibility checker above to discover government welfare schemes you might be eligible for."
  },
  hi: {
    title: "नागरिक साथी",
    home: "होम",
    allSchemes: "सभी योजनाएं",
    cscLogin: "सीएससी लॉगिन",
    heroTitle1: "सरकारी योजनाओं की खोज करें",
    heroTitle2: "भारत के लिए सरलीकृत",
    heroSubtitle: "अपनी आवाज़ या निर्देशित पात्रता जांच का उपयोग करके केंद्र और राज्य सरकार के लाभ खोजें, जांचें और आवेदन करें।",
    tabVoice: "आवाज़ / टेक्स्ट खोज",
    tabEligibility: "पात्रता जांचकर्ता",
    searchPlaceholder: "योजनाओं के लिए पूछें (जैसे: मैं एक किसान हूँ...)",
    finding: "आपके लिए सर्वोत्तम योजनाएं खोजी जा रही हैं...",
    recommended: "अनुशंसित योजनाएं",
    recommendedSub: "आपके इनपुट के आधार पर, यहाँ शीर्ष मेल हैं।",
    resultsFound: "परिणाम मिले",
    noSchemes: "अभी तक कोई योजना नहीं मिली",
    noSchemesSub: "उन सरकारी कल्याणकारी योजनाओं को खोजने के लिए ऊपर दिए गए खोज बॉक्स या पात्रता जांचकर्ता का उपयोग करें जिनके लिए आप पात्र हो सकते हैं।"
  }
};

type Lang = 'en' | 'hi';

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [activeTab, setActiveTab] = useState<'search' | 'eligibility'>('search');
  const [results, setResults] = useState<Scheme[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [printScheme, setPrintScheme] = useState<Scheme | null>(null);

  const t = translations[lang];

  const handleSearch = (query: string) => {
    setIsSearching(true);
    setTimeout(() => {
      setResults(mockSchemes);
      setIsSearching(false);
    }, 1500);
  };

  const handleEligibilityCheck = (data: EligibilityData) => {
    setIsSearching(true);
    setTimeout(() => {
      setResults(mockSchemes);
      setIsSearching(false);
    }, 1500);
  };

  const handlePrint = (scheme: Scheme) => {
    setPrintScheme(scheme);
  };

  useEffect(() => {
    if (printScheme) {
      setTimeout(() => window.print(), 500);
    }
  }, [printScheme]);

  useEffect(() => {
    const afterPrint = () => setPrintScheme(null);
    window.addEventListener('afterprint', afterPrint);
    return () => window.removeEventListener('afterprint', afterPrint);
  }, []);

  const toggleLanguage = () => {
    setLang(lang === 'en' ? 'hi' : 'en');
  };

  return (
    <main className="min-h-screen bg-[#FDFBF7] text-gray-900 font-sans selection:bg-orange-200">
      <div className="hidden print:block absolute inset-0 bg-white">
        {printScheme && <PrintableHandout scheme={printScheme} />}
      </div>

      <div className="print:hidden flex flex-col min-h-screen">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg border-2 border-orange-100">
                {lang === 'en' ? 'N' : 'ना'}
              </div>
              <h1 className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600 tracking-tight">
                {t.title}
              </h1>
            </div>
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex gap-6 text-sm font-semibold text-gray-700">
                <a href="#" className="hover:text-orange-600 transition-colors">{t.home}</a>
                <a href="#" className="hover:text-orange-600 transition-colors">{t.allSchemes}</a>
                <a href="/admin" className="hover:text-orange-600 transition-colors">{t.cscLogin}</a>
              </nav>
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 bg-orange-100 text-orange-700 hover:bg-orange-200 px-3 py-1.5 rounded-full font-medium transition-all"
              >
                <Languages size={18} />
                {lang === 'en' ? 'हिंदी' : 'English'}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Image with Gradient Overlay */}
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1538991383142-36c4edeaffde?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-900/90 via-orange-800/80 to-green-900/90 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative max-w-5xl mx-auto text-center py-20 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-md text-white font-medium mb-8 border border-white/30 shadow-xl">
              <Info size={18} className="text-orange-200" />
              <span>Empowering Rural India digitally</span>
            </div>
            
            <h2 className="text-5xl md:text-6xl font-extrabold mb-6 text-white drop-shadow-lg leading-tight">
              {t.heroTitle1} <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-yellow-300">{t.heroTitle2}</span>
            </h2>
            <p className="text-lg md:text-xl text-orange-50 mb-12 max-w-2xl mx-auto drop-shadow-md">
              {t.heroSubtitle}
            </p>
            
            {/* Tabs */}
            <div className="flex justify-center mb-8">
              <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-full inline-flex border border-white/20 shadow-2xl">
                <button 
                  onClick={() => setActiveTab('search')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'search' ? 'bg-white text-orange-800 shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}
                >
                  {t.tabVoice}
                </button>
                <button 
                  onClick={() => setActiveTab('eligibility')}
                  className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === 'eligibility' ? 'bg-white text-green-800 shadow-lg scale-105' : 'text-white hover:bg-white/20'}`}
                >
                  {t.tabEligibility}
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="transition-all duration-500 ease-in-out pb-8">
              {activeTab === 'search' ? (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
                  <SearchBox onSearch={handleSearch} placeholder={t.searchPlaceholder} language={lang} />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 text-left max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden border-4 border-white/20 bg-white/95 backdrop-blur-sm">
                  <EligibilityChecker onCheck={handleEligibilityCheck} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="flex-1 max-w-6xl mx-auto py-16 px-4 w-full">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-24 text-orange-600">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-green-200 border-b-green-600 rounded-full animate-spin-reverse"></div>
              </div>
              <p className="mt-6 text-xl font-bold animate-pulse text-gray-700">{t.finding}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="animate-in fade-in duration-700">
              <div className="mb-10 flex flex-col md:flex-row justify-between items-end border-b-2 border-orange-100 pb-4">
                <div>
                  <h3 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
                    <span className="w-2 h-8 bg-gradient-to-b from-orange-500 to-green-500 rounded-full inline-block"></span>
                    {t.recommended}
                  </h3>
                  <p className="text-gray-500 mt-2 font-medium">{t.recommendedSub}</p>
                </div>
                <div className="mt-4 md:mt-0 text-sm bg-green-100 text-green-800 px-4 py-1.5 rounded-full font-bold shadow-sm">
                  {results.length} {t.resultsFound}
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
                {results.map(scheme => (
                  <SchemeCard key={scheme.id} scheme={scheme} onPrint={handlePrint} />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-24 bg-white rounded-3xl border border-gray-100 shadow-xl max-w-2xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 via-white to-green-400"></div>
              <div className="w-24 h-24 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-black shadow-inner">
                ?
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{t.noSchemes}</h3>
              <p className="text-gray-500 max-w-md mx-auto leading-relaxed">
                {t.noSchemesSub}
              </p>
            </div>
          )}
        </section>
        
        {/* Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 text-center mt-auto">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-medium text-sm">© 2026 NagarikSaathi. A Bharat Pragati Initiative.</p>
            <div className="flex gap-4">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <div className="w-3 h-3 rounded-full bg-white"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
