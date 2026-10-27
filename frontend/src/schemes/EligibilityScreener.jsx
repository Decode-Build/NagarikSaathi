import React from 'react';
import { useNavigate } from 'react-router-dom';
import { INDIAN_STATES, OCCUPATIONS } from '../utils/constants.js';
import { useLanguage } from '../i18n/LanguageContext';
import { SlidersHorizontal, Check, ArrowRight, Sparkles, ShieldCheck, UserCheck } from 'lucide-react';

export default function EligibilityScreener({ profile, setProfile, handleRunScreener, screenerLoading }) {
  const { t, lang: langMode } = useLanguage();
  const navigate = useNavigate();

  // Quick citizen persona presets for instant 1-click intake
  const applyPreset = (preset) => {
    setProfile(prev => ({ ...prev, ...preset }));
  };

  return (
    <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 sm:p-8 animate-fade-in no-print space-y-6">
      {/* Official DPI Portal Header Banner */}
      <div className="border-b border-slate-200 pb-6 space-y-2">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold tracking-wide uppercase font-mono">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>National DBT Welfare Screener · Direct Benefit Transfer</span>
          </div>
          <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
            DBT-NPCI Engine
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          {t.eligibilityTitle}
        </h2>
        <p className="text-sm text-slate-600">
          {langMode === 'hi' 
            ? 'अपनी प्रोफ़ाइल जानकारी भरें या नीचे दिए गए त्वरित विकल्प चुनें ताकि पात्र केंद्रीय और राज्य योजनाओं की सूची तुरंत मिल सके।'
            : 'Fill in beneficiary parameters or pick a 1-click citizen profile to instantly match against 1,050+ Central & State schemes.'}
        </p>
      </div>

      {/* 1-Click Demographic Persona Selectors */}
      <div className="space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
          <UserCheck className="w-4 h-4 text-blue-600" />
          <span>{langMode === 'hi' ? 'त्वरित नागरिक प्रोफाइल चुनें (1-क्लिक ऑटो-फिल)' : '1-Click Citizen Profile Quick-Fill'}</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
          <button
            type="button"
            onClick={() => applyPreset({ state: 'Madhya Pradesh', occupation: 'Farmer', landAcres: 1.5, annualIncome: 90000, casteCategory: 'OBC', gender: 'Male', maritalStatus: 'Married' })}
            className="p-2.5 bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 rounded-lg text-left transition-all text-xs group cursor-pointer"
          >
            <div className="font-bold text-slate-800 group-hover:text-emerald-800">🌾 {langMode === 'hi' ? 'लघु किसान' : 'Small Farmer'}</div>
            <div className="text-[10px] text-slate-500">1.5 Acres · OBC · MP</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ state: 'Uttar Pradesh', occupation: 'Unemployed', landAcres: 0, annualIncome: 60000, casteCategory: 'General', gender: 'Female', maritalStatus: 'Married' })}
            className="p-2.5 bg-white border border-slate-200 hover:border-rose-500 hover:bg-rose-50/50 rounded-lg text-left transition-all text-xs group cursor-pointer"
          >
            <div className="font-bold text-slate-800 group-hover:text-rose-800">👩‍👧 {langMode === 'hi' ? 'ग्रामीण महिला' : 'Rural Woman'}</div>
            <div className="text-[10px] text-slate-500">PMMVY · Ujjwala</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ state: 'Bihar', occupation: 'Student', landAcres: 0, annualIncome: 120000, casteCategory: 'SC', gender: 'Male', maritalStatus: 'Single' })}
            className="p-2.5 bg-white border border-slate-200 hover:border-blue-500 hover:bg-blue-50/50 rounded-lg text-left transition-all text-xs group cursor-pointer"
          >
            <div className="font-bold text-slate-800 group-hover:text-blue-800">🎓 {langMode === 'hi' ? 'विद्यार्थी / छात्र' : 'Student / Youth'}</div>
            <div className="text-[10px] text-slate-500">Scholarship · SC</div>
          </button>
          <button
            type="button"
            onClick={() => applyPreset({ state: 'Rajasthan', occupation: 'Artisan', landAcres: 0, annualIncome: 100000, casteCategory: 'OBC', gender: 'Male', maritalStatus: 'Married' })}
            className="p-2.5 bg-white border border-slate-200 hover:border-amber-500 hover:bg-amber-50/50 rounded-lg text-left transition-all text-xs group cursor-pointer"
          >
            <div className="font-bold text-slate-800 group-hover:text-amber-800">🔨 {langMode === 'hi' ? 'कारीगर / श्रमिक' : 'Artisan / Worker'}</div>
            <div className="text-[10px] text-slate-500">PM Vishwakarma</div>
          </button>
        </div>
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              {langMode === 'hi' ? 'सामाजिक वर्ग (Category)' : 'Social Category'}
            </label>
            <select
              value={profile.casteCategory || 'General'}
              onChange={(e) => setProfile({...profile, casteCategory: e.target.value})}
              className="w-full bg-slate-50 border border-slate-200 rounded px-4 py-3 text-sm text-slate-800 focus:outline-none focus:border-amber-650 focus:bg-white transition-colors"
            >
              <option value="General">General (सामान्य)</option>
              <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
              <option value="SC">SC (अनुसूचित जाति)</option>
              <option value="ST">ST (अनुसूचित जनजाति)</option>
              <option value="EWS">EWS (आर्थिक रूप से कमजोर)</option>
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
            onClick={() => navigate('/')}
            className="w-1/3 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 py-3.5 rounded-xl font-bold text-sm transition-all shadow-xs cursor-pointer"
          >
            {langMode === 'hi' ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="submit"
            disabled={screenerLoading}
            className="w-2/3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold py-3.5 rounded-xl text-sm shadow-md shadow-blue-900/20 transition-all active:scale-[0.98] cursor-pointer"
          >
            {screenerLoading ? (langMode === 'hi' ? 'पात्रता जांची जा रही है...' : 'Filtering Schemes...') : t.findSchemes}
          </button>
        </div>
      </form>
    </div>
  );
}
