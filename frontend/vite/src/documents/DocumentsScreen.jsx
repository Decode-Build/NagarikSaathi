import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { FileText, CheckCircle2, Download, ExternalLink, Upload, AlertCircle, RefreshCw, ScanText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = import.meta.env?.VITE_API_URL 
  || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://localhost:5000/api'
    : '/api');

export default function DocumentsScreen() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  // Verification State
  const [selectedDocType, setSelectedDocType] = useState('Aadhaar Card');
  const [expectedName, setExpectedName] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [verifying, setVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState(null);
  const [error, setError] = useState('');

  const documentsList = [
    {
      id: 'aadhaar',
      nameEn: 'Aadhaar Card',
      nameHi: 'आधार कार्ड',
      descEn: 'Mandatory for identity and biometric verification.',
      descHi: 'पहचान और बायोमेट्रिक सत्यापन के लिए अनिवार्य।',
      link: 'https://uidai.gov.in/'
    },
    {
      id: 'pan',
      nameEn: 'PAN Card',
      nameHi: 'पैन कार्ड',
      descEn: 'Required for financial schemes and bank accounts.',
      descHi: 'वित्तीय योजनाओं और बैंक खातों के लिए आवश्यक।',
      link: 'https://www.pan.utiitsl.com/'
    },
    {
      id: 'income',
      nameEn: 'Income Certificate',
      nameHi: 'आय प्रमाण पत्र',
      descEn: 'Proof of annual family income (valid for 1 year).',
      descHi: 'वार्षिक पारिवारिक आय का प्रमाण (1 वर्ष के लिए वैध)।',
      link: null
    }
  ];

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(selectedFile);
      setVerificationResult(null);
      setError('');
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select an image file to verify.');
      return;
    }

    setVerifying(true);
    setError('');
    setVerificationResult(null);

    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', selectedDocType);
    formData.append('expectedName', expectedName);

    try {
      const res = await axios.post(`${API_BASE}/documents/verify`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setVerificationResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to connect to verification server.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in p-6">
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <FileText className="text-amber-600" />
          {lang === 'hi' ? 'दस्तावेज़ सत्यापन एवं चेकलिस्ट' : 'Document Verification & Checklist'}
        </h2>
        <p className="text-sm text-slate-500 mt-2">
          {lang === 'hi' ? 'एआई का उपयोग करके अपने दस्तावेज़ों को सत्यापित करें और चेकलिस्ट देखें।' : 'Verify your documents using AI and view the standard checklist.'}
        </p>
      </div>

      {/* AI Verification Section */}
      <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm space-y-6">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
          <ScanText className="text-blue-600 w-6 h-6" />
          <h3 className="font-bold text-lg text-slate-800">
            {lang === 'hi' ? 'एआई दस्तावेज़ सत्यापन (OCR)' : 'AI Document Verification (OCR)'}
          </h3>
        </div>

        <form onSubmit={handleVerify} className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                {lang === 'hi' ? 'दस्तावेज़ का प्रकार' : 'Document Type'}
              </label>
              <select 
                value={selectedDocType} 
                onChange={(e) => setSelectedDocType(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              >
                <option value="Aadhaar Card">Aadhaar Card</option>
                <option value="PAN Card">PAN Card</option>
                <option value="Income Certificate">Income Certificate</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                {lang === 'hi' ? 'अपेक्षित नाम (प्रोफ़ाइल से)' : 'Expected Name (From Profile)'}
              </label>
              <input 
                type="text" 
                value={expectedName}
                onChange={(e) => setExpectedName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full bg-slate-50 border border-slate-200 rounded px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleFileChange} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            {preview ? (
              <div className="flex flex-col items-center">
                <img src={preview} alt="Document Preview" className="h-32 object-contain mb-2 rounded border border-slate-200" />
                <span className="text-xs text-blue-600 font-bold">{file.name}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-slate-500">
                <Upload className="w-8 h-8 mb-2 text-slate-400" />
                <span className="text-sm font-bold">Click or drag image to upload</span>
                <span className="text-xs">Supports JPG, PNG</span>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              disabled={verifying || !file}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-6 rounded shadow-sm transition-colors flex items-center gap-2"
            >
              {verifying ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ScanText className="w-4 h-4" />}
              {verifying ? 'Verifying...' : 'Verify Document'}
            </button>
          </div>
        </form>

        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 text-sm flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {verificationResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4 animate-fade-in-up">
            <h4 className="font-bold text-slate-800 border-b border-slate-200 pb-2">Verification Results</h4>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* OCR Extraction */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Extracted Data</span>
                <ul className="mt-2 space-y-2 text-sm font-mono bg-white p-3 border border-slate-200 rounded">
                  <li><span className="text-slate-400">Name:</span> {verificationResult.extractedData?.extractedName || 'N/A'}</li>
                  <li><span className="text-slate-400">DOB:</span> {verificationResult.extractedData?.dob || 'N/A'}</li>
                  <li><span className="text-slate-400">ID:</span> {verificationResult.extractedData?.idNumber || 'N/A'}</li>
                </ul>
              </div>

              {/* Checklist */}
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">AI Checklist</span>
                <ul className="mt-2 space-y-2 text-sm">
                  {verificationResult.verificationResults.matches.map((m, i) => (
                    <li key={`m-${i}`} className="flex items-start gap-2 text-green-700">
                      <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> {m}
                    </li>
                  ))}
                  {verificationResult.verificationResults.missing.map((m, i) => (
                    <li key={`mis-${i}`} className="flex items-start gap-2 text-red-600">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {m}
                    </li>
                  ))}
                  {verificationResult.verificationResults.mismatches.map((m, i) => (
                    <li key={`err-${i}`} className="flex items-start gap-2 text-amber-600">
                      <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Standard Checklist */}
      <div className="grid md:grid-cols-3 gap-4">
        {documentsList.map((doc) => (
          <div key={doc.id} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-amber-400 transition-colors">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2 mb-1">
              <CheckCircle2 className="text-green-500 w-4 h-4" />
              {lang === 'hi' ? doc.nameHi : doc.nameEn}
            </h3>
            <p className="text-xs text-slate-600 mb-2 line-clamp-2">
              {lang === 'hi' ? doc.descHi : doc.descEn}
            </p>
            {doc.link && (
              <a href={doc.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-800">
                <ExternalLink className="w-3 h-3" /> Portal
              </a>
            )}
          </div>
        ))}
      </div>

      <div className="text-center pt-8">
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
