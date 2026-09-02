import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Target, Search, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_URL 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api');
export default function TrackingScreen() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [trackingId, setTrackingId] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId.trim()) return;
    
    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.get(`${API_BASE}/integrations/applications/track/${trackingId.trim()}`);
      setStatus(res.data.data);
    } catch (err) {
      console.error(err);
      setStatus({ error: true, message: err.response?.data?.error || 'Failed to fetch application tracking data.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="border-b border-slate-200 pb-4 text-center">
        <Target className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
          {t.trackApplication || 'Track Application Status'}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {t.trackAppDesc || 'Enter your Application Reference ID to check the real-time status of your scheme application.'}
        </p>
      </div>

      <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm">
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder={t.enterTrackingId || "Enter Application Reference ID (e.g. APP-12345)"}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 font-mono"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !trackingId.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-3 px-8 rounded-lg shadow-sm transition-colors whitespace-nowrap"
          >
            {loading ? (t.processing || 'Processing...') : (t.trackBtn || 'Track Status')}
          </button>
        </form>
      </div>

      {status && !status.error && (
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-8 animate-fade-in-up">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.appRefId || 'App Ref ID'}</span>
              <p className="text-lg font-bold text-slate-900 font-mono">{status.id}</p>
            </div>
            <div className="text-left md:text-right">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{t.schemeName || 'Scheme'}</span>
              <p className="text-lg font-bold text-blue-700">{status.scheme}</p>
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200"></div>
            <div className="space-y-6">
              {status.timeline.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-6">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center relative z-10 flex-shrink-0 border-2 ${step.completed ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-slate-300 text-slate-300'}`}>
                    {step.completed ? <CheckCircle2 className="w-5 h-5" /> : <Clock className="w-4 h-4" />}
                  </div>
                  <div className={`pt-1 ${!step.completed && idx > 0 && status.timeline[idx-1].completed ? 'animate-pulse' : ''}`}>
                    <h4 className={`font-bold text-lg ${step.completed ? 'text-slate-900' : (idx > 0 && status.timeline[idx-1].completed ? 'text-blue-600' : 'text-slate-400')}`}>
                      {lang === 'hi' ? step.labelHi : step.labelEn}
                    </h4>
                    {step.date && (
                      <p className="text-sm text-slate-500 font-mono mt-1">{new Date(step.date).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {status && status.error && (
        <div className="bg-red-50 p-6 rounded-xl border border-red-200 flex items-start gap-4 text-red-800 animate-fade-in-up">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-lg">{t.invalidAppId || 'Invalid Application ID'}</h4>
            <p className="text-sm mt-1">{t.invalidAppIdDesc || 'We could not find any records for this application ID. Please check the ID and try again.'}</p>
          </div>
        </div>
      )}

      <div className="text-center pt-4">
        <button
          onClick={() => navigate('/')}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-6 py-3 rounded font-bold text-sm transition-all shadow-xs"
        >
          &larr; {t.backToPortalHome || 'Back to Portal Home'}
        </button>
      </div>
    </div>
  );
}
