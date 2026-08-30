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
    <div className="w-full max-w-2xl mx-auto bg-white/95 backdrop-blur-sm rounded-full shadow-2xl border-2 border-orange-100 overflow-hidden">
      <div className="flex items-center p-2">
        <div className="pl-6 pr-2 text-orange-500">
          <Search size={24} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 py-4 px-2 outline-none text-gray-800 bg-transparent text-lg placeholder:text-gray-400"
        />
        
        {hasSupport && (
          <button
            onClick={isListening ? stopListening : startListening}
            className={`p-4 mx-1 rounded-full transition-all duration-300 shadow-sm ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-orange-100 text-orange-600 hover:bg-orange-200'
            }`}
            title={isListening ? "Stop listening" : "Start voice input"}
          >
            {isListening ? <MicOff size={24} /> : <Mic size={24} />}
          </button>
        )}
        
        <button
          onClick={handleSearch}
          className="p-4 ml-1 mr-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 text-white hover:from-orange-600 hover:to-red-700 transition-all shadow-md transform hover:scale-105"
          title="Search"
        >
          <Send size={24} />
        </button>
      </div>
      {isListening && (
        <div className="px-6 pb-4 text-sm font-medium text-red-500 animate-pulse text-center">
          {language === 'hi' ? 'सुन रहा है... कृपया बोलें।' : 'Listening... Please speak now.'}
        </div>
      )}
    </div>
  );
}
