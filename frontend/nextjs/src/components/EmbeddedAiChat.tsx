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
      <div className="text-center py-6">
        <p className="text-orange-200 text-sm font-semibold mb-4">
          {lang === 'hi' ? 'त्वरित प्रश्न चुनें या ऊपर खोजें:' : 'Choose a quick prompt or type above:'}
        </p>
        <div className="flex flex-wrap justify-center gap-3 max-w-2xl mx-auto">
          {quickPrompts.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(chip)}
              className="text-xs md:text-sm bg-white/10 hover:bg-white/20 text-white border border-white/25 px-4.5 py-2.5 rounded-full font-bold shadow-md hover:scale-105 transition-all duration-300 backdrop-blur-sm"
            >
              {chip}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-orange-100 overflow-hidden mt-6 animate-in fade-in slide-in-from-bottom-6 duration-500">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-orange-600 via-red-600 to-amber-600 p-4 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center border border-white/30">
            <Bot size={22} className="text-white" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm md:text-base flex items-center gap-2">
              {lang === 'hi' ? 'नागरिक साथी AI सहायक' : 'NagarikSaathi AI Assistant'}
              <span className="text-[10px] bg-green-500 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Gemini 3.5</span>
            </h4>
            <p className="text-xs text-orange-100">
              {lang === 'hi' ? 'योजना और पात्रता स्पष्टीकरण' : 'Welfare scheme matches explained in real time'}
            </p>
          </div>
        </div>
        <button 
          onClick={handleClear}
          className="p-2.5 bg-white/10 hover:bg-white/25 rounded-full text-white transition-all hover:scale-105"
          title="Clear Chat / Reset Search"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Messages Body */}
      <div className="h-[320px] overflow-y-auto p-4 md:p-6 space-y-4 bg-orange-50/15">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3.5 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {m.sender === 'ai' && (
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 text-white flex items-center justify-center shrink-0 mt-1 shadow-md border border-orange-200">
                <Bot size={18} />
              </div>
            )}
            <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4.5 py-3.5 text-sm md:text-base shadow-sm leading-relaxed ${
              m.sender === 'user'
                ? 'bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-br-none font-semibold'
                : 'bg-white text-gray-800 border border-orange-50 rounded-bl-none font-medium'
            }`}>
              <p className="whitespace-pre-wrap">{m.text}</p>
              
              {m.sourceSchemes && m.sourceSchemes.length > 0 && (
                <div className="mt-3.5 pt-3.5 border-t border-orange-100/60 flex flex-wrap gap-2 items-center">
                  <span className="text-[11px] md:text-xs font-black text-orange-600">
                    {lang === 'hi' ? 'संबंधित योजनाएं:' : 'Cited Schemes:'}
                  </span>
                  {m.sourceSchemes.map(sid => (
                    <span key={sid} className="text-[11px] md:text-xs bg-orange-50 text-orange-800 border border-orange-100 px-2.5 py-0.5 rounded font-mono font-bold">
                      {sid}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex justify-between items-center mt-2.5 text-[10px] md:text-xs text-gray-400">
                <span>{m.timestamp}</span>
                {m.sender === 'ai' && (
                  <button
                    onClick={() => isPlaying ? stopTts() : speak(m.text, lang)}
                    className="text-orange-600 hover:text-orange-800 flex items-center gap-1.5 font-bold transition-colors"
                  >
                    <Volume2 size={14} className={isPlaying ? "animate-pulse" : ""} />
                    {lang === 'hi' ? 'सुनें' : 'Listen'}
                  </button>
                )}
              </div>
            </div>
            {m.sender === 'user' && (
              <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center shrink-0 mt-1 font-bold border border-orange-200">
                <User size={18} />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-3.5 justify-start animate-pulse">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-500 via-red-500 to-amber-500 text-white flex items-center justify-center shrink-0 mt-1 border border-orange-200">
              <Bot size={18} />
            </div>
            <div className="bg-white text-gray-600 border border-orange-50 rounded-2xl rounded-bl-none px-4.5 py-3.5 text-sm md:text-base shadow-sm flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-orange-500 rounded-full animate-bounce"></span>
              <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="text-xs text-gray-400 ml-1 font-semibold">
                {lang === 'hi' ? 'AI उत्तर तैयार कर रहा है...' : 'Gemini AI reasoning...'}
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestion Chips */}
      <div className="px-4 py-2.5 bg-white border-t border-orange-50/50 overflow-x-auto flex gap-2 no-scrollbar">
        {quickPrompts.map((chip, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(chip)}
            className="text-xs whitespace-nowrap bg-orange-50/60 hover:bg-orange-100 text-orange-800 border border-orange-100 px-3 py-1.5 rounded-full font-bold transition-all hover:scale-105 shrink-0"
          >
            {chip}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white border-t border-gray-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2 bg-orange-50/40 rounded-full px-4 py-2 border border-orange-100 focus-within:border-orange-500 focus-within:bg-white transition-all shadow-inner"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={lang === 'hi' ? 'योजना के बारे में और पूछें...' : 'Ask follow-up questions about these schemes...'}
            className="flex-1 bg-transparent px-2 py-2 text-sm md:text-base outline-none text-gray-800 placeholder:text-gray-400 font-medium"
          />
          {hasSpeechSupport && (
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className={`p-2.5 rounded-full transition-colors ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'text-orange-500 hover:bg-orange-100'
              }`}
              title="Voice Query"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-3 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white rounded-full hover:scale-105 transition-all disabled:opacity-40 shadow-md"
            title="Send"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
