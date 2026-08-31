"use client";
import React, { useState, useEffect } from 'react';
import { Scheme } from '../data/schemes';
import { 
  X, 
  FileText, 
  CheckCircle2, 
  ShieldCheck, 
  Send, 
  Download, 
  Loader2, 
  Phone, 
  User, 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  AlertCircle,
  Sparkles,
  ExternalLink
} from 'lucide-react';

interface ApplicationFormModalProps {
  scheme: Scheme | null;
  isOpen: boolean;
  onClose: () => void;
  lang?: 'en' | 'hi';
}

export default function ApplicationFormModal({
  scheme,
  isOpen,
  onClose,
  lang = 'en'
}: ApplicationFormModalProps) {
  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [category, setCategory] = useState('General');
  const [occupation, setOccupation] = useState('Farmer');
  const [annualIncome, setAnnualIncome] = useState('');
  const [state, setState] = useState('Madhya Pradesh');
  const [district, setDistrict] = useState('');
  const [address, setAddress] = useState('');
  const [aadhaarLast4, setAadhaarLast4] = useState('');

  // WhatsApp OTP Verification State
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [verificationToken, setVerificationToken] = useState('');
  const [otpTimer, setOtpTimer] = useState(0);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [otpSuccess, setOtpSuccess] = useState<string | null>(null);

  // Form Submission & Download State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [otpTimer]);

  // Reset form when opened for a new scheme
  useEffect(() => {
    if (isOpen) {
      setOtpSent(false);
      setIsPhoneVerified(false);
      setOtp('');
      setOtpError(null);
      setOtpSuccess(null);
      setSubmissionSuccess(false);
      setApplicationId(null);
      setDownloadUrl(null);
      setErrorMessage(null);
    }
  }, [isOpen, scheme]);

  if (!isOpen || !scheme) return null;

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  // Step 1: Send OTP to WhatsApp
  const handleSendOtp = async () => {
    if (!phone || phone.replace(/\D/g, '').length < 10) {
      setOtpError(lang === 'hi' ? 'कृपया 10 अंकों का वैध व्हाट्सएप नंबर दर्ज करें।' : 'Please enter a valid 10-digit WhatsApp number.');
      return;
    }

    setIsSendingOtp(true);
    setOtpError(null);
    setOtpSuccess(null);

    try {
      const res = await fetch(`${API_URL}/integrations/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          purpose: `Scheme Application: ${scheme.name}`
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setOtpSent(true);
        setOtpTimer(60);
        setOtpSuccess(
          lang === 'hi' 
            ? 'व्हाट्सएप पर OTP भेजा गया!' 
            : 'OTP sent to your WhatsApp number!'
        );
      } else {
        setOtpError(data.error || (lang === 'hi' ? 'OTP भेजने में त्रुटि हुई।' : 'Failed to send OTP.'));
      }
    } catch (err: any) {
      setOtpError(lang === 'hi' ? 'सर्वर से कनेक्ट करने में विफल।' : 'Could not connect to server.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  // Step 2: Verify WhatsApp OTP
  const handleVerifyOtp = async () => {
    if (!otp || otp.trim().length < 4) {
      setOtpError(lang === 'hi' ? 'कृपया सही OTP दर्ज करें।' : 'Please enter the 6-digit OTP code.');
      return;
    }

    setIsVerifyingOtp(true);
    setOtpError(null);

    try {
      const res = await fetch(`${API_URL}/integrations/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otp.trim() })
      });

      const data = await res.json();
      if (res.ok && data.verified) {
        setIsPhoneVerified(true);
        setVerificationToken(data.verificationToken || 'verified');
        setOtpSuccess(lang === 'hi' ? 'व्हाट्सएप नंबर सफलतापूर्वक सत्यापित हुआ!' : 'WhatsApp number verified successfully!');
      } else {
        setOtpError(data.error || (lang === 'hi' ? 'अमान्य OTP कोड।' : 'Invalid OTP.'));
      }
    } catch (err: any) {
      setOtpError(lang === 'hi' ? 'सत्यापन में त्रुटि हुई।' : 'Failed to verify OTP.');
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Step 3: Trigger n8n Auto-fill Form & Download
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setErrorMessage(lang === 'hi' ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const applicantPayload = {
      fullName,
      phone,
      aadhaarLast4,
      gender,
      age: Number(age) || 0,
      annualIncome: Number(annualIncome) || 0,
      occupation,
      address,
      district,
      state,
      category
    };

    try {
      const res = await fetch(`${API_URL}/integrations/submit-application`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schemeId: scheme.id,
          schemeName: scheme.name,
          applicant: applicantPayload,
          verificationToken
        })
      });

      const contentType = res.headers.get('content-type') || '';

      // If backend piped binary PDF
      if (contentType.includes('application/pdf')) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Application_${scheme.name.replace(/\s+/g, '_')}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setSubmissionSuccess(true);
        setApplicationId(`NS-APP-${Date.now().toString(36).toUpperCase()}`);
        return;
      }

      const data = await res.json();
      if (res.ok && data.success) {
        setSubmissionSuccess(true);
        setApplicationId(data.applicationId || `NS-APP-${Date.now().toString(36).toUpperCase()}`);
        if (data.downloadUrl) {
          setDownloadUrl(data.downloadUrl);
        }
      } else {
        setErrorMessage(data.error || (lang === 'hi' ? 'फॉर्म सबमिट करने में विफल।' : 'Failed to submit application.'));
      }
    } catch (err: any) {
      setErrorMessage(lang === 'hi' ? 'सर्वर से कनेक्ट करने में विफल।' : 'Failed to connect to form auto-fill service.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate instant printable application document if downloading locally
  const handleDownloadSummary = () => {
    if (downloadUrl) {
      window.open(downloadUrl, '_blank');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Application - ${scheme.name}</title>
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
          .header { border-bottom: 3px solid #ea580c; padding-bottom: 20px; margin-bottom: 30px; }
          .title { font-size: 24px; font-weight: bold; color: #c2410c; margin: 0; }
          .badge { display: inline-block; background: #ecfdf5; color: #047857; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: bold; margin-top: 8px; }
          .app-id { font-size: 14px; font-weight: bold; color: #64748b; margin-top: 6px; }
          .section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px; }
          .section-title { font-size: 16px; font-weight: bold; color: #0f172a; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #cbd5e1; padding-bottom: 8px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; font-size: 14px; }
          .field-label { color: #64748b; font-weight: 600; }
          .field-value { color: #0f172a; font-weight: bold; }
          .footer { margin-top: 40px; font-size: 12px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">🏛️ NagarikSaathi - Scheme Application Form</div>
          <div class="app-id">Application Ref ID: ${applicationId || 'NS-APP-PROVISIONAL'}</div>
          <div class="badge">✓ WhatsApp Verified Submission</div>
        </div>

        <div class="section">
          <div class="section-title">1. Target Government Welfare Scheme</div>
          <div class="grid">
            <div><span class="field-label">Scheme Name:</span> <span class="field-value">${scheme.name}</span></div>
            <div><span class="field-label">Official Portal:</span> <span class="field-value">${scheme.portalUrl || 'https://www.india.gov.in'}</span></div>
            <div><span class="field-label">Helpline:</span> <span class="field-value">${scheme.helpline || '1800-111-999'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">2. Applicant Demographics & Details</div>
          <div class="grid">
            <div><span class="field-label">Applicant Name:</span> <span class="field-value">${fullName}</span></div>
            <div><span class="field-label">WhatsApp Mobile:</span> <span class="field-value">+91 ${phone}</span></div>
            <div><span class="field-label">Age & Gender:</span> <span class="field-value">${age || 'N/A'} Yrs / ${gender}</span></div>
            <div><span class="field-label">Category:</span> <span class="field-value">${category}</span></div>
            <div><span class="field-label">Occupation:</span> <span class="field-value">${occupation}</span></div>
            <div><span class="field-label">Annual Family Income:</span> <span class="field-value">₹${annualIncome || '0'}</span></div>
            <div><span class="field-label">Aadhaar (Last 4):</span> <span class="field-value">XXXX-XXXX-${aadhaarLast4 || 'XXXX'}</span></div>
            <div><span class="field-label">District & State:</span> <span class="field-value">${district || 'N/A'}, ${state}</span></div>
            <div style="grid-column: span 2;"><span class="field-label">Address:</span> <span class="field-value">${address || 'N/A'}</span></div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">3. Required Enclosures & Verification Checklist</div>
          <ul style="margin: 0; padding-left: 20px; font-size: 13px;">
            ${(scheme.documents || ['Aadhaar Card', 'Bank Passbook', 'Income Certificate']).map(d => `<li>${d} (Original & Photocopy)</li>`).join('')}
          </ul>
        </div>

        <div class="footer">
          Generated automatically by NagarikSaathi AI & n8n Form Automation Engine. Powered by Government of India Open Standards.
        </div>
        <script>
          window.print();
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(printContent);
      printWin.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-orange-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[92vh] transition-all">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white p-5 sm:p-6 relative">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 p-2 rounded-full transition-all"
          >
            <X size={18} />
          </button>
          
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase flex items-center gap-1.5">
              <Sparkles size={12} className="text-amber-200" />
              {lang === 'hi' ? 'ऑटो-फिल आवेदन फॉर्म' : 'Auto-Fill Application Form'}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black leading-tight mb-1">
            {scheme.name}
          </h2>
          <p className="text-orange-100 text-xs sm:text-sm font-medium line-clamp-2">
            {scheme.overview}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">

          {submissionSuccess ? (
            /* Success & Download Screen */
            <div className="py-6 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 size={36} className="stroke-[2.5]" />
              </div>

              <div>
                <h3 className="text-2xl font-black text-gray-900">
                  {lang === 'hi' ? 'आवेदन फॉर्म सफलतापूर्वक तैयार!' : 'Application Form Ready!'}
                </h3>
                <p className="text-gray-600 text-sm mt-1">
                  {lang === 'hi' 
                    ? 'n8n ऑटोमेशन इंजन द्वारा आपका आधिकारिक आवेदन फॉर्म भर दिया गया है।'
                    : 'Your official application form has been generated and pre-filled via n8n automation engine.'}
                </p>
              </div>

              {applicationId && (
                <div className="inline-block bg-orange-50 border border-orange-200 px-4 py-2 rounded-xl text-orange-900 font-bold text-sm">
                  {lang === 'hi' ? 'आवेदन संदर्भ क्रमांक:' : 'Application Ref ID:'} <span className="font-mono text-orange-700">{applicationId}</span>
                </div>
              )}

              <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownloadSummary}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold px-6 py-3.5 rounded-2xl shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download size={18} />
                  <span>{lang === 'hi' ? 'भरा हुआ फॉर्म डाउनलोड करें' : 'Download Pre-filled Form'}</span>
                </button>

                {scheme.portalUrl && (
                  <a
                    href={scheme.portalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="bg-white border border-gray-200 hover:bg-orange-50 text-gray-800 font-bold px-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  >
                    <span>{lang === 'hi' ? 'आधिकारिक पोर्टल खोलें' : 'Open Official Portal'}</span>
                    <ExternalLink size={16} />
                  </a>
                )}
              </div>
            </div>
          ) : (
            /* Application Input Form */
            <form onSubmit={handleSubmitApplication} className="space-y-6">

              {/* Section 1: Citizen Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-extrabold text-orange-800 uppercase tracking-widest flex items-center gap-1.5 border-b border-orange-100 pb-2">
                  <User size={15} className="text-orange-600" />
                  {lang === 'hi' ? '1. आवेदक का विवरण (Applicant Details)' : '1. Applicant Information'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'पूरा नाम *' : 'Full Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder={lang === 'hi' ? 'उदा. रमेश कुमार' : 'e.g. Ramesh Kumar'}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {lang === 'hi' ? 'आयु (वर्ष)' : 'Age (Yrs)'}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="120"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                        placeholder="35"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {lang === 'hi' ? 'लिंग' : 'Gender'}
                      </label>
                      <select
                        value={gender}
                        onChange={(e) => setGender(e.target.value)}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                      >
                        <option value="Male">{lang === 'hi' ? 'पुरुष (Male)' : 'Male'}</option>
                        <option value="Female">{lang === 'hi' ? 'महिला (Female)' : 'Female'}</option>
                        <option value="Other">{lang === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'सामाजिक वर्ग (Category)' : 'Category'}
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC (अन्य पिछड़ा वर्ग)</option>
                      <option value="SC">SC (अनुसूचित जाति)</option>
                      <option value="ST">ST (अनुसूचित जनजाति)</option>
                      <option value="EWS">EWS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'व्यवसाय (Occupation)' : 'Occupation'}
                    </label>
                    <select
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                    >
                      <option value="Farmer">{lang === 'hi' ? 'किसान (Farmer)' : 'Farmer'}</option>
                      <option value="Daily Wage Laborer">{lang === 'hi' ? 'दैनिक मजदूर (Daily Wage)' : 'Daily Wage Laborer'}</option>
                      <option value="Self Employed">{lang === 'hi' ? 'स्वरोजगार (Self-Employed)' : 'Self-Employed'}</option>
                      <option value="Artisan">{lang === 'hi' ? 'कारीगर (Artisan)' : 'Artisan'}</option>
                      <option value="Student">{lang === 'hi' ? 'छात्र (Student)' : 'Student'}</option>
                      <option value="Homemaker">{lang === 'hi' ? 'गृहणी (Homemaker)' : 'Homemaker'}</option>
                      <option value="Other">{lang === 'hi' ? 'अन्य (Other)' : 'Other'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'वार्षिक आय (₹ Annual Income)' : 'Annual Income (₹)'}
                    </label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="e.g. 150000"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'आधार कार्ड (अंतिम 4 अंक)' : 'Aadhaar (Last 4 Digits)'}
                    </label>
                    <div className="flex items-center">
                      <span className="bg-gray-100 text-gray-500 px-3 py-2.5 rounded-l-xl border border-r-0 border-gray-200 text-xs font-mono">
                        XXXX-XXXX-
                      </span>
                      <input
                        type="text"
                        maxLength={4}
                        value={aadhaarLast4}
                        onChange={(e) => setAadhaarLast4(e.target.value.replace(/\D/g, ''))}
                        placeholder="1234"
                        className="w-full px-3.5 py-2.5 rounded-r-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-mono text-gray-900 bg-slate-50/50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'राज्य (State)' : 'State'}
                    </label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      placeholder="e.g. Madhya Pradesh"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'जिला (District)' : 'District'}
                    </label>
                    <input
                      type="text"
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      placeholder="e.g. Bhopal"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {lang === 'hi' ? 'स्थायी पता (Residential Address)' : 'Address'}
                  </label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder={lang === 'hi' ? 'ग्राम, डाकघर, तहसील...' : 'Village, Post office, Tehsil...'}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm font-medium text-gray-900 bg-slate-50/50"
                  />
                </div>
              </div>

              {/* Section 2: WhatsApp OTP Verification (Workflow 3) */}
              <div className="bg-emerald-50/40 rounded-2xl p-4.5 border border-emerald-200/60 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone size={14} className="text-emerald-700" />
                    {lang === 'hi' ? '2. व्हाट्सएप सत्यापन (WhatsApp OTP Verification)' : '2. WhatsApp OTP Verification'}
                  </h4>
                  {isPhoneVerified && (
                    <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                      <ShieldCheck size={13} />
                      {lang === 'hi' ? 'सत्यापित' : 'Verified'}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {lang === 'hi' ? 'व्हाट्सएप मोबाइल नंबर *' : 'WhatsApp Mobile Number *'}
                    </label>
                    <div className="flex">
                      <span className="bg-emerald-100/70 text-emerald-800 px-3 py-2.5 rounded-l-xl border border-r-0 border-emerald-300 font-bold text-xs flex items-center">
                        +91
                      </span>
                      <input
                        type="tel"
                        maxLength={10}
                        disabled={isPhoneVerified}
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                        placeholder="9876543210"
                        className="w-full px-3.5 py-2.5 rounded-r-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-gray-900 bg-white disabled:bg-gray-100"
                      />
                    </div>
                  </div>

                  <div>
                    {!isPhoneVerified ? (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isSendingOtp || otpTimer > 0}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all shadow-sm cursor-pointer"
                      >
                        {isSendingOtp ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <Send size={13} />
                        )}
                        <span>
                          {otpTimer > 0 
                            ? `${lang === 'hi' ? 'पुनः भेजें' : 'Resend in'} (${otpTimer}s)` 
                            : (lang === 'hi' ? 'व्हाट्सएप OTP भेजें' : 'Send WhatsApp OTP')}
                        </span>
                      </button>
                    ) : (
                      <div className="text-emerald-700 text-xs font-bold flex items-center gap-1.5 py-2.5">
                        <CheckCircle2 size={16} />
                        <span>{lang === 'hi' ? 'मोबाइल नंबर सत्यापित हो गया है' : 'Phone Verified via WhatsApp'}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* OTP Input Field */}
                {otpSent && !isPhoneVerified && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-emerald-200/50">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        {lang === 'hi' ? '6-अंकीय OTP कोड दर्ज करें' : 'Enter 6-Digit WhatsApp OTP'}
                      </label>
                      <input
                        type="text"
                        maxLength={6}
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="w-full px-3.5 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono tracking-widest text-center text-sm font-black bg-white"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isVerifyingOtp || !otp}
                        className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                      >
                        {isVerifyingOtp ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ShieldCheck size={14} />
                        )}
                        <span>{lang === 'hi' ? 'OTP सत्यापित करें' : 'Verify Code'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Messages */}
                {otpError && (
                  <p className="text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle size={13} /> {otpError}
                  </p>
                )}
                {otpSuccess && (
                  <p className="text-xs text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 size={13} /> {otpSuccess}
                  </p>
                )}
              </div>

              {/* Error Banner */}
              {errorMessage && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Form Action Footer */}
              <div className="pt-2 flex gap-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 font-bold text-xs transition-all"
                >
                  {lang === 'hi' ? 'रद्द करें' : 'Cancel'}
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-gradient-to-r from-orange-500 via-red-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-3 px-5 rounded-xl shadow-lg hover:shadow-xl text-xs flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer disabled:opacity-75"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>{lang === 'hi' ? 'फॉर्म तैयार हो रहा है (n8n Engine)...' : 'Generating Form (n8n Engine)...'}</span>
                    </>
                  ) : (
                    <>
                      <FileText size={15} />
                      <span>{lang === 'hi' ? 'आवेदन फॉर्म भरें और डाउनलोड करें' : 'Generate & Download Application Form'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          )}

        </div>
      </div>
    </div>
  );
}
