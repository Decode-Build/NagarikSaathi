import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, List, MessageSquare, LayoutDashboard, HelpCircle, X, FileText, Target, Settings, PlayCircle } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { t } = useLanguage();

  const navItems = [
    { path: '/admin', icon: <LayoutDashboard size={20} />, label: t.adminPanel || 'Dashboard' },
    { path: '/', icon: <Home size={20} />, label: t.home || 'Home' },
    { path: '/schemes', icon: <List size={20} />, label: t.allSchemes || 'Schemes' },
    { path: '/documents', icon: <FileText size={20} />, label: t.documents || 'Documents' },
    { path: '/tracking', icon: <Target size={20} />, label: t.tracking || 'Tracking' },
    { path: '/chat', icon: <MessageSquare size={20} />, label: t.aiSaathi || 'AI Saathi' },
    { path: '/screener', icon: <Settings size={20} />, label: 'Filters' },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 z-40 md:hidden no-print"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out flex flex-col no-print
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:flex-shrink-0
      `}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 text-white rounded-lg flex items-center justify-center font-black">
              ना
            </div>
            <span className="font-bold text-gray-900">{t.title || 'NagrikSaathi'}</span>
          </div>
          <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-900">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
          {navItems.map((item, idx) => (
            <NavLink
              key={`${item.path}-${idx}`}
              to={item.path}
              onClick={() => {
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
                ${isActive && item.path !== '/#' ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
          
          <NavLink
            to="/how-it-works"
            onClick={() => {
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className={({ isActive }) => `
              flex items-center gap-3 px-3 py-2.5 rounded-lg font-medium transition-colors
              ${isActive ? 'bg-amber-50 text-amber-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}
            `}
          >
            <PlayCircle size={20} />
            <span>End-to-End Demo</span>
          </NavLink>
        </nav>

        <div className="p-4 border-t border-gray-200">
          <div className="bg-blue-50 text-blue-800 p-3 rounded-xl">
            <p className="text-xs font-semibold">{t.operatorHeader || 'CSC OPERATOR ACTIVE'}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
