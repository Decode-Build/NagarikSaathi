"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Sparkles, User, Mic, MicOff, Volume2, VolumeX, ArrowLeftRight, Loader2, Languages } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';
import { convertTextLanguage } from '../utils/translator';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  translatedText?: string;
  showingTranslation?: boolean;
  isTranslating?: boolean;
  sourceSchemes?: string[];
  timestamp: string;
}

interface AiChatDrawerProps {
  lang: 'en' | 'hi';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function AiChatDrawer({ lang }: AiChatDrawerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: lang === 'hi'
        ? 'नमस्ते! मैं आपका नागरिक साथी AI सहायक हूँ। आप मुझसे किसी भी सरकारी योजना, पात्रता या आवश्यक दस्तावेज़ों के बारे में पूछ सकते हैं।'
        : 'Namaste! I am your NagarikSaathi AI assistant. Ask me about any government scheme, eligibility requirements, or required documents.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConvertingInput, setIsConvertingInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { 
    text: speechText, 
    isListening, 
    startListening, 
    stopListening, 
    hasSupport: hasSpeechSupport,
    voiceLang,
    toggleVoiceLang,
    error: speechError
  } = useSpeechRecognition(lang);

  const { speak, isPlaying, stop: stopTts, currentText } = useTextToSpeech();

  // Populate voice recognition into input
  useEffect(() => {
    if (speechText) {
      setInput(speechText);
    }
  }, [speechText]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickPrompts = lang === 'hi' ? [
    '🌾 किसान भाइयों के लिए मुख्य योजनाएं',
    '👩 महिलाओं के लिए वित्तीय सहायता',
    '🏥 5 लाख तक का मुफ्त इलाज कैसे मिलेगा?',
    '💼 बिना गारंटी व्यापार लोन कैसे लें?'
  ] : [
    '🌾 Top schemes for small farmers',
    '👩 Financial support for women',
    '🏥 How to get free ₹5 Lakh health cover?',
    '💼 Collateral-free business loans'
  ];

  const handleConvertInput = async () => {
    if (!input.trim() || isConvertingInput) return;
    setIsConvertingInput(true);
    try {
      const isHindi = Boolean(input.match(/[\u0900-\u097F]/));
      const targetLang = isHindi ? 'en' : 'hi';
      const result = await convertTextLanguage(input, targetLang);
      if (result.translatedText) {
        setInput(result.translatedText);
      }
    } catch (err) {
      console.warn("Input translation error:", err);
    } finally {
      setIsConvertingInput(false);
    }
  };

  const handleToggleMessageTranslation = async (msgId: string) => {
    const targetMsg = messages.find(m => m.id === msgId);
    if (!targetMsg) return;

    if (targetMsg.translatedText) {
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, showingTranslation: !m.showingTranslation } : m
      ));
      return;
    }

    setMessages(prev => prev.map(m => 
      m.id === msgId ? { ...m, isTranslating: true } : m
    ));

    try {
      const isHindi = Boolean(targetMsg.text.match(/[\u0900-\u097F]/));
      const targetLang = isHindi ? 'en' : 'hi';
      const result = await convertTextLanguage(targetMsg.text, targetLang);

      setMessages(prev => prev.map(m => 
        m.id === msgId 
          ? { 
              ...m, 
              translatedText: result.translatedText, 
              showingTranslation: true, 
              isTranslating: false 
            } 
          : m
      ));
    } catch (err) {
      console.warn("Message translation error:", err);
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, isTranslating: false } : m
      ));
    }
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          sessionId: `nextjs-session-${Date.now()}`,
          sessionType: 'self',
          preferredLang: lang
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer || (lang === 'hi' ? 'मुझे इस विषय पर जानकारी मिली है।' : 'Here is the scheme information found for you.'),
          sourceSchemes: data.citedSchemeIds || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        throw new Error('API request failed');
      }
    } catch {
      const fallbackAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: lang === 'hi'
          ? 'खेती और किसान कल्याण के लिए प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) और पीएम फसल बीमा योजना सर्वोत्तम विकल्प हैं। आप नजदीकी सीएससी केंद्र पर जाकर आवेदन कर सकते हैं।'
          : 'For farming and rural welfare, PM-KISAN (₹6,000 yearly income support) and PM Fasal Bima Yojana (crop insurance) are top recommended schemes. You can apply with your Aadhaar and Land Khatauni at any CSC center.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackAiMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Launcher Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 text-white px-5 py-3.5 rounded-full shadow-2xl hover:shadow-orange-500/50 hover:scale-105 transition-all duration-300 border-2 border-white/40"
        title="Chat with AI Nagarik Saathi"
      >
        <div className="relative">
          <Bot size={24} className="animate-pulse" />
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-green-400 rounded-full border-2 border-white"></span>
        </div>
        <span className="font-bold text-sm tracking-wide">
          {lang === 'hi' ? 'AI साथी से पूछें' : 'Ask AI Saathi'}
        </span>
        <Sparkles size={18} className="text-yellow-300" />
      </button>

      {/* Drawer Overlay */}
      {isOpen && (
        <div 
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity"
        />
      )}

      {/* Slide-over Chat Panel */}
      <div className={`fixed top-0 right-0 h-full w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out border-l border-orange-100 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Drawer Header */}
        <div className="bg-gradient-to-r from-orange-600 to-red-600 p-4 text-white flex justify-between items-center shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
              <Bot size={22} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base flex items-center gap-2">
                {lang === 'hi' ? 'नागरिक साथी AI' : 'NagarikSaathi AI'}
                <span className="text-[10px] bg-green-500/80 text-white px-2 py-0.5 rounded-full font-medium">Bilingual AI</span>
              </h3>
              <p className="text-xs text-orange-100">
                {lang === 'hi' ? 'योजना एवं पात्रता सलाहकार' : 'Scheme & Eligibility Advisor'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-orange-50/20">
          {messages.map((m) => {
            const displayText = m.showingTranslation && m.translatedText ? m.translatedText : m.text;
            const isHindiText = Boolean(displayText.match(/[\u0900-\u097F]/));
            const isCurrentlySpeaking = isPlaying && currentText === displayText;

            return (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {m.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shrink-0 mt-1 shadow-sm">
                    <Bot size={15} />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                  m.sender === 'user'
                    ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-br-none'
                    : 'bg-white text-gray-800 border border-gray-100 rounded-bl-none'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{displayText}</p>
                  
                  {m.sourceSchemes && m.sourceSchemes.length > 0 && (
                    <div className="mt-2.5 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5 items-center">
                      <span className="text-[11px] font-semibold text-orange-600">
                        {lang === 'hi' ? 'संबंधित योजनाएं:' : 'Cited Schemes:'}
                      </span>
                      {m.sourceSchemes.map(sid => (
                        <span key={sid} className="text-[11px] bg-orange-100 text-orange-800 px-2 py-0.5 rounded font-mono">
                          {sid}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap justify-between items-center gap-2 mt-2 pt-1.5 border-t border-gray-50 text-[10px] text-gray-400">
                    <span>{m.timestamp}</span>
                    {m.sender === 'ai' && (
                      <div className="flex items-center gap-2">
                        {/* Translate button */}
                        <button
                          type="button"
                          onClick={() => handleToggleMessageTranslation(m.id)}
                          disabled={m.isTranslating}
                          className="text-orange-700 hover:text-orange-900 bg-orange-50 border border-orange-200 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold transition-all disabled:opacity-50"
                          title="Translate message"
                        >
                          {m.isTranslating ? (
                            <Loader2 size={10} className="animate-spin text-orange-600" />
                          ) : (
                            <Languages size={10} className="text-orange-600" />
                          )}
                          <span>
                            {m.showingTranslation 
                              ? (lang === 'hi' ? 'मूल (Original)' : 'Original')
                              : (isHindiText ? 'English' : 'हिन्दी')}
                          </span>
                        </button>

                        {/* Audio readout */}
                        <button
                          onClick={() => isCurrentlySpeaking ? stopTts() : speak(displayText, lang)}
                          className={`flex items-center gap-1 px-2 py-0.5 rounded-full font-medium transition-colors ${
                            isCurrentlySpeaking ? 'bg-red-500 text-white animate-pulse' : 'text-orange-600 hover:text-orange-800'
                          }`}
                        >
                          {isCurrentlySpeaking ? <VolumeX size={12} /> : <Volume2 size={12} />}
                          <span>{isCurrentlySpeaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'सुनें' : 'Listen')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {m.sender === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-gray-200 text-gray-700 flex items-center justify-center shrink-0 mt-1">
                    <User size={15} />
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex gap-2.5 justify-start">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-red-600 text-white flex items-center justify-center shrink-0 mt-1">
                <Bot size={15} />
              </div>
              <div className="bg-white text-gray-600 border border-gray-100 rounded-2xl rounded-bl-none px-4 py-3 text-sm shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                <span className="text-xs text-gray-400 ml-1">
                  {lang === 'hi' ? 'Gemini AI उत्तर तैयार कर रहा है...' : 'Gemini AI reasoning...'}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="px-3 py-2 bg-white border-t border-gray-100 overflow-x-auto flex gap-2 no-scrollbar">
          {quickPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-xs whitespace-nowrap bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 px-2.5 py-1 rounded-full font-medium transition-all"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-gray-200">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center gap-2 bg-gray-100 rounded-full px-3 py-1.5 border border-gray-200 focus-within:border-orange-500 focus-within:bg-white transition-all shadow-inner"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={lang === 'hi' ? 'योजना के बारे में पूछें...' : 'Ask about government schemes...'}
              className="flex-1 bg-transparent px-2 py-1.5 text-sm outline-none text-gray-800 placeholder:text-gray-400 min-w-0"
            />

            {input.trim().length > 0 && (
              <button
                type="button"
                onClick={handleConvertInput}
                disabled={isConvertingInput}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-100 text-orange-800 text-[11px] font-bold shrink-0"
                title="Convert English / Hindi"
              >
                {isConvertingInput ? <Loader2 size={10} className="animate-spin" /> : <ArrowLeftRight size={10} />}
                <span>{input.match(/[\u0900-\u097F]/) ? 'EN' : 'हिन्दी'}</span>
              </button>
            )}

            {hasSpeechSupport && (
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={toggleVoiceLang}
                  className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300"
                  title="Toggle voice language"
                >
                  {voiceLang === 'hi' ? 'HI' : 'EN'}
                </button>

                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`p-2 rounded-full transition-colors ${
                    isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-500 hover:text-orange-600'
                  }`}
                  title="Voice Query"
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} />}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-full hover:from-orange-700 hover:to-red-700 transition-all disabled:opacity-40 shadow-sm shrink-0"
              title="Send"
            >
              <Send size={16} />
            </button>
          </form>

          {isListening && (
            <div className="mt-1 text-center text-[11px] font-semibold text-red-500 animate-pulse">
              {voiceLang === 'hi' ? '🎙️ हिन्दी में बोलें...' : '🎙️ Speak in English...'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
