import React, { useState } from 'react';
import { 
  X, 
  Share2, 
  Send, 
  CheckCircle2, 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  ExternalLink 
} from 'lucide-react';

export default function WhatsAppShareModal({
  scheme,
  isOpen,
  onClose,
  lang = 'en'
}) {
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  if (!isOpen || !scheme) return null;

  const API_URL = import.meta.env?.VITE_API_URL 
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api');

  const schemeName = lang === 'hi' ? (scheme.nameHindi || scheme.name) : scheme.name;
  const schemeOverview = lang === 'hi' ? (scheme.descriptionHindi || scheme.description || scheme.overview) : (scheme.description || scheme.overview || '');
  const rawBenefits = scheme.benefitsHindi || scheme.benefits || [];
  const benefitsList = Array.isArray(rawBenefits) ? rawBenefits : [String(rawBenefits)];
  const rawDocs = scheme.documents || [];
  const docsList = Array.isArray(rawDocs) ? rawDocs : [String(rawDocs)];
  const portalUrl = scheme.applicationUrl || scheme.portalUrl || 'https://www.india.gov.in';
  const helpline = scheme.helplineNumber || scheme.helpline || '1800-111-999';

  const handleSendViaN8N = async (e) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage(lang === 'hi' ? 'कृपया 10 अंकों का वैध व्हाट्सएप नंबर दर्ज करें।' : 'Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setIsSending(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_URL}/integrations/whatsapp-share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: cleanPhone,
          scheme: {
            id: scheme.schemeId || scheme.id || scheme._id,
            name: scheme.name,
            nameHindi: scheme.nameHindi,
            overview: schemeOverview,
            description: schemeOverview,
            benefits: benefitsList,
            documents: docsList,
            portalUrl: portalUrl,
            helpline: helpline
          },
          language: lang
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setStatusMessage(
          lang === 'hi'
            ? 'योजना की जानकारी आपके व्हाट्सएप नंबर पर n8n बॉट द्वारा सफलतापूर्वक भेज दी गई है!'
            : 'Scheme information has been sent directly to your WhatsApp number via n8n automation bot!'
        );
      } else {
        setErrorMessage(data.error || (lang === 'hi' ? 'व्हाट्सएप पर भेजने में विफल।' : 'Failed to send WhatsApp message.'));
      }
    } catch (err) {
      setErrorMessage(lang === 'hi' ? 'सर्वर से कनेक्ट करने में विफल।' : 'Could not connect to n8n automation server.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDirectWhatsAppWeb = () => {
    const shareMessage = `🏛️ *${schemeName}*\n\n📝 *${
      lang === 'hi' ? 'योजना विवरण:' : 'Scheme Overview:'
    }*\n${schemeOverview}\n\n🎁 *${
      lang === 'hi' ? 'मुख्य लाभ:' : 'Key Benefits:'
    }*\n${benefitsList.slice(0, 3).map(b => '• ' + b).join('\n')}\n\n📄 *${
      lang === 'hi' ? 'आवश्यक दस्तावेज़:' : 'Required Documents:'
    }*\n${docsList.slice(0, 4).map(d => '• ' + d).join('\n')}\n\n🌐 *${
      lang === 'hi' ? 'आवेदन पोर्टल:' : 'Official Portal:'
    }* ${portalUrl}\n📞 *${
      lang === 'hi' ? 'हेल्पलाइन:' : 'Helpline:'
    }* ${helpline}\n\n🇮🇳 _नागरिक साथी (NagarikSaathi) - सरकारी योजना सहायता सेवा_`;

    const cleanPhone = phone.replace(/\D/g, '');
    const targetUrl = cleanPhone 
      ? `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${encodeURIComponent(shareMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

    window.open(targetUrl, '_blank');
  };

  const handleResetAndClose = () => {
    setIsSuccess(false);
    setErrorMessage(null);
    setStatusMessage(null);
    setPhone('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-emerald-100 max-w-md w-full overflow-hidden flex flex-col transition-all">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 text-white p-5 relative">
          <button 
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/15 hover:bg-black/30 p-2 rounded-full transition-all cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={16} className="text-emerald-200" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              {lang === 'hi' ? 'व्हाट्सएप ऑटोमेशन शेयर (n8n Bot)' : 'WhatsApp Bot Share (n8n Engine)'}
            </span>
          </div>

          <h3 className="text-base sm:text-lg font-extrabold leading-snug">
            {schemeName}
          </h3>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} className="stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                {lang === 'hi' ? 'सफलतापूर्वक भेजा गया!' : 'Successfully Sent via n8n!'}
              </h4>
              <p className="text-xs text-gray-600 font-medium leading-relaxed">
                {statusMessage}
              </p>
              <div className="pt-3">
                <button
                  onClick={handleResetAndClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-sm cursor-pointer"
                >
                  {lang === 'hi' ? 'पूर्ण (बंद करें)' : 'Done (Close)'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendViaN8N} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                  {lang === 'hi' ? 'व्हाट्सएप मोबाइल नंबर दर्ज करें' : 'Enter WhatsApp Mobile Number'}
                </label>
                <div className="flex">
                  <span className="bg-emerald-50 text-emerald-800 px-3.5 py-2.5 rounded-l-xl border border-r-0 border-emerald-300 font-bold text-xs flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    autoFocus
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-900 bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1.5">
                  {lang === 'hi'
                    ? '⚡ n8n ऑटोमेशन बॉट द्वारा योजना की पूरी जानकारी (लाभ, दस्तावेज़, पोर्टल लिंक) सीधे इस नंबर पर भेजी जाएगी।'
                    : '⚡ The n8n automation bot will deliver full scheme details (benefits, documents, portal link) directly to this WhatsApp number.'}
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2.5 pt-1">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-75 text-white font-bold py-3 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  {isSending ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={15} />
                  )}
                  <span>
                    {isSending
                      ? (lang === 'hi' ? 'व्हाट्सएप पर भेजा जा रहा है (n8n Bot)...' : 'Sending via n8n Bot...')
                      : (lang === 'hi' ? 'n8n व्हाट्सएप बॉट से भेजें' : 'Send via n8n WhatsApp Bot')}
                  </span>
                </button>

                <div className="relative flex py-1 items-center">
                  <div className="flex-grow border-t border-gray-200"></div>
                  <span className="flex-shrink mx-2 text-[10px] uppercase font-bold text-gray-400">
                    {lang === 'hi' ? 'या' : 'OR'}
                  </span>
                  <div className="flex-grow border-t border-gray-200"></div>
                </div>

                <button
                  type="button"
                  onClick={handleDirectWhatsAppWeb}
                  className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare size={14} className="text-emerald-600" />
                  <span>{lang === 'hi' ? 'व्हाट्सएप वेब में सीधे खोलें' : 'Open in WhatsApp Web Directly'}</span>
                  <ExternalLink size={12} className="text-slate-400" />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
