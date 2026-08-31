"use client";
import React, { useState } from 'react';
import { Scheme } from '../data/schemes';
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

interface WhatsAppShareModalProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'hi';
}

export default function WhatsAppShareModal({
  scheme,
  isOpen,
  onClose,
  lang = 'en'
}: WhatsAppShareModalProps) {
  const [phone, setPhone] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen || !scheme) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const handleSendViaN8N = async (e: React.FormEvent) => {
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
          scheme,
          language: lang
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsSuccess(true);
        setStatusMessage(
          lang === 'hi'
            ? 'योजना की जानकारी आपके व्हाट्सएप नंबर पर भेज दी गई है!'
            : 'Scheme information sent to your WhatsApp number via n8n Bot!'
        );
      } else {
        setErrorMessage(data.error || (lang === 'hi' ? 'व्हाट्सएप पर भेजने में विफल।' : 'Failed to send WhatsApp message.'));
      }
    } catch (err: any) {
      setErrorMessage(lang === 'hi' ? 'सर्वर से कनेक्ट करने में विफल।' : 'Could not connect to server.');
    } finally {
      setIsSending(false);
    }
  };

  const handleDirectWhatsAppWeb = () => {
    const shareMessage = `🏛️ *${scheme.name}*\n\n📝 *${
      lang === 'hi' ? 'योजना विवरण:' : 'Scheme Overview:'
    }*\n${scheme.overview}\n\n🎁 *${
      lang === 'hi' ? 'मुख्य लाभ:' : 'Key Benefits:'
    }*\n${scheme.benefits.slice(0, 3).map(b => '• ' + b).join('\n')}\n\n📄 *${
      lang === 'hi' ? 'आवश्यक दस्तावेज़:' : 'Required Documents:'
    }*\n${scheme.documents.slice(0, 4).map(d => '• ' + d).join('\n')}\n\n🌐 *${
      lang === 'hi' ? 'आवेदन पोर्टल:' : 'Official Portal:'
    }* ${scheme.portalUrl || 'https://www.india.gov.in'}\n📞 *${
      lang === 'hi' ? 'हेल्पलाइन:' : 'Helpline:'
    }* ${scheme.helpline || '1800-111-999'}\n\n🇮🇳 _नागरिक साथी (NagarikSaathi) - सरकारी योजना सहायता सेवा_`;

    const targetUrl = phone 
      ? `https://api.whatsapp.com/send?phone=91${phone.replace(/\D/g, '')}&text=${encodeURIComponent(shareMessage)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`;

    window.open(targetUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-emerald-100 max-w-md w-full overflow-hidden flex flex-col transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white p-5 relative">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all"
          >
            <X size={16} />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <Share2 size={16} className="text-emerald-200" />
            <span className="text-xs font-black uppercase tracking-wider text-emerald-100">
              {lang === 'hi' ? 'व्हाट्सएप पर शेयर करें' : 'Share on WhatsApp'}
            </span>
          </div>

          <h3 className="text-lg font-black leading-snug">
            {scheme.name}
          </h3>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4">
          {isSuccess ? (
            <div className="text-center py-4 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={32} className="stroke-[2.5]" />
              </div>
              <h4 className="text-lg font-bold text-gray-900">
                {lang === 'hi' ? 'सफलतापूर्वक भेजा गया!' : 'Successfully Dispatched!'}
              </h4>
              <p className="text-xs text-gray-600 font-medium">
                {statusMessage}
              </p>
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all"
                >
                  {lang === 'hi' ? 'बंद करें' : 'Close'}
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSendViaN8N} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {lang === 'hi' ? 'व्हाट्सएप मोबाइल नंबर दर्ज करें' : 'Enter WhatsApp Mobile Number'}
                </label>
                <div className="flex">
                  <span className="bg-emerald-100 text-emerald-800 px-3 py-2.5 rounded-l-xl border border-r-0 border-emerald-300 font-bold text-xs flex items-center">
                    +91
                  </span>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="9876543210"
                    className="w-full px-3.5 py-2.5 rounded-r-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-900 bg-white"
                  />
                </div>
                <p className="text-[11px] text-gray-500 mt-1">
                  {lang === 'hi'
                    ? 'n8n ऑटोमेशन बॉट द्वारा योजना की पूरी जानकारी सीधे इस नंबर पर भेजी जाएगी।'
                    : 'The n8n automation bot will deliver full scheme details directly to this number.'}
                </p>
              </div>

              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="space-y-2 pt-1">
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
                      ? (lang === 'hi' ? 'व्हाट्सएप पर भेजा जा रहा है...' : 'Sending via n8n Bot...')
                      : (lang === 'hi' ? 'व्हाट्सएप बॉट से भेजें' : 'Send via n8n WhatsApp Bot')}
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
                  className="w-full bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <MessageSquare size={14} />
                  <span>{lang === 'hi' ? 'व्हाट्सएप वेब में सीधे खोलें' : 'Open in WhatsApp Web Directly'}</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}
