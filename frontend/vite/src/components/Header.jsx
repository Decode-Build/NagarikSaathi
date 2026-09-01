import React from 'react';
import { Menu } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Header({ toggleSidebar }) {
  const { lang, setLang } = useLanguage();

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button 
          onClick={toggleSidebar}
          className="p-2 -ml-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg md:hidden"
        >
          <Menu size={24} />
        </button>
        <span className="font-bold text-gray-800 hidden sm:block">
          {lang === 'hi' ? 'कल्याणकारी योजना पोर्टल' : 'Welfare Scheme Portal'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        {/* Language Toggle */}
        <div className="bg-gray-100 p-1 rounded-lg flex items-center">
          <button
            onClick={() => { if (lang !== 'en') { setLang('en'); localStorage.setItem('appLang', 'en'); } }}
            className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${
              lang === 'en' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            English
          </button>
          <button
            onClick={() => { if (lang !== 'hi') { setLang('hi'); localStorage.setItem('appLang', 'hi'); } }}
            className={`px-3 py-1 text-sm font-bold rounded-md transition-all ${
              lang === 'hi' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>
    </header>
  );
}
