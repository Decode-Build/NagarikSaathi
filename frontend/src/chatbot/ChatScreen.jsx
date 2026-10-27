import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, RefreshCw, AlertTriangle, Mic, MicOff, Award, Check, Volume2, Globe, Square, ArrowRight, ExternalLink } from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function ChatScreen({
  setPage, sessionType, operatorStats, chatHistory, currentUser,
  chatLoading, chatEndRef, handleSendMessage, chatMessage, setChatMessage,
  startVoiceInput, stopVoiceInput, isListening, isAudioProcessing, voiceLang, toggleVoiceLang,
  interimTranscript, audioLevel, chatSources, setSelectedScheme, formatDate, getDomain, handleSpeechOutput,
  isSpeaking, speakingId, stopSpeech
}) {
  const { t, lang: langMode } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in relative no-print">
      
      {/* Left Column: Chat Container */}
      <div className="lg:col-span-8 flex flex-col h-[70vh] bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        
        {/* Chat Window Title Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-bold text-slate-800">
              {sessionType === 'operator' ? t.operatorMode : t.citizenMode}
            </span>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Voice Input Language Selector */}
            <button
              type="button"
              onClick={toggleVoiceLang}
              className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100 transition-colors shadow-xs"
              title="Click to toggle Voice Input Language / वॉइस इनपुट भाषा बदलें"
            >
              <Globe className="w-3.5 h-3.5 text-amber-600" />
              <span>{voiceLang === 'hi' ? '🎙️ ' + (t.voiceHindi || 'हिन्दी') : '🎙️ ' + (t.voiceEnglish || 'English')}</span>
            </button>

            <button
              onClick={() => setPage('session-toggle')}
              className="text-xs text-slate-600 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-xs"
            >
              &larr; {t.switchMode}
            </button>
          </div>
        </div>
        
        {/* Operator Live Counter Header Strip */}
        {sessionType === 'operator' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between text-xs font-semibold text-amber-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-green-600 animate-pulse" />
              <span>{t.operatorHeader}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{t.citizensHelped}: <strong className="text-slate-900 text-sm">{operatorStats.citizensHelped}</strong></span>
              <span>{t.avgSpeed}: <strong className="text-slate-900 text-sm">{operatorStats.avgResponseTimeSec != null ? `${operatorStats.avgResponseTimeSec}s` : 'N/A'}</strong></span>
            </div>
          </div>
        )}

        {/* Chat Messages Log */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/20">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 animate-bounce" />
              <div>
                <p className="font-bold text-slate-800 text-lg">{t.chatGreeting}</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  {t.chatGreetingSub}
                </p>
                {currentUser && (
                  <p className="text-xs text-amber-700 mt-3 font-mono font-bold">
                    Auto-loaded profile: Resides in {currentUser.profile?.state}, working as {currentUser.profile?.occupation}.
                  </p>
                )}
                
                {/* Voice Hint Callout */}
                <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-xs text-amber-800 font-medium">
                  <Mic className="w-3.5 h-3.5 text-amber-600 animate-pulse" />
                  <span>माइक्रोफ़ोन दबाकर हिंदी में बोलें (Press mic and speak in Hindi)</span>
                </div>
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div className={`max-w-[85%] p-4 rounded border shadow-xs ${
                  msg.role === 'user' 
                    ? 'bg-green-700 text-white rounded-br-none border-green-800' 
                    : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
                }`}>
                  <div className={`text-[10px] font-bold opacity-75 mb-1 tracking-wider uppercase ${
                    msg.role === 'user' ? 'text-green-100' : 'text-slate-500'
                  }`}>
                    {msg.role === 'user' ? 'User / नागरिक' : 'NagarikSaathi Assistant / नागरिक साथी'}
                  </div>
                  
                  <div className="text-sm leading-relaxed whitespace-pre-line prose prose-slate">
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <>
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                        <div className="mt-3 flex justify-end">
                          <button
                            onClick={() => handleSpeechOutput(msg.content, `msg-${index}`)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                              isSpeaking && speakingId === `msg-${index}`
                                ? 'bg-red-50 text-red-700 border-red-300 hover:bg-red-100 ring-2 ring-red-200 animate-pulse'
                                : 'bg-amber-50 text-amber-800 hover:bg-amber-100 hover:text-amber-900 border-amber-300'
                            }`}
                            aria-label={isSpeaking && speakingId === `msg-${index}` ? (t.stopBtn || 'रोकें') : (t.listenBtn || 'सुने')}
                            title={isSpeaking && speakingId === `msg-${index}` ? 'Click to stop / बोलना बंद करें' : 'Click to listen in Hindi or English / विवरण सुनें'}
                          >
                            {isSpeaking && speakingId === `msg-${index}` ? (
                              <>
                                <Square className="w-3.5 h-3.5 fill-red-600 text-red-600" />
                                <span>{langMode === 'hi' ? 'रोकें (Stop)' : 'Stop Audio'}</span>
                              </>
                            ) : (
                              <>
                                <Volume2 className="w-3.5 h-3.5 text-amber-700" />
                                <span>{t.listenBtn || (langMode === 'hi' ? 'विवरण सुनें' : 'Listen')}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </>
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.confidence === 'low' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-300 rounded flex items-start gap-2 text-amber-800 text-xs shadow-xs">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                      <div>
                        <strong>We're not fully certain / हम पूरी तरह से आश्वस्त नहीं हैं:</strong> Please confirm eligibility at your local CSC office or call helpline 14545.
                      </div>
                    </div>
                  )}

                  {msg.role === 'assistant' && msg.isMockMode && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded flex items-start gap-2 text-blue-800 text-xs shadow-xs">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-600" />
                      <div>
                        <strong>Mock Mode / मॉक मोड:</strong> This response is from the fallback system since the Gemini API key is missing or invalid.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}

          {chatLoading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="w-[75%] p-4 rounded bg-white border border-slate-200 rounded-bl-none shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  <span className="text-xs text-slate-500 font-medium">{t.thinking}</span>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-slate-100 rounded-full w-3/4 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded-full w-5/6 animate-pulse"></div>
                  <div className="h-3 bg-slate-100 rounded-full w-2/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Live Audio Recording & Processing Banner */}
        {isListening && (
          <div className="px-4 py-3 bg-gradient-to-r from-red-500 to-amber-600 text-white flex items-center justify-between shadow-inner animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className="w-3.5 h-3.5 rounded-full bg-white animate-ping absolute" />
                <span className="w-3 h-3 rounded-full bg-white relative" />
              </div>
              <div>
                <p className="text-xs font-bold tracking-wide">
                  {voiceLang === 'hi' ? '🎙️ हिन्दी में सुन रहा हूँ... बोलिए' : '🎙️ Listening in English... Speak now'}
                </p>
                {interimTranscript && (
                  <p className="text-xs text-amber-100 italic truncate max-w-md mt-0.5">
                    "{interimTranscript}"
                  </p>
                )}
              </div>
            </div>

            {/* Sound Wave Equalizer Bars */}
            <div className="flex items-center gap-1">
              {[40, 70, 100, 60, 90, 50, 80].map((h, i) => (
                <span
                  key={i}
                  className="w-1 bg-white/90 rounded-full transition-all duration-100"
                  style={{
                    height: `${Math.max(6, Math.min(24, (audioLevel || 20) * (h / 60)))}px`
                  }}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={stopVoiceInput}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white text-red-600 hover:bg-red-50 text-xs font-bold transition-all shadow-sm"
            >
              <Square className="w-3 h-3 fill-red-600" />
              <span>{t.stopRecording || 'रोकें और भेजें'}</span>
            </button>
          </div>
        )}

        {isAudioProcessing && (
          <div className="px-4 py-2.5 bg-amber-50 border-t border-amber-200 text-amber-900 flex items-center gap-2.5 text-xs font-bold animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-600" />
            <span>{t.transcribingAudio || 'AI साथी ऑडियो समझ रहा है...'}</span>
          </div>
        )}

        {/* Chat Input form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 items-center">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder={isListening ? (voiceLang === 'hi' ? 'हिन्दी में बोलें...' : 'Listening...') : t.chatPlaceholder}
            className="flex-grow bg-white border border-slate-200 focus:border-green-600 focus:ring-1 focus:ring-amber-600 focus:outline-none rounded px-4 py-3.5 text-sm text-slate-900 placeholder-slate-400 transition-colors shadow-xs"
          />

          {/* Voice Input Button */}
          <div className="relative group flex items-center">
            <button 
              type="button"
              onClick={isListening ? stopVoiceInput : startVoiceInput}
              disabled={isAudioProcessing}
              className={`p-3.5 rounded border transition-all ${
                isListening 
                  ? 'bg-red-600 border-red-700 text-white shadow-md animate-pulse ring-2 ring-red-300' 
                  : isAudioProcessing
                    ? 'bg-amber-100 border-amber-300 text-amber-700 cursor-wait'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
              }`}
              title={isListening ? 'Stop Recording' : (voiceLang === 'hi' ? 'हिन्दी में बोलें' : 'Search by Voice')}
              aria-label={isListening ? 'Stop Recording' : (voiceLang === 'hi' ? 'हिन्दी में बोलें' : 'Search by Voice')}
            >
              {isListening ? (
                <Square className="w-5 h-5 fill-white" />
              ) : isAudioProcessing ? (
                <RefreshCw className="w-5 h-5 animate-spin text-amber-600" />
              ) : (
                <Mic className="w-5 h-5 text-amber-600" />
              )}
            </button>
            
            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2.5 py-1 rounded bg-slate-900 text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none shadow-md z-20">
              {isListening ? (t.stopRecording || 'रोकें') : `${t.startVoiceSearch} (${voiceLang === 'hi' ? 'हिन्दी' : 'English'})`}
            </span>
          </div>

          <button
            type="submit"
            disabled={!chatMessage.trim() || chatLoading || isAudioProcessing}
            className="bg-green-700 hover:bg-green-800 text-white font-semibold rounded px-6 py-3.5 text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Right Column: Recommendations Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="p-6 bg-white border border-slate-200 rounded shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-green-700" />
            {t.matchedTitle}
          </div>
          
          {chatSources.length === 0 ? (
            <p className="text-xs text-gray-500 leading-relaxed py-4 text-center">
              {t.noMatches || 'Ask a question about your profile or welfare needs to see matched schemes here.'}
            </p>
          ) : (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              {chatSources.map((scheme, idx) => (
                <div 
                  key={scheme.schemeId || idx}
                  onClick={() => {
                    setSelectedScheme(scheme);
                    if (setPage) setPage('detail');
                    navigate('/detail');
                  }}
                  className="p-4 bg-white border border-slate-200 hover:border-green-600 rounded-xl cursor-pointer hover:bg-emerald-50/40 transition-all space-y-2.5 group shadow-xs hover:shadow-md transform hover:-translate-y-0.5"
                  title="Click to view full scheme details / योजना का विवरण देखें"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-green-800 transition-colors leading-snug">
                      {langMode === 'hi' ? (scheme.nameHindi || scheme.name) : scheme.name}
                    </h4>
                    <span className="p-1 rounded-full bg-slate-100 group-hover:bg-green-100 group-hover:text-green-700 text-slate-400 transition-colors flex-shrink-0">
                      <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-50 border border-green-200 text-green-700 text-[10px] font-medium">
                      <Check className="w-3 h-3 text-green-600" />
                      <span>{t.verifiedBadge || 'Verified'}</span>
                    </div>
                    {scheme.ragScore && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-300 text-amber-800 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        <span>Match: {scheme.ragScore}%</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {langMode === 'hi' ? (scheme.descriptionHindi || scheme.description) : scheme.description}
                  </p>

                  <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-[11px] font-bold text-green-700 group-hover:text-green-800">
                    <span>{langMode === 'hi' ? 'योजना विवरण देखें →' : 'View Scheme Details →'}</span>
                    <span className="font-mono text-[10px] text-slate-400 font-normal">{scheme.schemeId}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
