import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  List, 
  MessageSquare, 
  LayoutDashboard, 
  FileText, 
  Target, 
  SlidersHorizontal, 
  PlayCircle,
  X,
  Shield,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { t, lang } = useLanguage();

  const navItems = [
    { 
      path: '/admin', 
      icon: <LayoutDashboard size={19} />, 
      label: t.adminPanel || 'Dashboard', 
      badge: 'Live', 
      badgeColor: 'bg-emerald-100 text-emerald-800' 
    },
    { 
      path: '/', 
      icon: <Home size={19} />, 
      label: t.home || 'Home' 
    },
    { 
      path: '/schemes', 
      icon: <List size={19} />, 
      label: t.allSchemes || 'Schemes', 
      badge: '1,050+', 
      badgeColor: 'bg-blue-100 text-blue-800 font-mono' 
    },
    { 
      path: '/screener', 
      icon: <SlidersHorizontal size={19} />, 
      label: lang === 'hi' ? 'पात्रता फिल्टर' : 'Eligibility Screener' 
    },
    { 
      path: '/chat', 
      icon: <MessageSquare size={19} />, 
      label: t.aiSaathi || 'AI Saathi', 
      badge: 'Voice AI', 
      badgeColor: 'bg-amber-100 text-amber-800' 
    },
    { 
      path: '/documents', 
      icon: <FileText size={19} />, 
      label: t.documents || 'OCR Verification' 
    },
    { 
      path: '/tracking', 
      icon: <Target size={19} />, 
      label: t.tracking || 'Track Status' 
    },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 md:hidden no-print"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-slate-900 text-slate-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0 border-r border-slate-800 shadow-xl
      `}>
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FF9933] text-slate-950 font-black flex items-center justify-center text-sm shadow-md">
              🏛️
            </div>
            <div>
              <span className="font-extrabold text-white text-base tracking-tight font-display">
                नागरिक साथी
              </span>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                Digital India DPI
              </p>
            </div>
          </div>
          <button 
            onClick={toggleSidebar} 
            className="md:hidden text-slate-400 hover:text-white p-1 rounded-md"
            aria-label="Close sidebar"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-5 px-3 space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Navigation Menu
          </div>

          {navItems.map((item, idx) => (
            <NavLink
              key={`${item.path}-${idx}`}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) => `
                flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all
                ${isActive 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold shadow-md shadow-blue-900/30' 
                  : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
              `}
            >
              <div className="flex items-center gap-3">
                <span className="text-slate-400 group-hover:text-white">{item.icon}</span>
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}

          <div className="pt-4 px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 font-mono">
            Guided Showcase
          </div>

          <NavLink
            to="/how-it-works"
            onClick={() => {
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className={({ isActive }) => `
              flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all
              ${isActive 
                ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-slate-950 font-bold shadow-md' 
                : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'}
            `}
          >
            <PlayCircle size={19} className="text-amber-400" />
            <span>End-to-End Demo</span>
          </NavLink>
        </nav>

        {/* Operator Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50 border border-slate-700/60">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-xs">
              VLE
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">CSC Operator Console</p>
              <p className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online · Sehore
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
