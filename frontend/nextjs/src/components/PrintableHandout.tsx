"use client";
import React from 'react';
import { Scheme } from '../data/schemes';
import { QRCodeSVG } from 'qrcode.react';

interface PrintableHandoutProps {
  scheme: Scheme;
}

export default function PrintableHandout({ scheme }: PrintableHandoutProps) {
  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const handoutId = `NS-${scheme.id.toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

  return (
    <div className="bg-white p-8 max-w-3xl mx-auto border-2 border-gray-300 font-sans text-gray-900 leading-normal">
      {/* Official Header */}
      <div className="border-b-2 border-orange-600 pb-4 mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-orange-700 tracking-tight flex items-center gap-2">
            🏛️ नागरिक साथी (NagarikSaathi)
          </h1>
          <p className="text-sm font-semibold text-gray-600">
            National Welfare Scheme Assistance Handout & Document Checklist
          </p>
        </div>
        <div className="text-right text-xs text-gray-500 font-mono">
          <div>Handout ID: <span className="font-bold text-gray-800">{handoutId}</span></div>
          <div>Date: {currentDate}</div>
        </div>
      </div>
      
      {/* Scheme Title & Overview */}
      <div className="mb-6 bg-orange-50/60 p-4 rounded-xl border border-orange-200">
        <h2 className="text-2xl font-black text-gray-900 mb-1.5">{scheme.name}</h2>
        <p className="text-sm text-gray-700 leading-relaxed text-justify">{scheme.overview}</p>
      </div>

      {/* Benefits & Eligibility 2-Column Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2">
            🎁 Key Benefits (मुख्य लाभ)
          </h3>
          <ul className="text-xs text-gray-800 space-y-1.5 pl-4 list-disc">
            {scheme.benefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
        </div>
        
        <div className="border border-gray-200 rounded-lg p-3.5 bg-gray-50/50">
          <h3 className="text-sm font-bold text-orange-800 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-2">
            ✅ Eligibility Criteria (पात्रता)
          </h3>
          <ul className="text-xs text-gray-800 space-y-1.5 pl-4 list-disc">
            {scheme.eligibility.map((criteria, i) => (
              <li key={i}>{criteria}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Required Documents Checklist */}
      <div className="mb-6 border border-gray-200 rounded-lg p-4 bg-white">
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b border-gray-200 pb-1.5 mb-3 flex justify-between items-center">
          <span>📄 Required Documents Checklist (आवश्यक दस्तावेज़ सूची)</span>
          <span className="text-[10px] text-gray-500 font-normal">Check mark when gathered</span>
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {scheme.documents.map((doc, i) => (
            <div key={i} className="flex items-center text-xs text-gray-800">
              <div className="w-4 h-4 border-2 border-gray-600 mr-2.5 rounded-sm shrink-0 bg-white"></div>
              <span className="font-medium">{doc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Application Steps & QR Code */}
      <div className="flex justify-between items-center bg-gray-100 p-4 rounded-xl border border-gray-300 mb-6">
        <div className="flex-1 pr-4">
          <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">
            🌐 How to Apply (आवेदन कैसे करें)
          </h3>
          <ol className="list-decimal pl-4 space-y-1 text-xs text-gray-800">
            {scheme.applicationProcess.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <div className="mt-3 flex items-center gap-4 text-xs font-bold text-gray-800">
            <span>📞 Helpline: <span className="text-orange-700">{scheme.helpline || "1800-111-999"}</span></span>
          </div>
        </div>
        
        <div className="text-center bg-white p-3 rounded-lg border border-gray-300 shadow-sm flex flex-col items-center shrink-0">
          <QRCodeSVG value={scheme.portalUrl || "https://www.india.gov.in"} size={105} />
          <p className="text-[10px] text-gray-600 mt-1 font-bold">Scan to Apply</p>
        </div>
      </div>
      
      {/* CSC Stamping & Verification Box */}
      <div className="border-2 border-dashed border-gray-400 p-3 rounded-lg mb-4 flex justify-between items-center text-xs text-gray-600">
        <div>
          <span className="font-bold text-gray-800 block">CSC / VLE Operator Verification:</span>
          <span>Verified at Common Service Centre (CSC) for Citizen Assistance.</span>
        </div>
        <div className="w-36 h-12 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-400">
          [ Center Stamp / Sign ]
        </div>
      </div>

      {/* Footer */}
      <div className="text-center text-[11px] text-gray-500 border-t border-gray-200 pt-3">
        Generated via <strong>NagarikSaathi</strong> — Empowering rural citizens and CSC operators across India.
      </div>
    </div>
  );
}
