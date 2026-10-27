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
  Clock,
  XCircle,
  AlertTriangle,
  FileText,
  BarChart3,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  const [updatingAppId, setUpdatingAppId] = useState(null);
  const [statusModalApp, setStatusModalApp] = useState(null);
  const [actionRemarks, setActionRemarks] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

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
      const res = await axios.get(`${API_URL}/integrations/applications`);
      if (res.data) {
        setApplications(res.data.applications || []);
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

  const handleUpdateStatus = async (appId, newStatus, remarks = '') => {
    setUpdatingAppId(appId);
    try {
      const res = await axios.patch(`${API_URL}/integrations/applications/${appId}/status`, {
        status: newStatus,
        remarks: remarks || `Status marked as ${newStatus} by CSC Operator`
      });

      if (res.data && res.data.success) {
        // Update state locally
        setApplications(prev => prev.map(a => 
          (a.applicationId === appId || a._id === appId)
            ? { ...a, status: newStatus, remarks: remarks || a.remarks, updatedAt: new Date() }
            : a
        ));
        setStatusModalApp(null);
        setActionRemarks('');
      }
    } catch (err) {
      console.error("Failed to update status:", err);
      alert("Failed to update status: " + (err.response?.data?.error || err.message));
    } finally {
      setUpdatingAppId(null);
    }
  };

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
    const matchesFilter = statusFilter === 'ALL' || (app.status || 'SUBMITTED') === statusFilter;
    if (!matchesFilter) return false;

    if (!appSearchTerm.trim()) return true;
    const term = appSearchTerm.toLowerCase();
    return (
      app.applicationId?.toLowerCase().includes(term) ||
      app.applicant?.fullName?.toLowerCase().includes(term) ||
      app.applicant?.phone?.includes(term) ||
      app.schemeName?.toLowerCase().includes(term) ||
      app.applicant?.state?.toLowerCase().includes(term) ||
      app.status?.toLowerCase().includes(term)
    );
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="bg-amber-50 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 shadow-xs">
            <Check size={10} className="text-amber-600" /> Docs Verified
          </span>
        );
      case 'PROCESSED':
        return (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 shadow-xs">
            <CheckCircle2 size={10} className="text-emerald-600" /> Approved & Disbursed
          </span>
        );
      case 'REJECTED':
        return (
          <span className="bg-red-50 text-red-700 border border-red-300 px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 shadow-xs">
            <XCircle size={10} className="text-red-600" /> Rejected
          </span>
        );
      case 'SUBMITTED':
      default:
        return (
          <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-extrabold inline-flex items-center gap-1 shadow-xs">
            <Clock size={10} className="text-blue-600" /> Submitted
          </span>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in no-print p-4 sm:p-6">
      
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display flex items-center gap-2">
            <span>🏛️ {t.adminPanel || 'CSC Admin Panel'}</span>
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Accept, verify, approve, and track citizen welfare applications in real-time.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/tracking')}
            className="bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ExternalLink className="w-3.5 h-3.5" /> Citizen Tracker View
          </button>
          <button
            onClick={() => window.print()}
            className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-600" /> {t.printImpactReport || 'Print Report'}
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
          <span>Application Processing Queue ({applications.length})</span>
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

      {/* TAB 1: APPLICATIONS REGISTRY & ACTION MANAGEMENT */}
      {activeTab === 'applications' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6 animate-fade-in">
          <div className="border-b border-gray-100 pb-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileCheck className="text-emerald-600" size={20} />
                <span>Live Scheme Applications & Status Management</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Review documents, approve applications, or mark rejections to update the citizen's live tracking timeline.
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Status Filter Pills */}
              <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-[11px] font-bold">
                {['ALL', 'SUBMITTED', 'VERIFIED', 'PROCESSED', 'REJECTED'].map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      statusFilter === filter 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {filter === 'ALL' ? 'All' : filter === 'PROCESSED' ? 'Approved' : filter}
                  </button>
                ))}
              </div>

              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={appSearchTerm}
                  onChange={(e) => setAppSearchTerm(e.target.value)}
                  placeholder="Search by ID, name, phone, scheme..."
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 pl-8 text-xs focus:outline-none focus:border-amber-500 transition-all w-48 md:w-60"
                />
              </div>
              <button
                onClick={fetchApplications}
                disabled={isLoadingApps}
                className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer"
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
                  <th className="px-4 py-3">WhatsApp Phone</th>
                  <th className="px-4 py-3">Scheme Applied</th>
                  <th className="px-4 py-3">State / District</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center">Manage Decision</th>
                  <th className="px-4 py-3 text-right">Track</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-800">
                {filteredApplications.map((app) => {
                  const currentStatus = app.status || 'SUBMITTED';
                  const isBusy = updatingAppId === app.applicationId;

                  return (
                    <tr key={app._id || app.applicationId} className="hover:bg-amber-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-amber-700">
                        {app.applicationId}
                      </td>
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
                      <td className="px-4 py-3 font-semibold text-slate-900 max-w-[200px] truncate" title={app.schemeName}>
                        {app.schemeName}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{app.applicant?.district || 'N/A'}</div>
                        <div className="text-[11px] text-slate-400 font-medium">{app.applicant?.state || ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(currentStatus)}
                        {app.remarks && (
                          <div className="text-[10px] text-slate-500 mt-1 truncate max-w-[150px]" title={app.remarks}>
                            💬 {app.remarks}
                          </div>
                        )}
                      </td>
                      
                      {/* Interactive Admin Decision Action Buttons */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1.5">
                          {currentStatus === 'SUBMITTED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.applicationId, 'VERIFIED')}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded bg-amber-500 hover:bg-amber-600 text-white font-bold text-[11px] transition-all shadow-xs"
                                title="Mark documents as verified"
                              >
                                {isBusy ? '...' : '✅ Verify Docs'}
                              </button>
                              <button
                                onClick={() => { setStatusModalApp(app); setActionRemarks(''); }}
                                disabled={isBusy}
                                className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[11px] transition-all"
                                title="Reject Application"
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}

                          {currentStatus === 'VERIFIED' && (
                            <>
                              <button
                                onClick={() => handleUpdateStatus(app.applicationId, 'PROCESSED')}
                                disabled={isBusy}
                                className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-all shadow-xs"
                                title="Approve and disburse scheme benefits"
                              >
                                {isBusy ? '...' : '🎉 Approve & Disburse'}
                              </button>
                              <button
                                onClick={() => { setStatusModalApp(app); setActionRemarks(''); }}
                                disabled={isBusy}
                                className="px-2 py-1 rounded bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold text-[11px] transition-all"
                                title="Reject Application"
                              >
                                ❌ Reject
                              </button>
                            </>
                          )}

                          {currentStatus === 'PROCESSED' && (
                            <div className="flex items-center gap-1">
                              <span className="text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                Disbursed ✓
                              </span>
                              <button
                                onClick={() => handleUpdateStatus(app.applicationId, 'SUBMITTED')}
                                disabled={isBusy}
                                className="text-[10px] text-slate-500 hover:text-slate-800 underline ml-1"
                              >
                                Reset
                              </button>
                            </div>
                          )}

                          {currentStatus === 'REJECTED' && (
                            <button
                              onClick={() => handleUpdateStatus(app.applicationId, 'SUBMITTED')}
                              disabled={isBusy}
                              className="px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] transition-all"
                            >
                              🔄 Re-open
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Citizen Tracker Link */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate('/tracking')}
                          className="text-blue-600 hover:text-blue-800 font-bold text-[11px] inline-flex items-center gap-1 hover:underline"
                          title="View live citizen tracking timeline"
                        >
                          <span>Track</span>
                          <ExternalLink size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                
                {filteredApplications.length === 0 && (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-gray-400 font-medium text-sm">
                      <FileText size={40} className="mx-auto text-gray-300 mb-2" />
                      <p className="font-bold text-slate-700">No applications found in this filter</p>
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

      {/* Reject / Status Notes Modal */}
      {statusModalApp && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl space-y-4 border border-slate-200">
            <div className="flex items-center gap-2 text-red-600 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <span>Reject Application ({statusModalApp.applicationId})</span>
            </div>
            <p className="text-xs text-slate-600">
              Please enter the reason for rejecting <strong>{statusModalApp.applicant?.fullName}</strong>'s application for <strong>{statusModalApp.schemeName}</strong>. This reason will be displayed on the citizen's live tracking timeline.
            </p>
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">Rejection Reason / टिप्पणी</label>
              <textarea
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                placeholder="e.g. Income certificate expired, land documents mismatched..."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-xl focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalApp(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(statusModalApp.applicationId, 'REJECTED', actionRemarks || 'Application rejected during document review')}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-700 text-white shadow-sm"
              >
                Confirm Rejection
              </button>
            </div>
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
                  <p className="text-xs text-gray-500 py-4 text-center">{t.noRecentActivity || 'No recent activity.'}</p>
                )}
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-sm">
              <h3 className="text-lg font-bold text-slate-800">{t.categoriesMatched || 'Categories Matched'}</h3>
              <div className="space-y-3">
                {operatorStats.categoriesMatched && operatorStats.categoriesMatched.map((cat, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-xs font-semibold text-slate-700">
                      <span>{cat.name}</span>
                      <span>{cat.percentage}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500 rounded-full" style={{ width: `${cat.percentage}%` }}></div>
                    </div>
                  </div>
                ))}
                {(!operatorStats.categoriesMatched || operatorStats.categoriesMatched.length === 0) && (
                  <p className="text-xs text-gray-500 py-4 text-center">{t.notEnoughData || 'Not enough data.'}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
