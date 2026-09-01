import React from 'react';
import { INDIAN_STATES, OCCUPATIONS } from '../utils/constants.js';
import { useLanguage } from '../context/LanguageContext';

export default function EligibilityScreener({ profile, setProfile, handleRunScreener, setPage, screenerLoading }) {
  const { t, lang: langMode } = useLanguage();

  return (
    <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded shadow-sm p-8 animate-fade-in no-print">
      <div className="space-y-2 border-b border-slate-100 pb-6 mb-6">
        <h2 className="text-2xl font-extrabold text-slate-900 font-display">{t.eligibilityTitle}</h2>
        <p className="text-sm text-slate-500">{t.eligibilityDesc}</p>
      </div>

      <form onSubmit={handleRunScreener} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.stateLabel}</label>
            <select
              value={profile.state}
              onChange={(e) => setProfile({...profile, state: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-650 focus:bg-white transition-colors"
            >
              {INDIAN_STATES.map((st, idx) => (
                <option key={idx} value={st}>{st}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.occLabel}</label>
            <div className="grid grid-cols-2 gap-2">
              {OCCUPATIONS.map((occ, idx) => (
                <label 
                  key={idx} 
                  className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    profile.occupation === occ 
                      ? 'bg-amber-50 border-green-600 text-amber-900 font-bold' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="occupation"
                    value={occ}
                    checked={profile.occupation === occ}
                    onChange={(e) => setProfile({...profile, occupation: e.target.value})}
                    className="sr-only"
                  />
                  {occ}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.genderLabel}</label>
            <div className="flex gap-3">
              {['Male', 'Female'].map((gen, idx) => (
                <label 
                  key={idx} 
                  className={`flex-grow text-center py-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    profile.gender === gen 
                      ? 'bg-amber-50 border-green-600 text-amber-900 font-bold' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="gender"
                    value={gen}
                    checked={profile.gender === gen}
                    onChange={(e) => setProfile({...profile, gender: e.target.value})}
                    className="sr-only"
                  />
                  {gen === 'Male' ? 'Male / पुरुष' : 'Female / महिला'}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.maritalLabel}</label>
            <div className="flex gap-2">
              {['Single', 'Married', 'Widowed'].map((mar, idx) => (
                <label 
                  key={idx} 
                  className={`flex-grow text-center py-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    profile.maritalStatus === mar 
                      ? 'bg-amber-50 border-green-600 text-amber-900 font-bold' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="maritalStatus"
                    value={mar}
                    checked={profile.maritalStatus === mar}
                    onChange={(e) => setProfile({...profile, maritalStatus: e.target.value})}
                    className="sr-only"
                  />
                  {mar}
                </label>
              ))}
            </div>
          </div>

          <div className="space-y-2 md:col-span-2">
            <div className="flex justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
              <span>{t.landLabel}</span>
              <span className="text-amber-700 font-mono text-sm font-bold">{profile.landAcres} Acres</span>
            </div>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              value={profile.landAcres}
              onChange={(e) => setProfile({...profile, landAcres: Number(e.target.value)})}
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.incomeLabel}</label>
            <input
              type="number"
              value={profile.annualIncome}
              onChange={(e) => setProfile({...profile, annualIncome: Number(e.target.value)})}
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-650 focus:bg-white font-mono"
            />
          </div>
        </div>

        <div className="pt-4 flex gap-4">
          <button
            type="button"
            onClick={() => setPage('landing')}
            className="w-1/3 bg-white border border-slate-200 text-slate-655 hover:bg-slate-50 py-3.5 rounded font-bold text-sm transition-all shadow-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={screenerLoading}
            className="w-2/3 bg-green-600 hover:bg-amber-700 text-white font-bold py-3.5 rounded text-sm shadow-sm transition-all active:scale-[0.98]"
          >
            {screenerLoading ? 'Filtering...' : t.findSchemes}
          </button>
        </div>
      </form>
    </div>
  );
}
