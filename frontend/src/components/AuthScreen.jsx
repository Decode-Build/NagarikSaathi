import React from 'react';
import { Sparkles, CheckCircle2, ShieldCheck, HelpCircle } from 'lucide-react';
import { INDIAN_STATES, OCCUPATIONS } from '../utils/constants.js';

export default function AuthScreen({ 
  page, setPage, t, langMode, authForm, setAuthForm, authError, 
  handleLogin, handleRegister, handleGuestLogin,
  showOtpModal, setShowOtpModal, otpValue, setOtpValue, handleVerifyOtp
}) {
  const isLogin = page === 'login';

  return (
    <>
    <div className="max-w-5xl mx-auto my-6 bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden grid md:grid-cols-12 no-print min-h-[580px]">
      
      {/* Left Column: Branding Pane */}
      <div className="md:col-span-5 bg-slate-900 text-white p-8 sm:p-12 flex flex-col justify-between relative overflow-hidden">
        {/* Subtle orange-green glows inside the dark pane */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[50%] rounded-full bg-amber-500/10 blur-[60px] pointer-events-none" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] rounded-full bg-emerald-500/10 blur-[60px] pointer-events-none" />

        <div className="space-y-8 z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center shadow-md">
              <Sparkles className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white font-display">Nagarik<span className="text-amber-400">Saathi</span></span>
              <span className="text-[10px] block text-slate-400 font-mono tracking-widest uppercase font-semibold">Government Discovery Portal</span>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="text-3xl font-extrabold tracking-tight leading-tight">
              AI-Powered Scheme Discovery <br />
              <span className="text-amber-400">For Rural Communities</span>
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-medium">
              Find, screen, and apply for central and state government benefits in local Indian languages. Built to empower citizens and local VLE operators.
            </p>
          </div>

          {/* Feature Bullets */}
          <ul className="space-y-4 text-xs font-semibold text-slate-200 pt-2">
            <li className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-amber-400 flex-shrink-0" />
              <span>Smart RAG Vector Search & Embeddings</span>
            </li>
            <li className="flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <span>Verified Scheme Data & Dynamic Checklists</span>
            </li>
            <li className="flex items-center gap-3">
              <HelpCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <span>Bilingual Hindi & English Audio Support</span>
            </li>
          </ul>
        </div>

        <div className="pt-8 z-10 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
          An initiative for Digital Empowerment · 🇮🇳
        </div>
      </div>

      {/* Right Column: Interactive Form */}
      <div className="md:col-span-7 p-8 sm:p-12 flex flex-col justify-center bg-white">
        {isLogin ? (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">{t[langMode].loginTitle}</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{t[langMode].loginDesc}</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Username / उपयोगकर्ता नाम</label>
                <input
                  type="text"
                  required
                  placeholder="Enter username"
                  value={authForm.username}
                  onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-650 focus:bg-white transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Password / पासवर्ड</label>
                <input
                  type="password"
                  required
                  placeholder="Enter password"
                  value={authForm.password}
                  onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-650 focus:bg-white transition-colors"
                />
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-750 rounded-xl text-xs font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                {t[langMode].loginBtn}
              </button>

              <button
                type="button"
                onClick={handleGuestLogin}
                className="w-full py-3 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200/85 rounded-xl text-sm font-bold shadow-sm transition-colors flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Try Demo Mode (One-Click Guest) / अतिथि लॉगिन</span>
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-550">{t[langMode].needAccount} </span>
              <button 
                type="button"
                onClick={() => setPage('register')}
                className="text-xs text-amber-655 hover:underline font-bold"
              >
                Register here / पंजीकरण करें &rarr;
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 font-display">{t[langMode].registerTitle}</h2>
              <p className="text-xs text-slate-500 mt-1 font-semibold">{t[langMode].registerDesc}</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                
                {/* Credentials */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Username / उपयोगकर्ता नाम</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter desired username"
                    value={authForm.username}
                    onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Password / पासवर्ड</label>
                  <input
                    type="password"
                    required
                    placeholder="Enter secure password"
                    value={authForm.password}
                    onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Phone Number / फोन नंबर</label>
                  <input
                    type="tel"
                    required
                    pattern="[0-9]{10}"
                    placeholder="10-digit mobile number"
                    value={authForm.phone}
                    onChange={(e) => setAuthForm({...authForm, phone: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  />
                </div>

                {/* Profile parameters */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Age / आयु (वर्ष)</label>
                  <input
                    type="number"
                    required
                    value={authForm.age}
                    onChange={(e) => setAuthForm({...authForm, age: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">State / राज्य</label>
                  <select
                    value={authForm.state}
                    onChange={(e) => setAuthForm({...authForm, state: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  >
                    {INDIAN_STATES.map((st, idx) => (
                      <option key={idx} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Occupation / व्यवसाय</label>
                  <select
                    value={authForm.occupation}
                    onChange={(e) => setAuthForm({...authForm, occupation: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  >
                    {OCCUPATIONS.map((occ, idx) => (
                      <option key={idx} value={occ}>{occ}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Gender / लिंग</label>
                  <select
                    value={authForm.gender}
                    onChange={(e) => setAuthForm({...authForm, gender: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  >
                    <option value="Male">Male / पुरुष</option>
                    <option value="Female">Female / महिला</option>
                  </select>
                </div>

                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block uppercase tracking-wider">Marital Status / वैवाहिक स्थिति</label>
                  <select
                    value={authForm.maritalStatus}
                    onChange={(e) => setAuthForm({...authForm, maritalStatus: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-900 focus:outline-none focus:border-amber-655 focus:bg-white transition-colors"
                  >
                    <option value="Single">Single / एकल</option>
                    <option value="Married">Married / विवाहित</option>
                    <option value="Widowed">Widowed / विधवा</option>
                  </select>
                </div>
              </div>

              {authError && (
                <div className="p-3 bg-red-50 border border-red-150 text-red-755 rounded-xl text-xs font-semibold">
                  {authError}
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                {t[langMode].registerBtn}
              </button>
            </form>

            <div className="pt-2 text-center">
              <span className="text-xs text-slate-550">{t[langMode].haveAccount} </span>
              <button 
                type="button"
                onClick={() => setPage('login')}
                className="text-xs text-amber-655 hover:underline font-bold"
              >
                Sign In here / लॉगिन करें &rarr;
              </button>
            </div>
          </div>
        )}
      </div>

    </div>

      {/* OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="w-full max-w-sm p-6 bg-white border border-slate-200 rounded-2xl shadow-xl space-y-4">
            <h3 className="text-xl font-bold text-slate-900 text-center">Verify Phone / फोन सत्यापित करें</h3>
            <p className="text-sm text-slate-500 text-center">
              Enter the 6-digit OTP sent to your phone number. (Check server console for mock OTP)
            </p>
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                required
                maxLength="6"
                placeholder="000000"
                value={otpValue}
                onChange={(e) => setOtpValue(e.target.value)}
                className="w-full text-center tracking-[0.5em] text-2xl font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 focus:outline-none focus:border-amber-655 transition-colors"
              />
              {authError && <div className="text-xs text-red-600 text-center font-semibold">{authError}</div>}
              <button
                type="submit"
                className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-sm font-bold shadow-sm transition-colors"
              >
                Verify & Login
              </button>
              <button
                type="button"
                onClick={() => setShowOtpModal(false)}
                className="w-full py-2 text-slate-500 text-sm font-semibold hover:text-slate-700"
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
