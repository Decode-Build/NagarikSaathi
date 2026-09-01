import React from 'react';
import { Printer, Users, Check, RefreshCw, Award, FileCheck, Search, Phone, CheckCircle2, Eye, FileText } from 'lucide-react';

import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardScreen({ operatorStats }) {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);
  const [password, setPassword] = React.useState('');
  React.useEffect(() => {
    // Keep authentication logic intact
  }, [isAuthenticated]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '7389') {
      setIsAuthenticated(true);
    } else {
      alert(t.incorrectPassword || 'Incorrect Password');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-6">
        <h2 className="text-2xl font-bold text-slate-900">{t.operatorLogin || 'Operator Login'}</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.enterPassword || "Enter Operator Password"}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
          />
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors">
            {t.accessDashboard || 'Access Dashboard'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in no-print p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">{t.vleImpactDashboard || 'VLE Impact Dashboard'}</h2>
          <p className="text-sm text-slate-500">{t.vleImpactSub || 'Track your performance and print official reports for district coordination.'}</p>
        </div>
        <button
          onClick={() => window.print()}
          className="bg-green-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded text-sm shadow-sm transition-all flex items-center gap-2 self-start sm:self-auto"
        >
          <Printer className="w-4 h-4" /> {t.printImpactReport || 'Print Impact Report'}
        </button>
      </div>

      {/* Operator Stat Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: t.totalCitizensHelped || "Total Citizens Helped", value: operatorStats.citizensHelped || 0, icon: <Users className="text-green-600 w-5 h-5" /> },
          { label: t.matchSuccessRate || "Match Success Rate", value: operatorStats.matchRate || "N/A", icon: <Check className="text-green-600 w-5 h-5" /> },
          { label: t.avgResolutionTime || "Avg. Resolution Time", value: operatorStats.avgResponseTimeSec != null ? `${operatorStats.avgResponseTimeSec}s` : 'N/A', icon: <RefreshCw className="text-indigo-605 w-5 h-5" /> },
          { label: t.districtRank || "District Rank", value: operatorStats.districtRank || "N/A", icon: <Award className="text-orange-550 w-5 h-5" /> }
        ].map((stat, idx) => (
          <div key={idx} className="bg-white border border-slate-200 p-5 rounded space-y-2 shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-550 font-bold uppercase tracking-wider">{stat.label}</span>
              {stat.icon}
            </div>
            <p className="text-2xl font-extrabold text-slate-900 font-mono">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Detailed Analytics Rows */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white border border-slate-200 p-6 rounded space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800">{t.recentActivityLog || 'Recent Activity Log'}</h3>
          <div className="space-y-3">
            {operatorStats.recentActivity && operatorStats.recentActivity.map((act, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded border border-slate-150 text-xs">
                <div>
                  <p className="font-bold text-slate-800">{act.citizen} ({act.state})</p>
                  <p className="text-slate-500 mt-0.5 font-medium">{act.scheme}</p>
                </div>
                <div className="text-right">
                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-700 border border-green-150 font-semibold block mb-1">{act.status}</span>
                  <span className="text-gray-500 font-mono text-[10px] block font-semibold">{act.time}</span>
                </div>
              </div>
            ))}
            {(!operatorStats.recentActivity || operatorStats.recentActivity.length === 0) && (
              <div className="text-gray-500 text-sm py-4">{t.noRecentActivity || 'No recent activity found.'}</div>
            )}
          </div>
        </div>

        <div className="bg-white border border-slate-200 p-6 rounded space-y-4 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 font-display">{t.categoriesMatched || 'Categories Matched'}</h3>
          <div className="space-y-3 text-xs">
            {operatorStats.categoriesMatched && operatorStats.categoriesMatched.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex justify-between text-slate-700 font-bold">
                  <span>{item.cat}</span>
                  <span className="font-mono text-amber-655 font-bold">{item.percent}</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-600" style={{ width: item.percent }} />
                </div>
              </div>
            ))}
            {(!operatorStats.categoriesMatched || operatorStats.categoriesMatched.length === 0) && (
              <div className="text-gray-500 text-sm py-4">{t.notEnoughData || 'Not enough data.'}</div>
            )}
          </div>
        </div>
      </div>



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
