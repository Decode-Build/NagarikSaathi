"use client";
import React from 'react';
import { Scheme } from '../data/schemes';
import { FileText, Printer, ExternalLink, Volume2, VolumeX, Share2, CheckCircle2, Phone } from 'lucide-react';
import { useTextToSpeech } from '../hooks/useTextToSpeech';

interface SchemeCardProps {
  scheme: Scheme;
  onPrint: (scheme: Scheme) => void;
  lang?: 'en' | 'hi';
}

export default function SchemeCard({ scheme, onPrint, lang = 'en' }: SchemeCardProps) {
  const { speak, stop, isPlaying, currentText } = useTextToSpeech();
  
  const cardSpeechText = `${scheme.name}. ${scheme.overview}. ${
    lang === 'hi' ? 'मुख्य लाभ:' : 'Key Benefits:'
  } ${scheme.benefits.join('. ')}. ${
    lang === 'hi' ? 'आवश्यक दस्तावेज़:' : 'Required documents:'
  } ${scheme.documents.join(', ')}.`;

  const isCurrentCardSpeaking = isPlaying && currentText === cardSpeechText;

  const handleToggleAudio = () => {
    if (isCurrentCardSpeaking) {
      stop();
    } else {
      speak(cardSpeechText, lang);
    }
  };

  const handleShareWhatsApp = () => {
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

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(shareMessage)}`, '_blank');
  };

  return (
    <div className="bg-white rounded-3xl shadow-md hover:shadow-2xl border border-orange-100/60 overflow-hidden transition-all duration-300 transform hover:-translate-y-1.5 hover:ring-4 hover:ring-orange-500/5 flex flex-col justify-between">
      <div className="p-6">
        {/* Header Badges */}
        <div className="flex justify-between items-center gap-2 mb-4">
          <span className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600 text-white text-[11px] font-bold px-3 py-1 rounded-full flex items-center shadow-sm">
            <CheckCircle2 size={12} className="mr-1.5 stroke-[2.5]" />
            {lang === 'hi' ? 'पात्रता मेल' : 'Eligible Match'}
          </span>
          
          <div className="flex items-center gap-1.5">
            {/* Audio Readout Button */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-full font-bold transition-all cursor-pointer shadow-sm ${
                isCurrentCardSpeaking
                  ? 'bg-red-500 text-white animate-pulse-glow scale-105'
                  : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
              }`}
              title={isCurrentCardSpeaking ? "Stop Audio Readout" : "Listen in Hindi/English"}
            >
              {isCurrentCardSpeaking ? (
                <div className="flex gap-0.5 items-center mr-0.5">
                  <span className="w-0.5 h-2.5 bg-white rounded-full animate-wave" style={{ animationDelay: '0.1s' }} />
                  <span className="w-0.5 h-3 bg-white rounded-full animate-wave" style={{ animationDelay: '0.3s' }} />
                  <span className="w-0.5 h-2 bg-white rounded-full animate-wave" style={{ animationDelay: '0.2s' }} />
                </div>
              ) : (
                <Volume2 size={13} className="stroke-[2.5]" />
              )}
              <span>{isCurrentCardSpeaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'सुनें' : 'Listen')}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="p-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full transition-all cursor-pointer hover:scale-105"
              title="Share on WhatsApp"
            >
              <Share2 size={14} className="stroke-[2.5]" />
            </button>
          </div>
        </div>
 
        {/* Scheme Title */}
        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-2 leading-snug hover:text-orange-600 transition-colors">
          {scheme.name}
        </h3>

        {/* Overview */}
        <p className="text-gray-500 text-[13px] md:text-[14px] mb-4.5 line-clamp-3 leading-relaxed font-medium">
          {scheme.overview}
        </p>

        {/* Benefits Section */}
        <div className="bg-orange-50/30 rounded-2xl p-4.5 mb-4.5 border border-orange-100/50">
          <h4 className="text-[10px] font-extrabold text-orange-800 uppercase tracking-widest mb-2.5 flex items-center">
            <FileText size={13} className="mr-1.5 text-orange-600 stroke-[2.5]" />
            {lang === 'hi' ? 'योजना के मुख्य लाभ' : 'Key Benefits'}
          </h4>
          <ul className="text-xs text-gray-700 space-y-2.5 pl-0.5">
            {scheme.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-start gap-2.5">
                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0 stroke-[2.5]" />
                <span className="font-medium text-gray-700 leading-normal">{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Documents Required */}
        {scheme.documents && scheme.documents.length > 0 && (
          <div className="mb-4.5">
            <span className="text-[10px] font-extrabold text-gray-400 uppercase tracking-widest block mb-2">
              {lang === 'hi' ? 'आवश्यक दस्तावेज़' : 'Required Documents'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scheme.documents.slice(0, 4).map((doc, idx) => (
                <span key={idx} className="bg-gray-50 hover:bg-orange-50 hover:text-orange-700 hover:border-orange-100 text-gray-600 border border-gray-100 text-[11px] px-2.5 py-1 rounded-lg font-bold transition-colors">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Helpline */}
        {scheme.helpline && (
          <div className="inline-flex items-center gap-2 bg-orange-50/50 text-orange-950 px-3.5 py-1.5 rounded-full border border-orange-100/50 text-[11px] font-bold shadow-sm">
            <Phone size={12} className="text-orange-600 stroke-[2.5]" />
            <span>{lang === 'hi' ? 'हेल्पलाइन:' : 'Helpline:'} {scheme.helpline}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 bg-slate-50 border-t border-gray-100/70 flex gap-2.5">
        <button 
          onClick={() => onPrint(scheme)}
          className="flex-1 bg-white text-gray-700 border border-gray-200 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all shadow-sm cursor-pointer"
        >
          <Printer size={14} className="mr-1.5 text-orange-500 stroke-[2.5]" />
          {lang === 'hi' ? 'प्रिंट करें' : 'Print Handout'}
        </button>
        <a 
          href={scheme.portalUrl} 
          target="_blank" 
          rel="noreferrer"
          className="flex-1 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 text-white py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center hover:from-orange-600 hover:to-amber-600 transition-all shadow-md hover:shadow-lg transform active:scale-95 cursor-pointer text-center"
        >
          {lang === 'hi' ? 'आवेदन करें' : 'Apply Online'}
          <ExternalLink size={13} className="ml-1.5 stroke-[2.5]" />
        </a>
      </div>
    </div>
  );
}
