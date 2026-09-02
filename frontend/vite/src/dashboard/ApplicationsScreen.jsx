import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { FileCheck, Search, Phone, RefreshCw, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env?.VITE_API_URL 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api');

export default function ApplicationsScreen() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  const [applications, setApplications] = React.useState([]);
  const [appSearchTerm, setAppSearchTerm] = React.useState('');
  const [isLoadingApps, setIsLoadingApps] = React.useState(false);

  const fetchApplications = async () => {
    setIsLoadingApps(true);
    try {
      const res = await fetch(`${API_BASE}/integrations/applications`);
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

  React.useEffect(() => {
    fetchApplications();
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in p-6">
      <div className="bg-white rounded border border-slate-200 shadow-sm p-6 space-y-6">
        <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <FileCheck className="text-emerald-600" size={24} />
              <span>{t.beneficiaryApplications || 'Beneficiary Applications'}</span>
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t.beneficiaryAppDesc || 'Live registry of all citizen applications submitted and verified via WhatsApp OTP & n8n Form Engine.'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={appSearchTerm}
                onChange={(e) => setAppSearchTerm(e.target.value)}
                placeholder={t.searchByPhone || "Search by name, phone..."}
                className="bg-gray-50 border border-gray-200 rounded px-3 py-1.5 pl-8 text-sm focus:outline-none focus:border-amber-500 transition-all w-48 md:w-64"
              />
            </div>
            <button
              onClick={fetchApplications}
              disabled={isLoadingApps}
              className="flex items-center gap-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-1.5 rounded font-bold transition-all"
            >
              <RefreshCw size={14} className={isLoadingApps ? "animate-spin" : ""} />
              <span className="hidden md:inline">{t.refresh || 'Refresh'}</span>
            </button>
            <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-full text-sm font-bold shadow-xs whitespace-nowrap">
              {applications.length} {t.totalForms || 'Total Forms'}
            </span>
          </div>
        </div>

        {/* Applications Table */}
        <div className="overflow-x-auto rounded border border-gray-100">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 uppercase font-bold text-xs">
              <tr>
                <th className="px-4 py-3">{t.appRefId || 'App Ref ID'}</th>
                <th className="px-4 py-3">{t.beneficiaryName || 'Beneficiary Name'}</th>
                <th className="px-4 py-3">{t.whatsappNumber || 'WhatsApp Number'}</th>
                <th className="px-4 py-3">{t.schemeName || 'Scheme Name'}</th>
                <th className="px-4 py-3">{t.districtState || 'District / State'}</th>
                <th className="px-4 py-3">{t.incomeCat || 'Income / Cat'}</th>
                <th className="px-4 py-3">{t.submitted || 'Submitted'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-gray-800">
              {applications
                .filter(app => {
                  if (!appSearchTerm.trim()) return true;
                  const term = appSearchTerm.toLowerCase();
                  return (
                    app.applicationId?.toLowerCase().includes(term) ||
                    app.applicant?.fullName?.toLowerCase().includes(term) ||
                    app.applicant?.phone?.includes(term)
                  );
                })
                .map((app) => (
                  <tr key={app._id || app.applicationId} className="hover:bg-amber-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-700">{app.applicationId}</td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{app.applicant?.fullName || 'N/A'}</div>
                      <div className="text-xs text-slate-500 font-medium">
                        {app.applicant?.age ? `${app.applicant.age} Yrs` : ''} {app.applicant?.gender || ''}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Phone size={14} className="text-slate-400" />
                        <span>+91 {app.applicant?.phone}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900 max-w-[200px] truncate" title={app.schemeName}>
                      {app.schemeName}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      <div>{app.applicant?.district || 'N/A'}</div>
                      <div className="text-xs text-slate-400 font-medium">{app.applicant?.state || ''}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">₹{(app.applicant?.annualIncome || 0).toLocaleString('en-IN')}</div>
                      <div className="text-xs text-slate-400 font-medium">{app.applicant?.casteCategory || 'General'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                      {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : 'Recent'}
                    </td>
                  </tr>
                ))}
              {applications.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 font-medium text-sm">
                    <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                    <span>{t.noApplicationsYet || 'No beneficiary applications filled yet. Try clicking "Auto-Fill Application Form" on any scheme card!'}</span>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
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
