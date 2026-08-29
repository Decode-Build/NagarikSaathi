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
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl border border-orange-100/80 overflow-hidden transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
      <div className="p-6">
        {/* Header Badges */}
        <div className="flex justify-between items-start gap-2 mb-3">
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-sm">
            <CheckCircle2 size={12} className="mr-1.5" />
            {lang === 'hi' ? 'पात्रता मेल' : 'Eligible Match'}
          </span>
          
          <div className="flex items-center gap-1.5">
            {/* Audio Readout Button */}
            <button
              onClick={handleToggleAudio}
              className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-semibold transition-all ${
                isCurrentCardSpeaking
                  ? 'bg-red-500 text-white animate-pulse shadow-md'
                  : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
              }`}
              title={isCurrentCardSpeaking ? "Stop Audio Readout" : "Listen in Hindi/English"}
            >
              {isCurrentCardSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
              <span>{isCurrentCardSpeaking ? (lang === 'hi' ? 'रोकें' : 'Stop') : (lang === 'hi' ? 'सुनें' : 'Listen')}</span>
            </button>

            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              className="p-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-full transition-colors"
              title="Share on WhatsApp"
            >
              <Share2 size={15} />
            </button>
          </div>
        </div>

        {/* Scheme Title */}
        <h3 className="text-xl font-extrabold text-gray-900 mb-2 leading-snug hover:text-orange-600 transition-colors">
          {scheme.name}
        </h3>

        {/* Overview */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3 leading-relaxed">
          {scheme.overview}
        </p>

        {/* Benefits Section */}
        <div className="bg-orange-50/50 rounded-xl p-3.5 mb-4 border border-orange-100">
          <h4 className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-2 flex items-center">
            <FileText size={14} className="mr-1.5 text-orange-600" />
            {lang === 'hi' ? 'योजना के मुख्य लाभ' : 'Key Benefits'}
          </h4>
          <ul className="text-xs text-gray-700 space-y-1.5 pl-1">
            {scheme.benefits.slice(0, 3).map((benefit, index) => (
              <li key={index} className="flex items-start gap-1.5">
                <span className="text-orange-500 font-bold shrink-0">•</span>
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Documents Required */}
        {scheme.documents && scheme.documents.length > 0 && (
          <div className="mb-4">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block mb-1.5">
              {lang === 'hi' ? 'आवश्यक दस्तावेज़' : 'Required Documents'}
            </span>
            <div className="flex flex-wrap gap-1.5">
              {scheme.documents.slice(0, 4).map((doc, idx) => (
                <span key={idx} className="bg-gray-100 text-gray-700 text-[11px] px-2 py-0.5 rounded-md font-medium">
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Helpline */}
        {scheme.helpline && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2 font-medium">
            <Phone size={13} className="text-orange-500" />
            <span>{lang === 'hi' ? 'हेल्पलाइन:' : 'Helpline:'} {scheme.helpline}</span>
          </div>
        )}
      </div>

      {/* Action Buttons Footer */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2.5">
        <button 
          onClick={() => onPrint(scheme)}
          className="flex-1 bg-white text-gray-800 border border-gray-200 py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center hover:bg-orange-50 hover:text-orange-700 hover:border-orange-200 transition-all shadow-sm"
        >
          <Printer size={15} className="mr-1.5 text-orange-600" />
          {lang === 'hi' ? 'हैंडआउट प्रिंट करें' : 'Print Handout'}
        </button>
        <a 
          href={scheme.portalUrl} 
          target="_blank" 
          rel="noreferrer"
          className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-3 rounded-xl font-semibold text-xs flex items-center justify-center hover:from-orange-700 hover:to-red-700 transition-all shadow-md transform active:scale-95"
        >
          {lang === 'hi' ? 'आवेदन करें' : 'Apply Online'}
          <ExternalLink size={14} className="ml-1.5" />
        </a>
      </div>
    </div>
  );
}
