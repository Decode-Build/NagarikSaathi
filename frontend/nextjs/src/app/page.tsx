"use client";
import React, { useState, useEffect, useCallback } from 'react';
import SearchBox from '@/components/SearchBox';
import EligibilityChecker, { EligibilityData } from '@/components/EligibilityChecker';
import SchemeCard from '@/components/SchemeCard';
import PrintableHandout from '@/components/PrintableHandout';
import EmbeddedAiChat from '@/components/EmbeddedAiChat';
import { mockSchemes, Scheme } from '@/data/schemes';
import { Languages, Info, Sparkles, Filter } from 'lucide-react';

const translations = {
  en: {
    title: "NagarikSaathi",
    home: "Home",
    allSchemes: "All Schemes",
    cscLogin: "CSC Operator Login",
    heroTitle1: "Discover Government Schemes",
    heroTitle2: "Simplified for India",
    heroSubtitle: "Find, screen, and apply for central and state government benefits using your voice or guided eligibility checks.",
    tabVoice: "Voice / Text Search",
    tabEligibility: "Eligibility Checker",
    searchPlaceholder: "Ask for schemes (e.g. I am a farmer, I need subsidy...)",
    finding: "Finding the best schemes for you...",
    recommended: "Recommended Schemes",
    recommendedSub: "Based on your search and eligibility criteria, here are the top matching government schemes.",
    resultsFound: "schemes found",
    noSchemes: "No Schemes Found Yet",
    noSchemesSub: "Use the search box, voice input, or category filters above to discover government welfare schemes."
  },
  hi: {
    title: "नागरिक साथी",
    home: "होम",
    allSchemes: "सभी योजनाएं",
    cscLogin: "सीएससी ऑपरेटर लॉगिन",
    heroTitle1: "सरकारी योजनाओं की खोज करें",
    heroTitle2: "भारत के लिए सरलीकृत",
    heroSubtitle: "अपनी आवाज़ या निर्देशित पात्रता जांच का उपयोग करके केंद्र और राज्य सरकार के लाभ खोजें, जांचें और आवेदन करें।",
    tabVoice: "आवाज़ / टेक्स्ट खोज",
    tabEligibility: "पात्रता जांचकर्ता",
    searchPlaceholder: "योजनाओं के लिए पूछें (जैसे: मैं एक किसान हूँ, मुझे लोन चाहिए...)",
    finding: "आपके लिए सर्वोत्तम योजनाएं खोजी जा रही हैं...",
    recommended: "आधिकारिक सरकारी योजनाएं",
    recommendedSub: "आपकी खोज और पात्रता विवरण के आधार पर शीर्ष कल्याणकारी योजनाएं।",
    resultsFound: "योजनाएं मिलीं",
    noSchemes: "अभी तक कोई योजना नहीं मिली",
    noSchemesSub: "उन सरकारी कल्याणकारी योजनाओं को खोजने के लिए ऊपर दिए गए खोज बॉक्स, आवाज़ खोज या श्रेणी फ़िल्टर का उपयोग करें।"
  }
};

const CATEGORIES = [
  { id: 'All', nameEn: 'All Schemes', nameHi: 'सभी योजनाएं', icon: '🏛️' },
  { id: 'Agriculture', nameEn: 'Agriculture & Farmers', nameHi: 'कृषि एवं किसान कल्याण', icon: '🌾' },
  { id: 'Women', nameEn: 'Women & Child', nameHi: 'महिला एवं बाल विकास', icon: '👩' },
  { id: 'Health', nameEn: 'Healthcare & Insurance', nameHi: 'स्वास्थ्य एवं आयुष्मान', icon: '🏥' },
  { id: 'Education', nameEn: 'Education & Scholarships', nameHi: 'शिक्षा एवं छात्रवृत्ति', icon: '🎓' },
  { id: 'Pension', nameEn: 'Pensions & Social Security', nameHi: 'पेंशन एवं सामाजिक सुरक्षा', icon: '👴' },
  { id: 'Loan', nameEn: 'Loans & MSME Business', nameHi: 'मुद्रा लोन एवं रोजगार', icon: '💼' }
];

type Lang = 'en' | 'hi';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const mapBackendSchemeToFrontend = (s: any, currentLang: Lang): Scheme => {
  const isHi = currentLang === 'hi';
  const name = isHi && s.nameHindi ? s.nameHindi : s.name;
  const overview = isHi && s.descriptionHindi ? s.descriptionHindi : (s.description || s.name);
  const rawBenefits = isHi && s.benefitsHindi ? s.benefitsHindi : s.benefits;
  const benefitsList = Array.isArray(rawBenefits)
    ? rawBenefits
    : (rawBenefits ? [rawBenefits] : ["Direct financial and welfare support"]);

  const eligList: string[] = [];
  if (s.eligibility) {
    if (s.eligibility.occupation && s.eligibility.occupation.length) eligList.push(`Occupation: ${s.eligibility.occupation.join(', ')}`);
    if (s.eligibility.gender && s.eligibility.gender !== 'All') eligList.push(`Gender: ${s.eligibility.gender}`);
    if (s.eligibility.states && s.eligibility.states.length && !s.eligibility.states.includes('All')) eligList.push(`States: ${s.eligibility.states.join(', ')}`);
    if (s.eligibility.maxAnnualIncome && s.eligibility.maxAnnualIncome < 9999999) eligList.push(`Max Income: ₹${s.eligibility.maxAnnualIncome.toLocaleString('en-IN')}`);
  }
  if (eligList.length === 0) eligList.push("Open to all eligible citizens");

  return {
    id: s.schemeId || s._id || s.id || Math.random().toString(),
    name,
    overview,
    benefits: benefitsList,
    eligibility: eligList,
    documents: Array.isArray(s.documents) && s.documents.length ? s.documents : ["Aadhaar Card", "Bank Passbook", "Identity Proof"],
    applicationProcess: [
      `Visit official portal: ${s.applicationUrl || 'https://www.india.gov.in'}`,
      "Fill online registration form and verify citizen identity",
      "Upload required supporting documents"
    ],
    helpline: s.helplineNumber || "1800-111-999 / 14444",
    portalUrl: s.applicationUrl || "https://www.india.gov.in"
  };
};

export default function Home() {
  const [lang, setLang] = useState<Lang>('en');
  const [activeTab, setActiveTab] = useState<'search' | 'eligibility'>('search');
  const [results, setResults] = useState<Scheme[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [printScheme, setPrintScheme] = useState<Scheme | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [currentSearchQuery, setCurrentSearchQuery] = useState<string>('');

  const t = translations[lang];

  useEffect(() => {
    if (typeof window === 'undefined') return;
    setIsOnline(window.navigator.onLine);

    const handleOnline = async () => {
      setIsOnline(true);
      setSyncStatus("Network reconnected! Synchronizing rules...");
      
      try {
        const res = await fetch(`${API_URL}/v1/schemes/sync?since_version=v1.0`);
        if (res.ok) {
          const syncData = await res.json();
          console.log("Synchronized successfully with latest version:", syncData.latest_version);
          setSyncStatus(`Sync successful: Running latest version ${syncData.latest_version}`);
        } else {
          setSyncStatus("Sync failed: Could not fetch latest updates.");
        }
      } catch (err) {
        console.error("Sync error during reconnection:", err);
        setSyncStatus("Sync failed: Server unreachable.");
      }
      
      setTimeout(() => setSyncStatus(null), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus("Connection lost. Operating in offline evaluation mode.");
      setTimeout(() => setSyncStatus(null), 4000);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchInitial = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/schemes`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setResults(data.slice(0, 8).map(item => mapBackendSchemeToFrontend(item, lang)));
        }
      }
    } catch {
      setResults(mockSchemes);
    }
  }, [lang]);

  useEffect(() => {
    fetchInitial();
  }, [fetchInitial]);

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategory(categoryId);
    setCurrentSearchQuery(''); // Reset active AI search conversation
    setIsSearching(true);
    if (categoryId === 'All') {
      await fetchInitial();
      setIsSearching(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/schemes?category=${encodeURIComponent(categoryId)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setResults(data.map(item => mapBackendSchemeToFrontend(item, lang)));
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend category filter unreachable, falling back to local schemes:", err);
    }
    // Fallback filter
    setTimeout(() => {
      const filtered = mockSchemes.filter(s => 
        s.name.toLowerCase().includes(categoryId.toLowerCase()) || 
        s.overview.toLowerCase().includes(categoryId.toLowerCase())
      );
      setResults(filtered.length > 0 ? filtered : mockSchemes);
      setIsSearching(false);
    }, 400);
  };

  const handleSearch = async (query: string) => {
    setCurrentSearchQuery(query);
  };

  const handleSchemesFound = (sources: any[]) => {
    if (sources && sources.length > 0) {
      setResults(sources.map(item => mapBackendSchemeToFrontend(item, lang)));
    } else {
      setResults([]);
    }
  };

  const handleChatClear = () => {
    setCurrentSearchQuery('');
    fetchInitial();
  };

  const handleEligibilityCheck = async (data: EligibilityData) => {
    setIsSearching(true);
    try {
      const res = await fetch(`${API_URL}/eligibility`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: data.state || 'All',
          occupation: data.occupation || 'Farmer',
          gender: data.gender || 'All',
          maritalStatus: data.maritalStatus || 'All',
          landAcres: Number(data.land) || 0,
          annualIncome: data.income ? Number(data.income) : undefined,
          casteCategory: data.caste || 'General'
        })
      });
      if (res.ok) {
        const backendResults = await res.json();
        if (Array.isArray(backendResults) && backendResults.length > 0) {
          setResults(backendResults.map(item => mapBackendSchemeToFrontend(item, lang)));
          setIsSearching(false);
          return;
        }
      }
    } catch (err) {
      console.warn("Backend eligibility check unreachable, falling back to local schemes:", err);
    }
    setTimeout(() => {
      setResults(mockSchemes);
      setIsSearching(false);
    }, 500);
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
      {/* Network / Sync Status Banners */}
      {!isOnline && (
        <div className="bg-red-600 text-white text-xs font-bold py-2 text-center flex items-center justify-center gap-2 border-b border-red-700 animate-pulse sticky top-0 z-50">
          <span className="w-2 h-2 bg-white rounded-full"></span>
          <span>Offline Mode: Using cached local rules. Some AI services may be degraded.</span>
        </div>
      )}
      {syncStatus && (
        <div className="bg-blue-600 text-white text-xs font-bold py-2 text-center flex items-center justify-center gap-2 border-b border-blue-700 sticky top-0 z-50 transition-all duration-300">
          <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
          <span>{syncStatus}</span>
        </div>
      )}

      {/* Printable Sheet (Shown only during print) */}
      <div className="hidden print:block absolute inset-0 bg-white">
        {printScheme && <PrintableHandout scheme={printScheme} />}
      </div>

      <div className="print:hidden flex flex-col min-h-screen">
        {/* Navigation Header */}
        <header className="bg-[#FDFBF7]/85 backdrop-blur-xl shadow-sm sticky top-0 z-40 border-b border-orange-100/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-red-600 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg border border-orange-200">
                {lang === 'en' ? 'N' : 'ना'}
              </div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-500 to-amber-600 tracking-tight flex items-center gap-2">
                  {t.title}
                  <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 rounded font-bold tracking-wider uppercase shrink-0">
                    Evaluation Mode
                  </span>
                </h1>
                <span className="text-[10px] text-gray-500 font-bold block -mt-1">
                  {lang === 'hi' ? 'कल्याणकारी योजना सहायता मंच — पूर्व-पायलट मूल्यांकन मोड' : 'Govt Welfare Scheme Portal — Pre-Pilot Architecture / Evaluation Mode'}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex gap-6 text-xs uppercase font-extrabold tracking-wider text-gray-600">
                <a href="#" className="text-orange-600 border-b-2 border-orange-600 pb-0.5">{t.home}</a>
                <a href="#schemes-section" className="hover:text-orange-600 transition-colors">{t.allSchemes}</a>
                <a href="/admin" className="hover:text-orange-600 transition-colors flex items-center gap-1.5 bg-orange-50/50 text-orange-850 px-3.5 py-1.5 rounded-full border border-orange-100">
                  <Sparkles size={13} className="text-orange-500" />
                  {t.cscLogin}
                </a>
              </nav>
              
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-2 bg-gradient-to-r from-orange-100/60 to-amber-100/60 text-orange-800 hover:from-orange-200 hover:to-amber-200 px-4.5 py-2.5 rounded-full font-bold text-xs shadow-sm transition-all border border-orange-200/50 cursor-pointer"
              >
                <Languages size={15} />
                {lang === 'en' ? '🇮🇳 हिंदी में देखें' : '🌐 View in English'}
              </button>
            </div>
          </div>
        </header>

        {/* Hero Banner Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-orange-950 via-slate-900 to-emerald-950 py-20 px-4 border-b border-orange-900/10">
          {/* Subtle Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:16px_28px]" />
          
          {/* Floating glowing orbs */}
          <div className="absolute top-10 left-1/4 w-72 h-72 bg-orange-500/10 rounded-full blur-3xl animate-float" />
          <div className="absolute bottom-10 right-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2.5s' }} />

          <div className="relative max-w-5xl mx-auto text-center z-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-white font-bold text-xs mb-6 border border-white/15 shadow-md">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></span>
              <span>{lang === 'hi' ? 'डिजिटल भारत — 48+ केंद्रीय एवं राज्य योजनाएं उपलब्ध' : 'Digital India — 48+ Central & State Schemes Live'}</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-5 text-white drop-shadow-md leading-tight tracking-tight">
              {t.heroTitle1} <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-300">
                {t.heroTitle2}
              </span>
            </h2>
            
            <p className="text-sm md:text-base text-orange-100/90 mb-10 max-w-2xl mx-auto drop-shadow-sm font-medium leading-relaxed">
              {t.heroSubtitle}
            </p>
            
            {/* Search vs Eligibility Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-black/30 backdrop-blur-md p-1.5 rounded-full inline-flex border border-white/10 shadow-2xl">
                <button 
                  onClick={() => setActiveTab('search')}
                  className={`px-8 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer ${
                    activeTab === 'search' 
                      ? 'bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white shadow-xl scale-105' 
                      : 'text-orange-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.tabVoice}
                </button>
                <button 
                  onClick={() => setActiveTab('eligibility')}
                  className={`px-8 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 cursor-pointer ${
                    activeTab === 'eligibility' 
                      ? 'bg-gradient-to-r from-indigo-500 to-indigo-700 text-white shadow-xl scale-105' 
                      : 'text-indigo-100 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {t.tabEligibility}
                </button>
              </div>
            </div>

            {/* Input Area */}
            <div className="transition-all duration-500 ease-in-out pb-4">
              {activeTab === 'search' ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-4">
                  <SearchBox onSearch={handleSearch} placeholder={t.searchPlaceholder} language={lang} />
                  
                  {/* Unified AI Search & Chat interface */}
                  <EmbeddedAiChat 
                    lang={lang} 
                    initialQuery={currentSearchQuery} 
                    onSchemesFound={handleSchemesFound}
                    onClear={handleChatClear}
                  />
                </div>
              ) : (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left max-w-4xl mx-auto shadow-2xl rounded-3xl overflow-hidden border border-white/10 bg-white">
                  <EligibilityChecker onCheck={handleEligibilityCheck} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Quick Highlights Stats Row */}
        <section className="max-w-6xl mx-auto px-4 py-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6 -mt-8 relative z-25">
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100/50 flex items-center gap-4 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center text-xl font-bold">🎯</div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">AI Scheme Recommendation</h4>
              <p className="text-xs text-gray-500 mt-0.5">Instant matching based on multi-criteria rules evaluation.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100/50 flex items-center gap-4 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center text-xl font-bold">🗣️</div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">Voice Assistant Support</h4>
              <p className="text-xs text-gray-500 mt-0.5">Speak Hindi or English for rapid conversational discovery.</p>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow-lg border border-orange-100/50 flex items-center gap-4 hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center text-xl font-bold">📄</div>
            <div>
              <h4 className="font-extrabold text-sm text-gray-900">Printable Citizen Handouts</h4>
              <p className="text-xs text-gray-500 mt-0.5">Print tailored offline guides with official apply URLs.</p>
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <section id="schemes-section" className="max-w-6xl mx-auto px-4 py-4 z-20 relative w-full">
          <div className="bg-white p-3 rounded-2xl shadow-md border border-orange-100/40 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-xs font-black text-gray-400 px-2 shrink-0 uppercase tracking-wider">
              <Filter size={14} className="text-orange-500" />
              <span>{lang === 'hi' ? 'श्रेणी:' : 'Filter:'}</span>
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`whitespace-nowrap px-4.5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white shadow-md scale-105'
                    : 'bg-orange-50/40 text-gray-700 hover:bg-orange-100 hover:text-orange-700 border border-orange-100/40'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{lang === 'hi' ? cat.nameHi : cat.nameEn}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Scheme Results Section */}
        <section className="flex-1 max-w-6xl mx-auto py-8 px-4 w-full">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 text-orange-655">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-green-200 border-b-green-600 rounded-full animate-spin-reverse"></div>
              </div>
              <p className="text-base font-extrabold animate-pulse text-gray-800">{t.finding}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b border-orange-100/60 pb-4.5 gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2.5">
                    <span className="w-2.5 h-8 bg-gradient-to-b from-orange-500 via-red-500 to-amber-500 rounded-full inline-block"></span>
                    {t.recommended}
                  </h3>
                  <p className="text-gray-500 mt-1 text-sm font-medium">{t.recommendedSub}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-250 px-4.5 py-1.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{results.length} {t.resultsFound}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {results.map(scheme => (
                  <SchemeCard 
                    key={scheme.id} 
                    scheme={scheme} 
                    onPrint={handlePrint}
                    lang={lang} 
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-xl max-w-xl mx-auto relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-500 via-white to-green-500"></div>
              <div className="w-20 h-20 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-black shadow-inner">
                🏛️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t.noSchemes}</h3>
              <p className="text-gray-500 max-w-sm mx-auto text-xs leading-relaxed font-semibold">
                {t.noSchemesSub}
              </p>
            </div>
          )}
        </section>
        
        {/* Global Footer */}
        <footer className="bg-slate-900 text-slate-400 py-10 mt-auto border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-left">
              <p className="font-extrabold text-white text-base">🏛️ NagarikSaathi (नागरिक साथी)</p>
              <p className="text-xs text-slate-500 mt-1">Empowering Rural India with Voice, AI & Direct Benefit Discovery</p>
            </div>
            <div className="flex flex-col md:flex-row items-center gap-4 text-xs font-bold text-slate-400">
              <div className="flex gap-4">
                <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
              </div>
              <div className="flex items-center gap-2">
                <span>Made with ❤️ for Bharat</span>
                <div className="flex gap-1">
                  <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                  <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
