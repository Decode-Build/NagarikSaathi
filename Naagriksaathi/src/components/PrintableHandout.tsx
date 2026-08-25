"use client";
import React from 'react';
import { Scheme } from '../data/schemes';
import { QRCodeSVG } from 'qrcode.react';

interface PrintableHandoutProps {
  scheme: Scheme;
}

export default function PrintableHandout({ scheme }: PrintableHandoutProps) {
  return (
    <div className="bg-white p-8 max-w-3xl mx-auto border-2 border-gray-200">
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
        <h1 className="text-3xl font-bold text-black uppercase tracking-wider">NagarikSaathi</h1>
        <p className="text-gray-600 font-medium">Government Scheme Assistance Handout</p>
      </div>
      
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{scheme.name}</h2>
        <p className="text-gray-700 leading-relaxed text-justify">{scheme.overview}</p>
      </div>

      <div className="grid grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-3">Key Benefits</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-800">
            {scheme.benefits.map((benefit, i) => (
              <li key={i}>{benefit}</li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-3">Eligibility</h3>
          <ul className="list-disc pl-5 space-y-2 text-gray-800">
            {scheme.eligibility.map((criteria, i) => (
              <li key={i}>{criteria}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 border-b border-gray-300 pb-2 mb-3">Required Documents</h3>
        <div className="grid grid-cols-2 gap-2">
          {scheme.documents.map((doc, i) => (
            <div key={i} className="flex items-center text-gray-800">
              <div className="w-4 h-4 border border-gray-500 mr-2 rounded-sm"></div>
              {doc}
            </div>
          ))}
        </div>
      </div>

      <div className="flex justify-between items-center bg-gray-100 p-6 rounded-lg mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">How to Apply</h3>
          <ol className="list-decimal pl-5 space-y-1 text-gray-800">
            {scheme.applicationProcess.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
          <p className="mt-4 font-bold text-gray-800">
            Helpline: <span className="text-blue-700">{scheme.helpline}</span>
          </p>
        </div>
        
        <div className="text-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col items-center">
          <QRCodeSVG value={scheme.portalUrl} size={120} />
          <p className="text-xs text-gray-500 mt-2 font-medium">Scan to Apply</p>
        </div>
      </div>
      
      <div className="text-center text-sm text-gray-500 border-t border-gray-300 pt-4 mt-auto">
        This document was generated via NagarikSaathi - Empowering citizens with accessible scheme information.
      </div>
    </div>
  );
}
