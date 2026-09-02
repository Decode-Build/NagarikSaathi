import React, { useState } from 'react';
import { ArrowLeft, Volume2, Printer, AlertTriangle, CreditCard, CheckSquare, Phone, ExternalLink, MessageCircle, FileText, Square } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import ApplicationFormModal from '../documents/ApplicationFormModal';
import WhatsAppShareModal from '../documents/WhatsAppShareModal';

export default function DetailScreen({ 
  selectedScheme, chatSources, handleSpeechOutput, 
  citizenName, setCitizenName, isSchemeStale, formatDate, handleReportScheme,
  isSpeaking, speakingId, stopSpeech 
}) {
  const { t, lang: langMode } = useLanguage();
  const navigate = useNavigate();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* Nav back row (Hidden in Print) */}
      <div className="no-print flex flex-wrap items-center justify-between gap-4 p-6 border-b border-gray-200">
        <button 
          onClick={() => {
            if (chatSources && chatSources.some(s => s.schemeId === selectedScheme.schemeId)) {
              navigate('/chat');
            } else {
              navigate('/schemes');
            }
          }}
          className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> {t.backToList}
        </button>

        <div className="flex gap-2">
          {/* Voice Readout Button */}
          <button
            onClick={() => {
              const textToSpeak = langMode === 'hi' 
                ? (selectedScheme.descriptionHindi || selectedScheme.description || selectedScheme.nameHindi || selectedScheme.name)
                : (selectedScheme.description || selectedScheme.descriptionHindi || selectedScheme.name);
              handleSpeechOutput(textToSpeak, `detail-${selectedScheme.schemeId}`);
            }}
            className={`border px-4 py-2.5 rounded text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors cursor-pointer ${
              isSpeaking && speakingId === `detail-${selectedScheme.schemeId}`
                ? 'bg-red-50 text-red-700 border-red-300 ring-2 ring-red-200'
                : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            aria-label={t.speakBtn}
          >
            {isSpeaking && speakingId === `detail-${selectedScheme.schemeId}` ? (
              <>
                <Square className="w-4 h-4 fill-red-600 text-red-600 animate-pulse" />
                <span>{langMode === 'hi' ? 'रोकें (Stop)' : 'Stop Audio'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-4 h-4 text-green-600" />
                <span>{t.speakBtn || (langMode === 'hi' ? 'विवरण सुनें' : 'Listen')}</span>
              </>
            )}
          </button>

          <button 
            onClick={() => window.print()}
            className="bg-green-600 hover:bg-amber-700 text-white font-bold px-5 py-2.5 rounded text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
            aria-label={t.printBtn}
          >
            <Printer className="w-4 h-4" /> {t.printBtn}
          </button>

          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded text-sm shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" /> Share via WhatsApp
          </button>
        </div>
      </div>

      {/* Print Customizer Card (Hidden in Print) */}
      <div className="no-print p-4 bg-white border border-slate-200 rounded space-y-2 shadow-xs">
        <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">{t.printNotice}</label>
        <input
          type="text"
          placeholder={t.printNamePlaceholder}
          value={citizenName}
          onChange={(e) => setCitizenName(e.target.value)}
          className="w-full md:w-1/2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-900 focus:outline-none focus:border-green-600 focus:bg-white transition-all font-medium"
        />
      </div>

      {/* Printable Container */}
      <div className="bg-white border border-slate-200 rounded p-8 space-y-6 print-container print-card text-slate-800 shadow-sm">
        
        {isSchemeStale(selectedScheme) && (
          <div className="p-4 bg-amber-50 border border-green-600 rounded flex items-start gap-3 text-amber-800 text-sm no-print animate-pulse">
            <AlertTriangle className="w-5 h-5 mt-0.5 flex-shrink-0 text-green-600" />
            <div>
              <strong className="block text-amber-700 font-bold uppercase tracking-wider text-xs">⚠️ Data Staleness Warning / डेटा सत्यापन चेतावनी</strong>
              This scheme data has not been modified or verified for more than 90 days. Please cross-verify rules on the official VLE portal before confirming with the citizen.
            </div>
          </div>
        )}
        
        <div className="border-b border-slate-100 pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-amber-650 uppercase tracking-widest font-mono">{t.appGuide || 'NagarikSaathi Application Guide'}</span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">{langMode === 'hi' ? selectedScheme.nameHindi : selectedScheme.name}</h1>
            <p className="text-xs text-slate-450 font-semibold">{selectedScheme.ministry}</p>
          </div>
          <div className="text-right">
            <span className="print-badge inline-block px-3 py-1 text-xs rounded bg-slate-50 border border-slate-250 font-mono text-slate-600 font-semibold">
              Verified: {formatDate(selectedScheme.lastVerified)}
            </span>
            {citizenName && (
              <div className="mt-2 text-sm text-slate-800 font-medium">
                Citizen Handout for: <strong className="text-amber-750 underline">{citizenName}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Grid content */}
        <div className="grid md:grid-cols-3 gap-8">
          
          <div className="md:col-span-2 space-y-6">
            {/* Summary */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">{t.schemeDetails || 'Scheme Details'}</h3>
              <p className="text-sm text-slate-600 leading-relaxed font-medium">
                {langMode === 'hi' ? selectedScheme.descriptionHindi : selectedScheme.description}
              </p>
            </div>

            {/* Benefits */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-green-600" />
                {t.benefitsProvided || 'Benefits Provided'}
              </h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded">
                <p className="text-sm text-slate-900 font-bold">
                  {langMode === 'hi' ? selectedScheme.benefitsHindi : selectedScheme.benefits}
                </p>
              </div>
            </div>

            {/* Eligibility parameters */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-1.5">{t.eligibilityRules || 'Eligibility Rules'}</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">{t.occLabel || 'Occupation'}</span>
                  <span className="text-slate-800 text-sm font-bold">{selectedScheme.eligibility.occupation.join(', ')}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-150">
                  <span className="text-slate-500 block mb-1 font-semibold uppercase tracking-wider text-[10px]">{t.stateLabel || 'State'}</span>
                  <span className="text-slate-800 text-sm font-bold">{selectedScheme.eligibility.states.join(', ')}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Documents Column */}
          <div className="space-y-6">
            <div className="p-6 bg-slate-50 border border-slate-200 rounded space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-green-600" />
                {t.documentsTitle}
              </h3>
              <p className="text-[10px] text-slate-550 font-semibold">{t.documentsDesc}</p>
              
              <ul className="space-y-3">
                {selectedScheme.documents.map((doc, index) => (
                  <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700 font-semibold">
                    <div className="w-4.5 h-4.5 rounded border border-slate-350 bg-white flex items-center justify-center font-bold text-sm mt-0.5 flex-shrink-0" />
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded space-y-2">
                <div className="flex items-center gap-2 text-slate-700 font-bold">
                  <Phone className="w-4 h-4 text-green-600" />
                  <span>{t.helpline || 'Helpline'}: {selectedScheme.helplineNumber || '14545'}</span>
                </div>
              </div>

              <button
                onClick={() => setIsFormOpen(true)}
                className="no-print w-full py-3.5 rounded bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white transition-all flex items-center justify-center gap-2 font-bold shadow-md cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                {langMode === 'hi' ? 'ऑटो-फिल आवेदन फॉर्म भरें' : 'Auto-Fill Application Form'}
              </button>

              <a 
                href={selectedScheme.applicationUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="no-print w-full py-3 rounded bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 hover:text-slate-900 transition-colors flex items-center justify-center gap-2 font-bold shadow-xs"
              >
                <ExternalLink className="w-4 h-4 text-slate-500" />
                Official Portal Link &rarr;
              </a>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-100 pt-6 text-center text-[10px] text-slate-450 leading-relaxed font-mono font-semibold">
          Printed via NagarikSaathi Assistant. Verified: {formatDate(selectedScheme.lastVerified)} from {selectedScheme.sourceUrl}.
        </div>

        {/* Signature Block (Only visible during print) */}
        <div className="hidden print:flex justify-between items-end mt-12 pt-12 border-t border-slate-300">
          <div className="text-center">
            <div className="w-40 border-b border-gray-200 mb-2"></div>
            <p className="text-xs font-bold text-slate-800">Citizen Signature / Thumbprint</p>
          </div>
          <div className="text-center">
            <div className="w-48 border-b border-gray-200 mb-2"></div>
            <p className="text-xs font-bold text-slate-800">Authorized CSC VLE Signature & Stamp</p>
            <p className="text-[10px] text-slate-500 mt-1">Generated by NagarikSaathi</p>
          </div>
        </div>

      </div>

      {/* Report Incorrect Info Button (Hidden in Print) */}
      <div className="no-print pt-4 flex justify-end">
        <button 
          onClick={() => handleReportScheme(selectedScheme.schemeId)}
          className="text-xs text-gray-500 hover:text-red-650 font-bold hover:underline flex items-center gap-1.5 transition-colors"
          title="Flag outdated or incorrect information"
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t.reportScheme || 'Information outdated? Flag for database update'}</span>
        </button>
      </div>

      <ApplicationFormModal 
        scheme={selectedScheme}
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        lang={langMode}
      />

      <WhatsAppShareModal 
        scheme={selectedScheme}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        lang={langMode}
      />
    </div>
  );
}
