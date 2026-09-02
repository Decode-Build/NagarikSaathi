import React, { useState, useEffect, useRef } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Layout from './layouts/Layout.jsx';
import axios from 'axios';
import { AlertTriangle, Check } from 'lucide-react';
import { useLanguage } from './i18n/LanguageContext';
import { useVoiceInput } from './hooks/useVoiceInput.js';
import { useTextToSpeech } from './hooks/useTextToSpeech.js';

import EligibilityScreener from './schemes/EligibilityScreener.jsx';
import ResultsScreen from './schemes/ResultsScreen.jsx';
import DetailScreen from './schemes/DetailScreen.jsx';
import LandingScreen from './pages/LandingScreen.jsx';
import DashboardScreen from './dashboard/DashboardScreen.jsx';
import ChatScreen from './chatbot/ChatScreen.jsx';
import HowItWorks from './pages/HowItWorks.jsx';
import DocumentsScreen from './documents/DocumentsScreen.jsx';
import ApplicationsScreen from './dashboard/ApplicationsScreen.jsx';
import TrackingScreen from './tracking/TrackingScreen.jsx';

const API_BASE = import.meta.env?.VITE_API_URL 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api');

const generateSessionId = () => `sess-${Math.random().toString(36).substring(2, 9)}`;

export default function App() {
  const { t, lang: langMode } = useLanguage();
  const navigate = useNavigate();
  
  // App States
  const [page, setPage] = useState('landing');
  const [sessionId, setSessionId] = useState(generateSessionId());
  const [sessionType, setSessionType] = useState('operator');
  const [selectedScheme, setSelectedScheme] = useState(null);
  
  // Wait for voices to load
  useEffect(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);
  
  // Toast Notification & Global Error State
  const [toast, setToast] = useState({ message: '', type: '' });
  const [globalError, setGlobalError] = useState('');

  const showToast = (message, type = 'error') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast({ message: '', type: '' });
    }, 4500);
  };

  // Chat States
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatConfidence, setChatConfidence] = useState(null);
  const [chatSources, setChatSources] = useState([]);
  const [operatorStats, setOperatorStats] = useState({ citizensHelped: 0, avgResponseTimeSec: null, matchRate: 'N/A', districtRank: 'N/A', categoriesMatched: [], recentActivity: [] });

  const handleSendMessage = async (e, prefilledMsg = null) => {
    if (e) e.preventDefault();
    const textToSend = prefilledMsg || chatMessage;
    if (!textToSend.trim() || chatLoading) return;

    const userMsg = { role: 'user', content: textToSend, timestamp: new Date() };
    setChatHistory(prev => [...prev, userMsg]);
    setChatMessage('');
    setChatLoading(true);

    try {
      setGlobalError('');
      // Auto-detect Hindi in message or use active langMode / voiceLang
      const isHindi = /[\u0900-\u097F]/.test(textToSend) || langMode === 'hi' || voiceLang === 'hi';
      const response = await axios.post(`${API_BASE}/chat`, {
        message: textToSend,
        sessionId,
        sessionType,
        language: isHindi ? 'hi' : langMode
      }, { timeout: 35000 });

      const { answer, sources, confidence, isMockMode } = response.data;
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: answer,
        sources,
        confidence,
        isMockMode,
        timestamp: new Date()
      }]);
      
      setChatConfidence(confidence);
      setChatSources(sources || []);
      fetchStats();
    } catch (err) {
      const errMsg = "Failed to connect to backend.";
      setChatHistory(prev => [...prev, {
        role: 'assistant',
        content: errMsg,
        sources: [],
        confidence: "low",
        timestamp: new Date()
      }]);
      setChatConfidence("low");
      setGlobalError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setChatLoading(false);
    }
  };

  // Dual-Engine Voice Input (Web Speech API with 'hi-IN' + MediaRecorder Gemini STT fallback)
  const {
    isListening,
    isProcessing: isAudioProcessing,
    voiceLang,
    setVoiceLang,
    toggleVoiceLang,
    interimTranscript,
    audioLevel,
    startListening: startVoiceInput,
    stopListening: stopVoiceInput,
    stopAllAudio
  } = useVoiceInput({
    apiBase: API_BASE,
    defaultLang: langMode || 'hi',
    onResult: (recognizedText) => {
      setChatMessage(recognizedText);
      handleSendMessage(null, recognizedText);
    },
    showToast
  });

  // Eligibility Screener States
  const [profile, setProfile] = useState({
    state: 'Madhya Pradesh',
    occupation: 'Farmer',
    gender: 'Male',
    maritalStatus: 'Single',
    landAcres: 0,
    annualIncome: 50000,
    casteCategory: 'General',
    languagePreference: 'hi'
  });
  const [screenerResults, setScreenerResults] = useState([]);
  const [screenerLoading, setScreenerLoading] = useState(false);

  const [citizenName, setCitizenName] = useState('');

  const chatEndRef = useRef(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const fetchStats = async () => {
    try {
      const res = await axios.get(`${API_BASE}/stats`);
      if (res.data) setOperatorStats(res.data);
    } catch (err) {
      console.warn("Could not fetch stats");
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh stats every 15s
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const initChatSession = (type = 'operator') => {
    setSessionId(generateSessionId());
    setSessionType(type);
    setChatHistory([]);
    setChatConfidence(null);
    setChatSources([]);
    navigate('/chat');
  };

  const handleRunScreener = async (e) => {
    e.preventDefault();
    navigate('/schemes');
    setScreenerLoading(true);
    setGlobalError('');
    try {
      const res = await axios.post(`${API_BASE}/eligibility`, {
        sessionId,
        ...profile
      });
      setScreenerResults(res.data);
      showToast(`Found ${res.data.length} eligible schemes!`, "success");
    } catch (err) {
      const errMsg = "Error calculating eligibility.";
      setGlobalError(errMsg);
      showToast(errMsg, "error");
    } finally {
      setScreenerLoading(false);
    }
  };

  const handleReportScheme = async (schemeId) => {
    try {
      const res = await axios.post(`${API_BASE}/schemes/${schemeId}/report`);
      showToast(res.data.message, "success");
    } catch (err) {
      showToast("Failed to report scheme", "error");
    }
  };

  // Text-To-Speech Engine (Web Speech API with Hindi/English voice matching + Server Audio fallback)
  const tts = useTextToSpeech({ apiBase: API_BASE, showToast });

  const handleSpeechOutput = (text, id = null) => {
    tts.speak(text, id);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  };

  const getDomain = (urlStr) => {
    if (!urlStr) return 'gov.in';
    try {
      const url = new URL(urlStr);
      return url.hostname.replace('www.', '');
    } catch (e) {
      return 'gov.in';
    }
  };

  const getMatchScore = (scheme, userProfile) => {
    let score = 100;
    const states = scheme.eligibility?.states || [];
    const jobs = scheme.eligibility?.occupation || [];
    if (states.length > 0 && !states.includes('All') && !states.includes(userProfile.state)) score -= 15;
    if (jobs.length > 0 && !jobs.includes('All') && !jobs.includes(userProfile.occupation)) score -= 10;
    const seed = (scheme.schemeId || 'pm').charCodeAt(0) % 5;
    return Math.max(75, score - seed);
  };

  const isSchemeStale = (scheme) => {
    if (!scheme || !scheme.lastVerified) return false;
    const diffTime = Math.abs(new Date() - new Date(scheme.lastVerified));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 90;
  };

  return (
    <>
      {globalError && (
        <div className="bg-red-600 text-white text-sm font-semibold text-center py-2.5 z-50 fixed top-0 w-full animate-fade-in flex items-center justify-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4" /> {globalError}
        </div>
      )}

      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={
            <LandingScreen 
              initChatSession={initChatSession} 
              handleSendMessage={handleSendMessage}
              startVoiceInput={startVoiceInput}
              isListening={isListening}
              isAudioProcessing={isAudioProcessing}
            />
          } />
          
          <Route path="/chat" element={
            <ChatScreen 
              sessionType={sessionType} 
              operatorStats={operatorStats} 
              chatHistory={chatHistory} 
              currentUser={{ profile: { occupation: 'Operator' } }} 
              chatLoading={chatLoading} 
              chatEndRef={chatEndRef} 
              handleSendMessage={handleSendMessage} 
              chatMessage={chatMessage} 
              setChatMessage={setChatMessage} 
              startVoiceInput={startVoiceInput} 
              stopVoiceInput={stopVoiceInput}
              isListening={isListening} 
              isAudioProcessing={isAudioProcessing}
              voiceLang={voiceLang}
              toggleVoiceLang={toggleVoiceLang}
              interimTranscript={interimTranscript}
              audioLevel={audioLevel}
              chatSources={chatSources} 
              setSelectedScheme={setSelectedScheme} 
              formatDate={formatDate} 
              getDomain={getDomain} 
              handleSpeechOutput={handleSpeechOutput}
              isSpeaking={tts.isPlaying}
              speakingId={tts.currentId}
              stopSpeech={tts.stop}
            />
          } />
          
          <Route path="/admin" element={
            <DashboardScreen operatorStats={operatorStats} />
          } />
          
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/documents" element={<DocumentsScreen />} />
          <Route path="/applications" element={<ApplicationsScreen />} />
          <Route path="/tracking" element={<TrackingScreen />} />
          
          <Route path="/screener" element={
            <EligibilityScreener profile={profile} setProfile={setProfile} handleRunScreener={handleRunScreener} screenerLoading={screenerLoading} />
          } />
          
          <Route path="/schemes" element={
            <ResultsScreen screenerResults={screenerResults} screenerLoading={screenerLoading} profile={profile} setSelectedScheme={setSelectedScheme} getMatchScore={getMatchScore} formatDate={formatDate} />
          } />
          
          <Route path="/detail" element={
            selectedScheme ? 
              <DetailScreen selectedScheme={selectedScheme} chatSources={chatSources} handleSpeechOutput={handleSpeechOutput} isSpeaking={tts.isPlaying} speakingId={tts.currentId} stopSpeech={tts.stop} citizenName={citizenName} setCitizenName={setCitizenName} isSchemeStale={isSchemeStale} formatDate={formatDate} handleReportScheme={handleReportScheme} /> 
              : <div className="p-8 text-center text-gray-500">No scheme selected.</div>
          } />
        </Route>
      </Routes>

      {toast.message && (
        <div className={`fixed bottom-5 right-5 z-50 p-4 rounded shadow-sm border text-sm font-semibold flex items-center gap-2 animate-fade-in bg-white ${toast.type === 'success' ? 'border-green-200 text-green-700' : 'border-red-200 text-red-700'}`}>
          {toast.type === 'success' ? <Check className="w-4.5 h-4.5 text-green-600" /> : <AlertTriangle className="w-4.5 h-4.5 text-red-600" />}
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
