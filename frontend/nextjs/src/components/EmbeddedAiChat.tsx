"use client";
import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, Sparkles, User, Mic, MicOff, Volume2, Trash2 } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  sourceSchemes?: string[];
  timestamp: string;
}

interface EmbeddedAiChatProps {
  lang: 'en' | 'hi';
  onSchemesFound: (schemes: any[]) => void;
  initialQuery?: string;
  onClear: () => void;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function EmbeddedAiChat({ lang, onSchemesFound, initialQuery, onClear }: EmbeddedAiChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const { text: speechText, isListening, startListening, stopListening, hasSupport: hasSpeechSupport } = useSpeechRecognition(lang);
  const { speak, isPlaying, stop: stopTts } = useTextToSpeech();

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

  // Handle initialQuery trigger from parent SearchBox
  useEffect(() => {
    if (initialQuery && initialQuery.trim()) {
      handleSend(initialQuery);
    }
  }, [initialQuery]);

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
          sessionType: 'self'
        })
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: data.answer || (lang === 'hi' ? 'मुझे इस विषय पर जानकारी मिली है।' : 'Here is the scheme information found for you.'),
          sourceSchemes: data.sources?.map((s: any) => s.schemeId) || data.citedSchemeIds || [],
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        
        setMessages(prev => [...prev, aiMsg]);
        
        // Pass the loaded schemes up to the main page results grid
        if (data.sources && Array.isArray(data.sources)) {
          onSchemesFound(data.sources);
        } else {
          onSchemesFound([]);
        }
      } else {
        throw new Error('API request failed');
      }
    } catch (err) {
      console.error("Chat error:", err);
      // Graceful local fallback if backend offline
      const fallbackAiMsg: Message = {
        id: (Date.now() + 1).toString(),
        sender: 'ai',
        text: lang === 'hi'
          ? 'खेती और किसान कल्याण के लिए प्रधानमंत्री किसान सम्मान निधि (PM-KISAN) और पीएम फसल बीमा योजना सर्वोत्तम विकल्प हैं। आप नजदीकी सीएससी केंद्र पर जाकर आवेदन कर सकते हैं।'
          : 'For farming and rural welfare, PM-KISAN (₹6,000 yearly income support) and PM Fasal Bima Yojana (crop insurance) are top recommended schemes. You can apply with your Aadhaar and Land Khatauni at any CSC center.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, fallbackAiMsg]);
      onSchemesFound([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    stopTts();
    onClear();
  };

  if (messages.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-orange-100 text-sm font-bold mb-4.5 opacity-90 flex items-center justify-center gap-1.5">
          <Sparkles size={14} className="text-amber-300 animate-pulse" />
          {lang === 'hi' ? 'त्वरित प्रश्न चुनें या ऊपर खोजें:' : 'Select a quick query or search above:'}
        </p>
        <div className="flex flex-wrap justify-center gap-3.5 max-w-3xl mx-auto px-4">
          {quickPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-xs md:text-[13px] bg-white/10 hover:bg-white/20 text-white border border-white/20 px-5 py-2.5 rounded-full font-bold shadow-md hover:scale-105 hover:border-white/30 transition-all duration-300 backdrop-blur-md cursor-pointer"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-orange-100/60 overflow-hidden mt-8 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 p-4.5 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Bot size={20} className="text-white" />
          </div>
          <div>
            <h4 className="font-black text-sm md:text-base flex items-center gap-2">
              {lang === 'hi' ? 'नागरिक साथी AI सहायक' : 'NagarikSaathi AI Assistant'}
              <span className="flex items-center gap-1 text-[9px] bg-green-500/90 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                </span>
                Gemini 3.5
              </span>
            </h4>
            <p className="text-xs text-orange-100 font-medium">
              {lang === 'hi' ? 'योजना और पात्रता स्पष्टीकरण' : 'Real-time welfare scheme guidance & matches'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleClear}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all hover:scale-105 cursor-pointer"
          title="Clear Chat / Reset Search"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Messages Body */}
      <div className="h-[320px] overflow-y-auto p-4 md:p-6 space-y-4 bg-orange-50/10">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-md border border-orange-100">
                <Bot size={16} />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4.5 py-3.5 text-sm md:text-[15px] shadow-sm leading-relaxed ${
              m.sender === 'user'
                ? 'bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-750 text-white rounded-br-none font-semibold'
                : 'bg-white text-gray-800 border border-slate-100 rounded-bl-none font-medium'
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              
              {m.sourceSchemes && m.sourceSchemes.length > 0 && (
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] font-bold text-orange-600">
                    {lang === 'hi' ? 'संबंधित योजनाएं:' : 'Cited Schemes:'}
                  </span>
                  {m.sourceSchemes.map(sid => (
                    <span key={sid} className="text-[11px] bg-orange-50 text-orange-800 border border-orange-100/60 px-2 py-0.5 rounded-lg font-mono font-bold hover:bg-orange-100 transition-colors cursor-default">
                      {sid}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center mt-3 text-[10px] md:text-xs text-gray-400">
                <span>{m.timestamp}</span>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => isPlaying ? stopTts() : speak(m.text, lang)}
                    className="text-orange-600 hover:text-orange-800 flex items-center gap-1.5 font-bold transition-colors cursor-pointer"
                  >
                    {isPlaying ? (
                      <div className="flex gap-0.5 items-center mr-0.5">
                        <span className="w-0.5 h-2.5 bg-orange-600 rounded-full animate-wave" style={{ animationDelay: '0.1s' }} />
                        <span className="w-0.5 h-3 bg-orange-600 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                        <span className="w-0.5 h-2 bg-orange-600 rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
                      </div>
                    ) : (
                      <Volume2 size={13} className="stroke-[2.5]" />
                    )}
                    {lang === 'hi' ? 'सुनें' : 'Listen'}
                  </button>
                )}
              </div>
            </div>
            {m.sender === 'user' && (
              <div className="w-9 h-9 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0 mt-1 font-bold border border-indigo-100">
                <User size={16} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3 justify-start animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 text-white flex items-center justify-center shrink-0 mt-1 border border-orange-100">
              <Bot size={16} />
            </div>
            <div className="bg-white text-gray-600 border border-slate-100 rounded-2xl rounded-bl-none px-4.5 py-3.5 text-sm md:text-[15px] shadow-sm flex items-center gap-2">
              <div className="flex gap-1 mr-1">
                <span className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
              <span className="text-xs text-gray-400 font-bold">
                {lang === 'hi' ? 'उत्तर तैयार हो रहा है...' : 'Gemini reasoning...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-3 bg-white border-t border-slate-100 overflow-x-auto flex gap-2 no-scrollbar">
        {quickPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-xs whitespace-nowrap bg-orange-50/50 hover:bg-orange-100/80 text-orange-950 border border-orange-100/50 px-3.5 py-1.5 rounded-full font-bold transition-all hover:scale-102 shrink-0 cursor-pointer"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 focus-within:border-orange-500 focus-within:bg-white transition-all shadow-inner rounded-2xl px-4 py-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'hi' ? 'योजना के बारे में और पूछें...' : 'Ask follow-up questions about these schemes...'}
            className="flex-1 bg-transparent px-2 py-2 text-sm md:text-base outline-none text-gray-800 placeholder:text-gray-400 font-semibold"
          />
          {hasSpeechSupport && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2 rounded-full transition-colors cursor-pointer ${
                isListening ? 'bg-red-500 text-white animate-pulse-glow' : 'text-orange-500 hover:bg-orange-50'
              }`}
              title="Voice Query"
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white rounded-full hover:scale-105 transition-all disabled:opacity-40 shadow-md cursor-pointer flex items-center justify-center"
            title="Send"
          >
            <Send size={16} className="ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
