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
    cscLogin: "Admin Panel",
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
    noSchemesSub: "Use the search box, voice input, or category filters above to discover government welfare schemes.",
    evalMode: "Evaluation Mode",
    portalSub: "Govt Welfare Scheme Portal — Pre-Pilot Architecture / Evaluation Mode",
    digitalIndia: "Digital India — 48+ Central & State Schemes Live",
    offlineBanner: "Offline Mode: Using cached local rules. Some AI services may be degraded.",
    filterLabel: "Filter:",
    footerTagline: "Empowering Rural India with Voice, AI & Direct Benefit Discovery",
    footerMade: "Made with ❤️ for Bharat",
    eOccupation: "Occupation",
    eGender: "Gender",
    eStates: "States",
    eMaxIncome: "Max Income",
    eOpenToAll: "Open to all eligible citizens",
    eApplyOnline: "Fill online registration form and verify citizen identity",
    eUploadDocs: "Upload required supporting documents"
  },
  hi: {
    title: "नागरिक साथी",
    home: "होम",
    allSchemes: "सभी योजनाएं",
    cscLogin: "एडमिन पैनल",
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
    noSchemesSub: "उन सरकारी कल्याणकारी योजनाओं को खोजने के लिए ऊपर दिए गए खोज बॉक्स, आवाज़ खोज या श्रेणी फ़िल्टर का उपयोग करें।",
    evalMode: "मूल्यांकन मोड",
    portalSub: "कल्याणकारी योजना सहायता मंच — पूर्व-पायलट मूल्यांकन मोड",
    digitalIndia: "डिजिटल भारत — 48+ केंद्रीय एवं राज्य योजनाएं उपलब्ध",
    offlineBanner: "ऑफलाइन मोड: कैश किए गए स्थानीय नियमों का उपयोग हो रहा है। कुछ AI सेवाएं उपलब्ध नहीं हो सकतीं।",
    filterLabel: "श्रेणी:",
    footerTagline: "आवाज़, AI और सीधे लाभ खोज से ग्रामीण भारत को सशक्त बनाना",
    footerMade: "भारत के लिए ❤️ के साथ बनाया गया",
    eOccupation: "व्यवसाय",
    eGender: "लिंग",
    eStates: "राज्य",
    eMaxIncome: "अधिकतम आय",
    eOpenToAll: "सभी पात्र नागरिकों के लिए खुला",
    eApplyOnline: "ऑनलाइन पंजीकरण फॉर्म भरें और नागरिक पहचान सत्यापित करें",
    eUploadDocs: "आवश्यक सहायक दस्तावेज़ अपलोड करें"
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
  const tMap = translations[currentLang];
  const name = isHi && s.nameHindi ? s.nameHindi : s.name;
  const overview = isHi && s.descriptionHindi ? s.descriptionHindi : (s.description || s.name);
  const rawBenefits = isHi && s.benefitsHindi ? s.benefitsHindi : s.benefits;
  const benefitsList = Array.isArray(rawBenefits)
    ? rawBenefits
    : (rawBenefits ? [rawBenefits] : [isHi ? "प्रत्यक्ष वित्तीय एवं कल्याण सहायता" : "Direct financial and welfare support"]);

  const eligList: string[] = [];
  if (s.eligibility) {
    if (s.eligibility.occupation && s.eligibility.occupation.length) eligList.push(`${tMap.eOccupation}: ${s.eligibility.occupation.join(', ')}`);
    if (s.eligibility.gender && s.eligibility.gender !== 'All') eligList.push(`${tMap.eGender}: ${s.eligibility.gender}`);
    if (s.eligibility.states && s.eligibility.states.length && !s.eligibility.states.includes('All')) eligList.push(`${tMap.eStates}: ${s.eligibility.states.join(', ')}`);
    if (s.eligibility.maxAnnualIncome && s.eligibility.maxAnnualIncome < 9999999) eligList.push(`${tMap.eMaxIncome}: ₹${s.eligibility.maxAnnualIncome.toLocaleString('en-IN')}`);
  }
  if (eligList.length === 0) eligList.push(tMap.eOpenToAll);

  const defaultDocs = isHi
    ? ["आधार कार्ड", "बैंक पासबुक", "पहचान प्रमाण"]
    : ["Aadhaar Card", "Bank Passbook", "Identity Proof"];

  return {
    id: s.schemeId || s._id || s.id || Math.random().toString(),
    name,
    overview,
    benefits: benefitsList,
    eligibility: eligList,
    documents: Array.isArray(s.documents) && s.documents.length ? s.documents : defaultDocs,
    applicationProcess: [
      `${isHi ? 'आधिकारिक पोर्टल पर जाएं:' : 'Visit official portal:'} ${s.applicationUrl || 'https://www.india.gov.in'}`,
      tMap.eApplyOnline,
      tMap.eUploadDocs
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
          <span>{t.offlineBanner}</span>
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
        <header className="bg-white/85 backdrop-blur-md shadow-sm sticky top-0 z-40 border-b border-orange-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 via-red-600 to-amber-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-orange-100">
                {lang === 'en' ? 'N' : 'ना'}
              </div>
              <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-amber-700 tracking-tight flex items-center gap-2">
                  {t.title}
                  <span className="hidden sm:inline-block text-[9px] bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded font-bold tracking-normal uppercase shrink-0">
                    {t.evalMode}
                  </span>
                </h1>
                <span className="hidden sm:block text-[10px] text-gray-500 font-medium -mt-1">
                  {t.portalSub}
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-6">
              <nav className="hidden lg:flex gap-6 text-sm font-bold text-gray-700 items-center">
                <a href="#" className="text-orange-600 border-b-2 border-orange-600 pb-0.5">{t.home}</a>
                <a href="#schemes-section" className="hover:text-orange-600 transition-colors whitespace-nowrap">{t.allSchemes}</a>
                <a href="/admin" className="hover:text-orange-600 transition-colors flex items-center gap-1.5 bg-orange-50 text-orange-800 px-3 py-1 rounded-full border border-orange-200 whitespace-nowrap">
                  <Sparkles size={14} className="text-orange-500" />
                  {t.cscLogin}
                </a>
              </nav>
              
              <button 
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-orange-100 to-amber-100 text-orange-800 hover:from-orange-200 hover:to-amber-200 px-2.5 py-1.5 sm:px-4 sm:py-2 rounded-full font-bold text-xs shadow-sm transition-all border border-orange-200"
              >
                <Languages size={16} />
                <span className="hidden sm:inline">{lang === 'en' ? '🇮🇳 हिंदी में देखें' : '🌐 View in English'}</span>
                <span className="sm:hidden">{lang === 'en' ? 'हिंदी' : 'EN'}</span>
              </button>
            </div>
          </div>
        </header>

        {/* Hero Banner Section */}
        <section className="relative">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1538991383142-36c4edeaffde?q=80&w=2071&auto=format&fit=crop')] bg-cover bg-center">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-950/90 via-orange-900/85 to-green-950/90 backdrop-blur-[2px]"></div>
          </div>
          
          <div className="relative max-w-5xl mx-auto text-center py-20 px-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-white font-semibold text-xs mb-6 border border-white/30 shadow-xl">
              <Info size={16} className="text-orange-200" />
              <span>{t.digitalIndia}</span>
            </div>
            
            <h2 className="text-4xl md:text-6xl font-black mb-5 text-white drop-shadow-lg leading-tight">
              {t.heroTitle1} <br/> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-amber-200 to-yellow-300">
                {t.heroTitle2}
              </span>
            </h2>
            
            <p className="text-base md:text-lg text-orange-100 mb-10 max-w-2xl mx-auto drop-shadow-md font-medium">
              {t.heroSubtitle}
            </p>
            
            {/* Search vs Eligibility Toggle */}
            <div className="flex justify-center mb-8">
              <div className="bg-black/40 backdrop-blur-md p-1.5 rounded-full inline-flex border border-white/30 shadow-2xl">
                <button 
                  onClick={() => setActiveTab('search')}
                  className={`px-7 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeTab === 'search' ? 'bg-white text-orange-800 shadow-xl scale-105' : 'text-white hover:bg-white/20'
                  }`}
                >
                  {t.tabVoice}
                </button>
                <button 
                  onClick={() => setActiveTab('eligibility')}
                  className={`px-7 py-2.5 rounded-full text-xs md:text-sm font-bold transition-all duration-300 ${
                    activeTab === 'eligibility' ? 'bg-white text-green-800 shadow-xl scale-105' : 'text-white hover:bg-white/20'
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
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-left max-w-4xl mx-auto shadow-2xl rounded-3xl overflow-hidden border-4 border-white/20 bg-white/95 backdrop-blur-sm">
                  <EligibilityChecker onCheck={handleEligibilityCheck} lang={lang} />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Category Filter Pills */}
        <section id="schemes-section" className="max-w-6xl mx-auto px-4 -mt-6 z-20 relative">
          <div className="bg-white/95 backdrop-blur-md p-3.5 rounded-2xl shadow-xl border border-orange-100/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 px-2 shrink-0">
              <Filter size={15} className="text-orange-600" />
              <span>{t.filterLabel}</span>
            </div>
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => handleCategorySelect(cat.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                  selectedCategory === cat.id
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white shadow-md scale-105'
                    : 'bg-orange-50/70 text-gray-700 hover:bg-orange-100 border border-orange-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{lang === 'hi' ? cat.nameHi : cat.nameEn}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Scheme Results Section */}
        <section className="flex-1 max-w-6xl mx-auto py-12 px-4 w-full">
          {isSearching ? (
            <div className="flex flex-col items-center justify-center py-20 text-orange-600">
              <div className="relative w-16 h-16 mb-4">
                <div className="absolute inset-0 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-green-200 border-b-green-600 rounded-full animate-spin-reverse"></div>
              </div>
              <p className="text-lg font-extrabold animate-pulse text-gray-800">{t.finding}</p>
            </div>
          ) : results.length > 0 ? (
            <div className="animate-in fade-in duration-500">
              <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-2 border-orange-100 pb-4 gap-4">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-gray-900 flex items-center gap-2.5">
                    <span className="w-2.5 h-8 bg-gradient-to-b from-orange-500 via-amber-500 to-green-600 rounded-full inline-block"></span>
                    {t.recommended}
                  </h3>
                  <p className="text-gray-500 mt-1 text-sm font-medium">{t.recommendedSub}</p>
                </div>
                <div className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-4 py-1.5 rounded-full font-bold text-xs shadow-sm flex items-center gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{results.length} {t.resultsFound}</span>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
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
              <p className="text-gray-500 max-w-sm mx-auto text-xs leading-relaxed">
                {t.noSchemesSub}
              </p>
            </div>
          )}
        </section>
        
        {/* Floating AI Chat Drawer has been unified inline into the main search workspace */}

        {/* Global Footer */}
        <footer className="bg-gray-900 text-gray-400 py-8 text-center mt-auto border-t border-gray-800">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <p className="font-bold text-white text-sm">🏛️ {lang === 'hi' ? 'नागरिक साथी (NagarikSaathi)' : 'NagarikSaathi (नागरिक साथी)'}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t.footerTagline}</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-400">
              <span>{t.footerMade}</span>
              <div className="flex gap-1 ml-2">
                <div className="w-2.5 h-2.5 rounded-full bg-orange-500"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-white"></div>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </main>
  );
}
