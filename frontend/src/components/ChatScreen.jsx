import React from 'react';
import ReactMarkdown from 'react-markdown';
import { MessageSquare, RefreshCw, AlertTriangle, Mic, Award, Check } from 'lucide-react';

export default function ChatScreen({
  setPage, sessionType, t, langMode, operatorStats, chatHistory, currentUser,
  chatLoading, chatEndRef, handleSendMessage, chatMessage, setChatMessage,
  startVoiceInput, isListening, chatSources, setSelectedScheme, formatDate, getDomain
}) {
  return (
    <div className="grid lg:grid-cols-12 gap-8 animate-fade-in relative no-print">
      
      {/* Left Column: Chat Container */}
      <div className="lg:col-span-8 flex flex-col h-[70vh] bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
        
        {/* Chat Window Title Bar */}
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex items-center justify-between no-print">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-amber-655" />
            <span className="text-sm font-bold text-slate-800">
              {sessionType === 'operator' ? 'Operator Assist Chat / ऑपरेटर सहायता चैट' : 'Citizen Discovery Chat / नागरिक योजना खोज चैट'}
            </span>
          </div>
          <button
            onClick={() => setPage('session-toggle')}
            className="text-xs text-slate-655 hover:text-slate-900 border border-slate-200 bg-white px-3 py-1.5 rounded-lg transition-colors font-semibold shadow-xs"
          >
            &larr; Switch Mode / मोड बदलें
          </button>
        </div>
        
        {/* Operator Live Counter Header Strip */}
        {sessionType === 'operator' && (
          <div className="bg-amber-50 border-b border-amber-250 px-6 py-3 flex items-center justify-between text-xs font-semibold text-amber-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 animate-pulse" />
              <span>{t[langMode].operatorHeader}</span>
            </div>
            <div className="flex items-center gap-4">
              <span>{t[langMode].citizensHelped}: <strong className="text-slate-900 text-sm">{operatorStats.citizensHelped}</strong></span>
              <span>{t[langMode].avgSpeed}: <strong className="text-slate-900 text-sm">{operatorStats.avgResponseTimeSec != null ? `${operatorStats.avgResponseTimeSec}s` : 'N/A'}</strong></span>
            </div>
          </div>
        )}

        {/* Chat Messages Log */}
        <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/20">
          {chatHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-450">
              <MessageSquare className="w-12 h-12 text-slate-350 animate-bounce" />
              <div>
                <p className="font-bold text-slate-800 text-lg">NagarikSaathi Chat / नागरिक साथी चैट</p>
                <p className="text-sm text-slate-500 mt-1 max-w-sm">
                  Enter details about the citizen's job, state, age, or income in Hindi or English.
                </p>
                {currentUser && (
                  <p className="text-xs text-amber-700 mt-3 font-mono font-bold">
                    Auto-loaded profile: Resides in {currentUser.profile?.state}, working as {currentUser.profile?.occupation}.
                  </p>
                )}
              </div>
            </div>
          ) : (
            chatHistory.map((msg, index) => (
              <div 
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
              >
                <div className={`max-w-[85%] p-4 rounded-2xl border shadow-xs ${
                  msg.role === 'user' 
                    ? 'bg-amber-600 text-white rounded-br-none border-amber-700' 
                    : 'bg-white text-slate-800 border-slate-200 rounded-bl-none'
                }`}>
                  <div className={`text-[10px] font-bold opacity-75 mb-1 tracking-wider uppercase ${
                    msg.role === 'user' ? 'text-amber-100' : 'text-slate-500'
                  }`}>
                    {msg.role === 'user' ? 'User' : 'NagarikSaathi Assistant'}
                  </div>
                  
                  <div className="text-sm leading-relaxed whitespace-pre-line prose prose-slate">
                    {msg.role === 'user' ? (
                      msg.content
                    ) : (
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    )}
                  </div>

                  {msg.role === 'assistant' && msg.confidence === 'low' && (
                    <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-amber-800 text-xs shadow-xs">
                      <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-600" />
                      <div>
                        <strong>We're not fully certain / हम पूरी तरह से आश्वस्त नहीं हैं:</strong> Please confirm eligibility at your local CSC office or call helpline 14545.
                      </div>
                    </div>
                  )}

                  {msg.role === 'assistant' && msg.isMockMode && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-2 text-blue-800 text-xs shadow-xs">
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
              <div className="w-[75%] p-4 rounded-2xl bg-white border border-slate-200 rounded-bl-none shadow-xs space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 animate-spin text-amber-650" />
                  <span className="text-xs text-slate-500 font-medium">Searching schemes...</span>
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

        {/* Chat Input form */}
        <form onSubmit={handleSendMessage} className="p-4 bg-slate-50 border-t border-slate-200 flex gap-3 items-center">
          <input
            type="text"
            value={chatMessage}
            onChange={(e) => setChatMessage(e.target.value)}
            placeholder={t[langMode].chatPlaceholder}
            className="flex-grow bg-white border border-slate-200 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none rounded-xl px-4 py-3.5 text-sm text-slate-900 placeholder-slate-405 transition-colors shadow-xs"
          />

          {/* Native Voice Input Button */}
          <div className="relative group">
            <button 
              type="button"
              onClick={startVoiceInput}
              className={`p-3.5 rounded-xl border transition-all ${
                isListening 
                  ? 'bg-red-50 border-red-250 text-red-650 animate-pulse shadow-sm' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 shadow-xs'
              }`}
              title={langMode === 'hi' ? 'आवाज़ द्वारा खोजें' : 'Search by Voice'}
              aria-label={langMode === 'hi' ? 'आवाज़ द्वारा खोजें' : 'Search by Voice'}
            >
              <Mic className="w-5 h-5" />
            </button>
            <span className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 px-2.5 py-1 rounded bg-slate-800 border border-slate-950 text-[10px] text-white opacity-0 group-hover:opacity-100 whitespace-nowrap transition-opacity pointer-events-none shadow-md">
              {langMode === 'hi' ? 'बोलकर खोजें (नया)' : 'Voice Input (New)'}
            </span>
          </div>

          <button
            type="submit"
            disabled={!chatMessage.trim() || chatLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-xl px-6 py-3.5 text-sm shadow-sm transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Send
          </button>
        </form>
      </div>

      {/* Right Column: Recommendations Sidebar */}
      <div className="lg:col-span-4 space-y-6">
        <div className="p-6 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-800 tracking-wide uppercase border-b border-slate-100 pb-3">
            <Award className="w-4 h-4 text-amber-600" />
            {t[langMode].matchedTitle}
          </div>
          
          {chatSources.length === 0 ? (
            <p className="text-xs text-slate-400 leading-relaxed py-4 text-center">
              {t[langMode].noMatches}
            </p>
          ) : (
            <div className="space-y-4 max-h-[50vh] overflow-y-auto pr-1">
              {chatSources.map((scheme, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setSelectedScheme(scheme);
                    setPage('detail');
                  }}
                  className="p-4 bg-white border border-slate-150 hover:border-amber-600/40 rounded-xl cursor-pointer hover:bg-slate-50 transition-all space-y-2 group shadow-xs"
                >
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-650 transition-colors">
                    {langMode === 'hi' ? scheme.nameHindi : scheme.name}
                  </h4>
                  
                  <div className="flex flex-wrap gap-2 items-center">
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-green-55 border border-green-150 text-green-700 text-[10px] font-medium">
                      <Check className="w-3.5 h-3.5 text-green-600" />
                      <span>{t[langMode].verifiedBadge}: {formatDate(scheme.lastVerified)}</span>
                    </div>
                    {scheme.ragScore && (
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[10px] font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse" />
                        <span>RAG Match: {scheme.ragScore}%</span>
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                    {langMode === 'hi' ? scheme.descriptionHindi : scheme.description}
                  </p>
                  
                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono pt-1">
                    <span className="truncate max-w-[130px]">{scheme.ministry}</span>
                    <span className="text-amber-650 font-bold group-hover:underline">{t[langMode].viewGuide} &rarr;</span>
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
