"use client";
import React, { useState, useEffect } from 'react';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { Mic, MicOff, Search, Send } from 'lucide-react';

interface SearchBoxProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  language?: 'en' | 'hi';
}

export default function SearchBox({ onSearch, placeholder = "Ask for schemes (e.g. I am a farmer...)", language = 'en' }: SearchBoxProps) {
  const { text, isListening, startListening, stopListening, hasSupport } = useSpeechRecognition(language);
  const [query, setQuery] = useState('');

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

  return (
    <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-md rounded-3xl shadow-xl hover:shadow-2xl border-2 border-orange-100/80 overflow-hidden focus-within:ring-4 focus-within:ring-orange-500/15 focus-within:border-orange-500 transition-all duration-300">
      <div className="flex items-center p-2.5">
        <div className="pl-5 pr-2.5 text-orange-500">
          <Search size={22} className="stroke-[2.5]" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 py-3.5 px-2 outline-none text-gray-800 bg-transparent text-[17px] placeholder:text-gray-400 font-medium"
        />
        
        {hasSupport && (
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-3.5 mx-1.5 rounded-full transition-all duration-300 shadow-sm cursor-pointer ${
              isListening 
                ? 'bg-red-500 text-white animate-pulse-glow hover:bg-red-600 scale-105' 
                : 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:scale-105'
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={20} className="stroke-[2.5]" /> : <Mic size={20} className="stroke-[2.5]" />}
          </button>
        )}
        
        <button
          onClick={handleSearch}
          className="p-3.5 ml-1 mr-1.5 rounded-full bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white hover:from-orange-600 hover:to-red-600 transition-all shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105 active:scale-95 flex items-center justify-center"
          title="Search"
        >
          <Send size={20} className="stroke-[2.5] ml-0.5" />
        </button>
      </div>
      {isListening && (
        <div className="flex justify-center items-center gap-1.5 py-3 border-t border-red-50/50 bg-red-50/20">
          <span className="text-xs font-bold text-red-500 animate-pulse mr-2">
            {language === 'hi' ? 'सुन रहा है... बोलिए' : 'Listening... speak now'}
          </span>
          <div className="w-1 h-4 bg-red-500 rounded-full animate-wave" style={{ animationDelay: '0.1s' }} />
          <div className="w-1 h-5 bg-red-500 rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
          <div className="w-1 h-4 bg-red-500 rounded-full animate-wave" style={{ animationDelay: '0.5s' }} />
          <div className="w-1 h-5 bg-red-500 rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
          <div className="w-1 h-3 bg-red-500 rounded-full animate-wave" style={{ animationDelay: '0.4s' }} />
        </div>
      )}
    </div>
  );
}

