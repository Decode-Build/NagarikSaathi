import React from 'react';
import { ShieldAlert, Check } from 'lucide-react';

export default function ResultsScreen({ screenerResults, screenerLoading, profile, setPage, setSelectedScheme, getMatchScore, formatDate, t, langMode }) {
  return (
    <div className="space-y-6 animate-fade-in no-print">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <button 
            onClick={() => setPage('screener')} 
            className="text-xs text-amber-650 hover:text-amber-750 font-bold uppercase tracking-wider hover:underline flex items-center gap-1 mb-1"
          >
            &larr; Filter / फ़िल्टर बदलें
          </button>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">Eligible Schemes ({screenerResults.length})</h2>
        </div>
        <div className="text-xs text-slate-600 font-mono bg-slate-100 px-3.5 py-1.5 rounded-lg border border-slate-200 inline-block self-start sm:self-auto">
          {profile.state} · {profile.occupation} · Income: ≤₹{profile.annualIncome}
        </div>
      </div>

      {screenerLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-20 h-4 bg-slate-100 rounded-full animate-pulse"></div>
                <div className="space-y-2 flex flex-col items-end">
                  <div className="w-16 h-3 bg-slate-100 rounded-full animate-pulse"></div>
                  <div className="w-12 h-3 bg-slate-100 rounded-full animate-pulse"></div>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-5 bg-slate-100 rounded-full w-full animate-pulse"></div>
                <div className="h-5 bg-slate-100 rounded-full w-2/3 animate-pulse"></div>
              </div>
              <div className="w-32 h-4 bg-slate-100 rounded-full animate-pulse mt-4"></div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-slate-100 rounded-full w-full animate-pulse"></div>
                <div className="h-3 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
              </div>
            </div>
          ))}
        </div>
      ) : screenerResults.length === 0 ? (
        <div className="text-center py-16 bg-white border border-slate-200 rounded-2xl space-y-3 shadow-sm">
          <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">No Schemes Matched</h3>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {screenerResults.map((scheme, idx) => (
            <div 
              key={idx}
              className="bg-white border border-slate-200 hover:border-amber-600/50 rounded-2xl overflow-hidden transition-all flex flex-col hover:translate-y-[-2px] shadow-sm"
            >
              <div className="p-6 flex-grow space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-mono font-semibold">
                    {scheme.category?.[0] || 'General'}
                  </span>
                  
                  <div className="flex flex-col items-end gap-1">
                    <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[9px] font-bold font-mono border border-amber-200">
                      {scheme.eligibility.states.includes('All') ? 'Central' : `${scheme.eligibility.states[0]} State`}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-50 text-orange-700 text-[9px] font-extrabold font-mono border border-orange-200">
                      {getMatchScore(scheme, profile)}% Match
                    </span>
                  </div>
                </div>

                <h3 className="text-base font-extrabold text-slate-900 leading-snug line-clamp-2 hover:text-amber-650 cursor-pointer" onClick={() => {
                  setSelectedScheme(scheme);
                  setPage('detail');
                }}>
                  {langMode === 'hi' ? scheme.nameHindi : scheme.name}
                </h3>

                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-50 border border-green-150 text-green-700 text-[10px] font-semibold">
                  <Check className="w-3 h-3 text-green-600" />
                  <span>{t[langMode].verifiedBadge}: {formatDate(scheme.lastVerified)}</span>
                </div>

                <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed">
                  {langMode === 'hi' ? scheme.descriptionHindi : scheme.description}
                </p>
              </div>

              <div className="bg-slate-50/80 px-6 py-4 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400 truncate max-w-[150px] font-medium">{scheme.ministry}</span>
                <button 
                  onClick={() => {
                    setSelectedScheme(scheme);
                    setPage('detail');
                  }}
                  className="text-xs text-amber-655 hover:text-amber-750 font-bold hover:underline"
                >
                  {t[langMode].viewGuide} &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
