import React, { useState, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Target, Search, Clock, CheckCircle2, AlertCircle, XCircle, User, Phone, Check, RefreshCw } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_URL 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api');

export default function TrackingScreen() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [trackingId, setTrackingId] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  // Auto-track if query param exists (?id=NS-APP-...)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlId = params.get('id');
    if (urlId) {
      setTrackingId(urlId);
      performTracking(urlId);
    }
  }, [location.search]);

  const performTracking = async (queryToTrack) => {
    const cleanQuery = (queryToTrack || '').trim();
    if (!cleanQuery) return;

    setLoading(true);
    setStatus(null);
    try {
      const res = await axios.get(`${API_BASE}/integrations/applications/track/${encodeURIComponent(cleanQuery)}`);
      setStatus(res.data.data);
    } catch (err) {
      console.error(err);
      setStatus({ 
        error: true, 
        message: err.response?.data?.error || (lang === 'hi' 
          ? 'इस आईडी या फ़ोन नंबर के लिए कोई आवेदन नहीं मिला।' 
          : 'No application record found for this ID or Phone Number.') 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrack = (e) => {
    if (e) e.preventDefault();
    performTracking(trackingId);
  };

  const getStatusBanner = (currentStage, remarks) => {
    switch (currentStage) {
      case 'PROCESSED':
        return (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {lang === 'hi' ? '🎉 योजना लाभ स्वीकृत एवं वितरित!' : '🎉 Scheme Application Approved & Disbursed!'}
              </p>
              <p className="text-xs text-emerald-700 mt-0.5">
                {remarks || (lang === 'hi' 
                  ? 'आपके आवेदन की सभी प्रक्रिया पूर्ण हो चुकी है और लाभ सीधे बैंक खाते में प्रेषित कर दिया गया है।' 
                  : 'All verifications are complete and benefit disbursal has been initiated.')}
              </p>
            </div>
          </div>
        );
      case 'VERIFIED':
        return (
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3">
            <Check className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {lang === 'hi' ? '📋 दस्तावेज़ सत्यापन पूर्ण' : '📋 Document Verification Completed'}
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                {remarks || (lang === 'hi' 
                  ? 'सीएससी ऑपरेटर द्वारा आपके दस्तावेज़ सफलतापूर्वक सत्यापित कर लिए गए हैं। अंतिम विभागीय स्वीकृति जारी है।' 
                  : 'Your documents have been verified by the CSC Operator. Awaiting final department approval.')}
              </p>
            </div>
          </div>
        );
      case 'REJECTED':
        return (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-900 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {lang === 'hi' ? '❌ आवेदन अस्वीकृत (Rejected)' : '❌ Application Rejected'}
              </p>
              <p className="text-xs text-red-700 mt-0.5">
                {remarks || (lang === 'hi' 
                  ? 'दस्तावेज़ विसंगति के कारण आवेदन अस्वीकृत कर दिया गया है। कृपया अपने निकटतम सीएससी केंद्र पर संपर्क करें।' 
                  : 'Application was not approved. Please visit your nearest CSC Center for re-application.')}
              </p>
            </div>
          </div>
        );
      case 'SUBMITTED':
      default:
        return (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 flex items-start gap-3">
            <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-bold text-sm">
                {lang === 'hi' ? '⏳ आवेदन समीक्षाधीन (Under Review)' : '⏳ Application Under Review'}
              </p>
              <p className="text-xs text-blue-700 mt-0.5">
                {remarks || (lang === 'hi' 
                  ? 'आवेदन सफलतापूर्वक प्राप्त हो चुका है। सीएससी ऑपरेटर द्वारा दस्तावेज़ सत्यापन प्रक्रिया शुरू हो गई है।' 
                  : 'Application received and queued for CSC Operator document verification.')}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-fade-in p-4 sm:p-6">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-4 text-center">
        <Target className="w-12 h-12 text-green-700 mx-auto mb-3" />
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
          {t.trackApplication || 'Live Application Tracker'}
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-lg mx-auto">
          {lang === 'hi' 
            ? 'अपनी आवेदन संदर्भ आईडी (NS-APP-...) या 10-अंकीय मोबाइल नंबर दर्ज करके लाइव स्थिति देखें।' 
            : 'Enter your Application Reference ID (e.g. NS-APP-...) or 10-digit mobile number to track real-time progress.'}
        </p>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              value={trackingId}
              onChange={(e) => setTrackingId(e.target.value)}
              placeholder={lang === 'hi' ? "आवेदन आईडी या फ़ोन नंबर (उदा. NS-APP-... या 9876543210)" : "Enter Application ID or 10-digit Phone..."}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-green-600 focus:ring-1 focus:ring-amber-600 font-mono text-sm"
              required
            />
          </div>
          <button 
            type="submit"
            disabled={loading || !trackingId.trim()}
            className="bg-green-700 hover:bg-green-800 disabled:opacity-50 text-white font-bold py-3.5 px-8 rounded-xl shadow-sm transition-all whitespace-nowrap text-sm cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : null}
            <span>{loading ? (t.processing || 'Tracking...') : (t.trackBtn || 'Track Status')}</span>
          </button>
        </form>
      </div>

      {/* Tracking Result Card */}
      {status && !status.error && (
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-6 animate-fade-in-up">
          
          {/* Top Info Bar */}
          <div className="grid sm:grid-cols-2 gap-4 pb-6 border-b border-slate-100">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t.appRefId || 'Application ID'}</span>
              <p className="text-lg font-extrabold text-amber-700 font-mono">{status.id || status.applicationId}</p>
              
              {status.applicantName && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mt-1 font-semibold">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span>{status.applicantName}</span>
                </div>
              )}
            </div>

            <div className="sm:text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">{t.schemeName || 'Scheme'}</span>
              <p className="text-base font-bold text-slate-900">{status.scheme}</p>
              
              {status.phone && (
                <div className="flex items-center sm:justify-end gap-1.5 text-xs text-slate-500 mt-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>+91 {status.phone}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Alert Banner */}
          {getStatusBanner(status.currentStage, status.remarks)}

          {/* Timeline Visualizer */}
          <div className="pt-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              {lang === 'hi' ? 'आवेदन प्रगति यात्रा (Timeline)' : 'Application Timeline & Verification Progress'}
            </h3>

            <div className="relative pl-2">
              <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-slate-200" />

              <div className="space-y-8">
                {status.timeline.map((step, idx) => {
                  const isCompleted = step.completed;
                  const isInProgress = step.inProgress;
                  const isError = step.isError;

                  return (
                    <div key={idx} className="relative flex items-start gap-5">
                      
                      {/* Step Node Icon */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center relative z-10 flex-shrink-0 border-2 transition-all ${
                        isError
                          ? 'bg-red-600 border-red-600 text-white shadow-md'
                          : isCompleted
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-md'
                            : isInProgress
                              ? 'bg-amber-500 border-amber-400 text-white animate-pulse shadow-md ring-4 ring-amber-100'
                              : 'bg-white border-slate-300 text-slate-300'
                      }`}>
                        {isError ? (
                          <XCircle className="w-5 h-5" />
                        ) : isCompleted ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : isInProgress ? (
                          <Clock className="w-5 h-5 animate-spin" />
                        ) : (
                          <Clock className="w-4 h-4" />
                        )}
                      </div>

                      {/* Step Details */}
                      <div className="flex-grow pt-0.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className={`font-bold text-sm sm:text-base ${
                            isError 
                              ? 'text-red-700' 
                              : isCompleted 
                                ? 'text-slate-900' 
                                : isInProgress 
                                  ? 'text-amber-700' 
                                  : 'text-slate-400'
                          }`}>
                            {lang === 'hi' ? step.labelHi : step.labelEn}
                          </h4>

                          {step.date && (
                            <span className="text-xs text-slate-500 font-mono">
                              {new Date(step.date).toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </span>
                          )}
                        </div>

                        <p className={`text-xs mt-1 leading-relaxed ${
                          isError 
                            ? 'text-red-600 font-semibold' 
                            : isCompleted 
                              ? 'text-slate-600' 
                              : isInProgress 
                                ? 'text-amber-800 font-medium' 
                                : 'text-slate-400'
                        }`}>
                          {lang === 'hi' ? (step.descriptionHi || '') : (step.descriptionEn || '')}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {status && status.error && (
        <div className="bg-red-50 p-6 rounded-2xl border border-red-200 flex items-start gap-4 text-red-800 animate-fade-in-up">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-red-600" />
          <div>
            <h4 className="font-bold text-base">{t.invalidAppId || 'Application Not Found'}</h4>
            <p className="text-xs mt-1 leading-relaxed">
              {status.message || (t.invalidAppIdDesc || 'We could not find any records for this application ID. Please check the ID and try again.')}
            </p>
          </div>
        </div>
      )}

      {/* Footer Back */}
      <div className="text-center pt-2">
        <button
          onClick={() => navigate('/')}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-xs transition-all shadow-xs"
        >
          &larr; {t.backToPortalHome || 'Back to Portal Home'}
        </button>
      </div>
    </div>
  );
}
