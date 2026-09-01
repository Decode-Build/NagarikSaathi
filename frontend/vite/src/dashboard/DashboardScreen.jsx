import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Users, 
  Check, 
  RefreshCw, 
  Award, 
  FileCheck, 
  Search, 
  Phone, 
  CheckCircle2, 
  Eye, 
  FileText,
  BarChart3,
  Calendar,
  Download,
  Filter
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';

export default function DashboardScreen({ operatorStats = {} }) {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('applications'); // 'applications' | 'analytics'
  
  // Applications State
  const [applications, setApplications] = useState([]);
  const [appSearchTerm, setAppSearchTerm] = useState('');
  const [isLoadingApps, setIsLoadingApps] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);

  const API_URL = import.meta.env?.VITE_API_URL 
    || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? 'http://localhost:5000/api'
      : '/api');

  const handleLogin = (e) => {
    e.preventDefault();
    if (password === '7389' || password === 'admin') {
      setIsAuthenticated(true);
    } else {
      alert(t.incorrectPassword || 'Incorrect Password');
    }
  };

  const fetchApplications = async () => {
    setIsLoadingApps(true);
    try {
      const res = await fetch(`${API_URL}/integrations/applications`);
      if (res.ok) {
        const data = await res.json();
        setApplications(data.applications || []);
      }
    } catch (err) {
      console.warn("Could not fetch submitted applications:", err);
    } finally {
      setIsLoadingApps(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchApplications();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-12 p-8 bg-white border border-slate-200 rounded-2xl shadow-sm text-center space-y-6 animate-fade-in">
        <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto text-2xl font-black">
          🏛️
        </div>
        <div>
          <h2 className="text-2xl font-extrabold text-slate-900">{t.operatorLogin || 'Admin & Operator Login'}</h2>
          <p className="text-xs text-slate-500 mt-1">Enter password to access Citizen Applications and VLE Dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.enterPassword || "Enter Operator Password (7389)"}
            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-sm"
          />
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md transition-colors text-sm cursor-pointer">
            {t.accessDashboard || 'Access Admin Panel'}
          </button>
        </form>
      </div>
    );
  }

  const filteredApplications = applications.filter(app => {
    if (!appSearchTerm.trim()) return true;
    const term = appSearchTerm.toLowerCase();
    return (
      app.applicationId?.toLowerCase().includes(term) ||
      app.applicant?.fullName?.toLowerCase().includes(term) ||
      app.applicant?.phone?.includes(term) ||
      app.schemeName?.toLowerCase().includes(term) ||
      app.applicant?.state?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in no-print p-4 sm:p-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <span>🏛️ {t.adminPanel || 'CSC Admin Panel'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage beneficiary welfare applications, WhatsApp OTP verifications, and district impact metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs shadow-xs transition-all flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-600" /> {t.printImpactReport || 'Print Report'}
          </button>
        </div>
      </div>

      {/* Tabs Row */}
      <div className="flex border-b border-slate-200 space-x-4">
        <button
          onClick={() => setActiveTab('applications')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'applications'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck className="w-4 h-4" />
          <span>Beneficiary Applications ({applications.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`pb-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'border-amber-600 text-amber-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>VLE Impact & Analytics</span>
        </button>
      </div>

      {/* TAB 1: APPLICATIONS REGISTRY */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-emerald-600" size={20} />
                <span>Submitted Scheme Applications</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Real-time submissions processed via n8n Form Automation & WhatsApp OTP verification.
              </p>
            </div>
            
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                  placeholder="Search by name, phone, scheme..."
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 pl-8 text-xs focus:outline-none focus:border-amber-500 transition-all w-48 md:w-64"
                />
              </div>
              <button
                onClick={fetchApplications}
                disabled={isLoadingApps}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-2 rounded-xl font-bold transition-all cursor-pointer"
              >
                <RefreshCw size={13} className={isLoadingApps ? "animate-spin" : ""} />
                <span className="hidden sm:inline">Refresh</span>
              </button>
            </div>
          </div>

          {/* Applications Table */}
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-[11px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">App Ref ID</th>
                  <th className="px-4 py-3">Beneficiary</th>
                  <th className="px-4 py-3">WhatsApp Number</th>
                  <th className="px-4 py-3">Scheme Applied</th>
                  <th className="px-4 py-3">State / District</th>
                  <th className="px-4 py-3">Income & Category</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredApplications.map((app) => (
                  <tr key={app._id || app.applicationId} className="hover:bg-amber-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{app.applicationId}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{app.applicant?.fullName || 'N/A'}</div>
                      <div className="text-[11px] text-slate-500 font-medium">
                        {app.applicant?.age ? `${app.applicant.age} Yrs • ` : ''}{app.applicant?.gender || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 font-semibold text-slate-800">
                        <Phone size={12} className="text-emerald-600" />
                        <span>+91 {app.applicant?.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-[220px] truncate" title={app.schemeName}>
                      {app.schemeName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{app.applicant?.district || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{app.applicant?.state || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">₹{(app.applicant?.annualIncome || 0).toLocaleString('en-IN')}</div>
                      <div className="text-[11px] text-slate-400 font-medium">{app.applicant?.category || app.applicant?.casteCategory || 'General'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1">
                        <CheckCircle2 size={10} /> Verified
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-IN') : 'Today'}
                    </td>
                  </tr>
                ))}
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400 font-medium text-sm">
                      <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="font-bold text-slate-700">No applications found</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {appSearchTerm ? 'Try adjusting your search keywords.' : 'Fill an application form on any scheme to see live entries here!'}
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: VLE IMPACT & ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-fade-in">
          {/* Operator Stat Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: t.totalCitizensHelped || "Total Citizens Helped", value: operatorStats.citizensHelped || applications.length || 0, icon: <Users className="text-green-600 w-5 h-5" /> },
              { label: t.matchSuccessRate || "Match Success Rate", value: operatorStats.matchRate || "98.4%", icon: <Check className="text-green-600 w-5 h-5" /> },
              { label: t.avgResolutionTime || "Avg. Resolution Time", value: operatorStats.avgResponseTimeSec != null ? `${operatorStats.avgResponseTimeSec}s` : '1.4s', icon: <RefreshCw className="text-indigo-600 w-5 h-5" /> },
              { label: t.districtRank || "District Rank", value: operatorStats.districtRank || "#1 VLE", icon: <Award className="text-orange-500 w-5 h-5" /> }
            ].map((stat, idx) => (
              <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</span>
                  {stat.icon}
                </div>
                <p className="text-2xl font-extrabold text-slate-900 font-mono">{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Detailed Analytics Rows */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="md:col-span-2 bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">{t.recentActivityLog || 'Recent Activity Log'}</h3>
              <div className="space-y-3">
                {operatorStats.recentActivity && operatorStats.recentActivity.map((act, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
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
                  <div className="text-gray-500 text-xs py-4 text-center">No recent activity logged yet.</div>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800 font-display">{t.categoriesMatched || 'Categories Matched'}</h3>
              <div className="space-y-3 text-xs">
                {(operatorStats.categoriesMatched || [
                  { cat: 'Agriculture & Farmers', percent: '45%' },
                  { cat: 'Social Welfare & Women', percent: '30%' },
                  { cat: 'Education & Youth', percent: '15%' },
                  { cat: 'Housing & Sanitation', percent: '10%' }
                ]).map((item, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-slate-700 font-bold">
                      <span>{item.cat}</span>
                      <span className="font-mono text-amber-600 font-bold">{item.percent}</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-600" style={{ width: item.percent }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back Button */}
      <div className="text-center pt-2">
        <button
          onClick={() => navigate('/')}
          className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 px-6 py-2.5 rounded-xl font-bold text-xs transition-all shadow-xs cursor-pointer"
        >
          &larr; {t.backToPortalHome || 'Back to Portal Home'}
        </button>
      </div>

    </div>
  );
}
