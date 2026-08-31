"use client";
import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { convertTextLanguage } from '../utils/translator';
import { Mic, MicOff, Search, Send, ArrowLeftRight, Loader2, Sparkles } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  language?: 'en' | 'hi';
}

export default function SearchBox({ onSearch, placeholder = "Ask for schemes (e.g. I am a farmer...)", language = 'en' }: SearchBoxProps) {
  const { 
    text, 
    isListening, 
    startListening, 
    stopListening, 
    hasSupport, 
    voiceLang, 
    toggleVoiceLang, 
    error: speechError 
  } = useSpeechRecognition(language);

  const [query, setQuery] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [conversionNotice, setConversionNotice] = useState<string | null>(null);

  useEffect(() => {
    if (text) {
      setQuery(text);
    }
  }, [text]);

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // Convert/Translate input text between English & Hindi
  const handleConvert = async () => {
    if (!query.trim() || isConverting) return;
    setIsConverting(true);
    try {
      const isHindi = Boolean(query.match(/[\u0900-\u097F]/));
      const targetLang = isHindi ? 'en' : 'hi';
      const result = await convertTextLanguage(query, targetLang);
      if (result.translatedText && result.translatedText !== query) {
        setQuery(result.translatedText);
        setConversionNotice(
          targetLang === 'hi' 
            ? '✨ हिन्दी में अनुवादित (Converted to Hindi)' 
            : '✨ Converted to English (अंग्रेज़ी में अनुवादित)'
        );
        setTimeout(() => setConversionNotice(null), 3000);
      }
    } catch (err) {
      console.warn("Conversion error:", err);
    } finally {
      setIsConverting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-full shadow-2xl border-2 border-orange-200 overflow-hidden transition-all duration-300 focus-within:border-orange-500 focus-within:shadow-orange-200/50">
        <div className="flex items-center p-1.5 md:p-2">
          <div className="pl-4 md:pl-6 pr-2 text-orange-500 shrink-0">
            <Search size={22} className="text-orange-500" />
          </div>

          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 py-3 md:py-3.5 px-2 outline-none text-gray-800 bg-transparent text-sm md:text-base font-medium placeholder:text-gray-400 min-w-0"
          />

          {/* Quick Convert / Translate Button (English <-> Hindi) */}
          {query.trim().length > 0 && (
            <button
              type="button"
              onClick={handleConvert}
              disabled={isConverting}
              className="flex items-center gap-1 px-2.5 py-1.5 mr-1 rounded-full bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 hover:scale-105 transition-all text-xs font-bold shrink-0 shadow-sm disabled:opacity-50"
              title="Convert / Translate (English ⇄ हिन्दी)"
            >
              {isConverting ? (
                <Loader2 size={13} className="animate-spin text-orange-600" />
              ) : (
                <ArrowLeftRight size={13} className="text-orange-600" />
              )}
              <span className="hidden sm:inline">
                {query.match(/[\u0900-\u097F]/) ? 'EN में बदलें' : 'हिन्दी में बदलें'}
              </span>
            </button>
          )}

          {/* Voice Input Button & Language Badge */}
          {hasSupport && (
            <div className="flex items-center gap-1 mx-1 shrink-0">
              <button
                type="button"
                onClick={toggleVoiceLang}
                className="px-2 py-1 rounded-full text-[10px] md:text-xs font-extrabold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors shrink-0"
                title={`Voice recognition language: ${voiceLang === 'hi' ? 'Hindi (हिन्दी)' : 'English (India)'}. Click to toggle.`}
              >
                {voiceLang === 'hi' ? '🇮🇳 HI' : '🌐 EN'}
              </button>

              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                className={`p-3 md:p-3.5 rounded-full transition-all duration-300 shadow-sm shrink-0 ${
                  isListening 
                    ? 'bg-red-500 text-white animate-pulse ring-4 ring-red-200' 
                    : 'bg-orange-100 text-orange-600 hover:bg-orange-200 hover:scale-105'
                }`}
                title={isListening ? "Stop listening" : `Start voice input in ${voiceLang === 'hi' ? 'Hindi' : 'English'}`}
              >
                {isListening ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
            </div>
          )}

          {/* Search Trigger Button */}
          <button
            type="button"
            onClick={handleSearch}
            className="p-3 md:p-3.5 ml-1 mr-1 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-amber-600 text-white hover:from-orange-600 hover:to-red-700 transition-all shadow-md transform hover:scale-105 shrink-0"
            title="Search"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Live Voice Status Indicator Banner */}
        {isListening && (
          <div className="bg-red-50 px-4 py-2 text-xs font-semibold text-red-600 border-t border-red-100 flex items-center justify-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-red-600 animate-ping"></span>
            <span>
              {voiceLang === 'hi' 
                ? '🎙️ आवाज़ सुन रहा है (हिन्दी में बोलें)...' 
                : '🎙️ Listening... (Speak in English)...'}
            </span>
          </div>
        )}

        {/* Speech Error Banner */}
        {speechError && (
          <div className="bg-amber-50 px-4 py-1.5 text-xs font-medium text-amber-800 border-t border-amber-100 text-center">
            {speechError}
          </div>
        )}
      </div>

      {/* Conversion Toast Notice */}
      {conversionNotice && (
        <div className="mt-2 text-center text-xs font-bold text-orange-800 bg-orange-100/80 backdrop-blur-sm border border-orange-200 px-4 py-1 rounded-full w-fit mx-auto shadow-sm animate-in fade-in slide-in-from-top-1">
          {conversionNotice}
        </div>
      )}
    </div>
  );
}
