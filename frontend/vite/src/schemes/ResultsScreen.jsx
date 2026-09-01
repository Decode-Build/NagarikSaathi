import React, { useState, useEffect } from 'react';
import { ShieldAlert, Check, Filter, X, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

const API_BASE = window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')
  ? 'http://localhost:5000/api'
  : `${window.location.origin}/api`;

export default function ResultsScreen({ 
  screenerResults, 
  screenerLoading: propsScreenerLoading, 
  profile, 
  setSelectedScheme, 
  getMatchScore, 
  formatDate 
}) {
  const { t, lang: langMode } = useLanguage();
  const navigate = useNavigate();

  const [schemes, setSchemes] = useState(screenerResults || []);
  const [loading, setLoading] = useState(propsScreenerLoading || false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination State
  const [page, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Filter State
  const [filterState, setFilterState] = useState('');
  const [filterCategory, setFilterCategory] = useState('');

  // If screener results are provided via props, use them. Otherwise fetch all.
  const isScreenerMode = screenerResults && screenerResults.length > 0;

  useEffect(() => {
    if (isScreenerMode) {
      setSchemes(screenerResults);
      setLoading(propsScreenerLoading);
      setTotalPages(1);
    } else {
      fetchSchemes();
    }
  }, [screenerResults, propsScreenerLoading, page, filterState, filterCategory]);

  const fetchSchemes = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE}/schemes?page=${page}&limit=20`;
      if (filterState) url += `&state=${filterState}`;
      if (filterCategory) url += `&category=${filterCategory}`;
      
      const res = await axios.get(url);
      if (res.data.schemes) {
        setSchemes(res.data.schemes);
        setTotalPages(res.data.totalPages || 1);
      } else {
        setSchemes(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex relative h-full">
      {/* Filter Overlay Mobile */}
      {isFilterOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsFilterOpen(false)}
        />
      )}

      {/* Filter Sidebar Drawer */}
      <div className={`fixed md:sticky top-0 right-0 h-full w-80 bg-white border-l border-slate-200 z-50 transform transition-transform duration-300 md:translate-x-0 ${isFilterOpen ? 'translate-x-0' : 'translate-x-full md:hidden md:w-0 md:border-none md:overflow-hidden'}`}>
        <div className="p-6 h-full overflow-y-auto space-y-6">
          <div className="flex justify-between items-center border-b pb-4">
            <h3 className="font-bold text-lg flex items-center gap-2"><Filter className="w-5 h-5"/> {t.filterLabel || 'Filters'}</h3>
            <button onClick={() => setIsFilterOpen(false)} className="md:hidden text-gray-500 hover:text-black">
              <X className="w-5 h-5"/>
            </button>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">{t.stateLabel || 'State'}</label>
              <select 
                value={filterState} 
                onChange={(e) => { setFilterState(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
              >
                <option value="">All States</option>
                <option value="Madhya Pradesh">Madhya Pradesh</option>
                <option value="Uttar Pradesh">Uttar Pradesh</option>
                <option value="Maharashtra">Maharashtra</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <select 
                value={filterCategory} 
                onChange={(e) => { setFilterCategory(e.target.value); setCurrentPage(1); }}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-sm"
              >
                <option value="">All Categories</option>
                <option value="Agriculture">Agriculture</option>
                <option value="Women">Women</option>
                <option value="Health">Health</option>
              </select>
            </div>
          </div>
          
          {!isScreenerMode && (
             <div className="pt-4 border-t border-slate-100">
               <button onClick={() => navigate('/screener')} className="w-full py-3 text-sm font-bold text-amber-700 bg-amber-50 rounded-lg border border-amber-200 hover:bg-amber-100 transition-colors">
                  Run Detailed Screener
               </button>
             </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 w-full space-y-6 animate-fade-in no-print md:pr-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
              {isScreenerMode ? `Eligible Schemes (${schemes.length})` : t.allSchemes}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {isScreenerMode && profile && (
              <div className="text-xs text-slate-600 font-mono bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 hidden md:block">
                {profile.state} · {profile.occupation}
              </div>
            )}
            <button 
              onClick={() => setIsFilterOpen(true)}
              className="md:hidden flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold shadow-sm"
            >
              <Filter className="w-4 h-4"/> Filter
            </button>
          </div>
        </div>

        {loading ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="w-20 h-4 bg-slate-100 rounded-full animate-pulse"></div>
                  <div className="w-16 h-4 bg-slate-100 rounded-full animate-pulse"></div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-5 bg-slate-100 rounded-full w-full animate-pulse"></div>
                  <div className="h-5 bg-slate-100 rounded-full w-2/3 animate-pulse"></div>
                </div>
                <div className="w-32 h-4 bg-slate-100 rounded-full animate-pulse mt-4"></div>
              </div>
            ))}
          </div>
        ) : schemes.length === 0 ? (
          <div className="text-center py-16 bg-white border border-slate-200 rounded-xl space-y-3 shadow-sm">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800">{t.noSchemes}</h3>
            <p className="text-slate-500">{t.noSchemesSub}</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
              {schemes.map((scheme, idx) => (
                <div 
                  key={scheme.schemeId || idx}
                  className="bg-white border border-slate-200 hover:border-amber-500 rounded-xl overflow-hidden transition-all flex flex-col hover:-translate-y-1 hover:shadow-lg shadow-sm group"
                >
                  <div className="p-6 flex-grow space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                        {scheme.category?.[0] || 'General'}
                      </span>
                      
                      {isScreenerMode && (
                        <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 text-[10px] font-extrabold font-mono border border-green-200">
                          {getMatchScore(scheme, profile)}% Match
                        </span>
                      )}
                    </div>

                    <h3 className="text-lg font-extrabold text-slate-900 leading-snug line-clamp-2 group-hover:text-amber-700 transition-colors cursor-pointer" onClick={() => {
                      setSelectedScheme(scheme);
                      navigate('/detail');
                    }}>
                      {langMode === 'hi' ? (scheme.nameHindi || scheme.name) : scheme.name}
                    </h3>

                    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-50 border border-green-150 text-green-700 text-[10px] font-semibold">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{t.verifiedBadge || 'Verified'}: {formatDate(scheme.lastVerified)}</span>
                    </div>

                    <p className="text-sm text-slate-500 line-clamp-3 leading-relaxed">
                      {langMode === 'hi' ? (scheme.descriptionHindi || scheme.description) : scheme.description}
                    </p>
                  </div>

                  <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[10px] text-gray-500 truncate max-w-[150px] font-medium uppercase tracking-widest">{scheme.ministry}</span>
                    <button 
                      onClick={() => {
                        setSelectedScheme(scheme);
                        navigate('/detail');
                      }}
                      className="text-sm text-amber-600 group-hover:text-amber-700 font-bold flex items-center gap-1 transition-colors"
                    >
                      {t.viewGuide || 'View Guide'} &rarr;
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination Controls */}
            {!isScreenerMode && totalPages > 1 && (
              <div className="flex items-center justify-center gap-4 py-4 border-t border-slate-200">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-semibold text-slate-700">
                  Page {page} of {totalPages}
                </span>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
