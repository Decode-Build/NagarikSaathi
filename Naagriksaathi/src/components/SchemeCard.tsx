"use client";
import React from 'react';
import { Scheme } from '../data/schemes';
import { FileText, Printer, ExternalLink } from 'lucide-react';

interface SchemeCardProps {
  scheme: Scheme;
  onPrint: (scheme: Scheme) => void;
}

export default function SchemeCard({ scheme, onPrint }: SchemeCardProps) {
  return (
    <div className="bg-white rounded-xl shadow border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-6">
        <div className="flex justify-between items-start">
          <h3 className="text-xl font-bold text-gray-900 mb-2">{scheme.name}</h3>
          <span className="bg-green-100 text-green-800 text-xs font-semibold px-2.5 py-0.5 rounded flex items-center">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
            Match
          </span>
        </div>
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {scheme.overview}
        </p>
        
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-800 mb-1 flex items-center">
            <FileText size={16} className="mr-1 text-blue-600" /> Key Benefits
          </h4>
          <ul className="text-sm text-gray-600 list-disc pl-5 space-y-1">
            {scheme.benefits.slice(0, 2).map((benefit, index) => (
              <li key={index}>{benefit}</li>
            ))}
          </ul>
        </div>
        
        <div className="flex gap-3 mt-6">
          <button 
            onClick={() => onPrint(scheme)}
            className="flex-1 bg-gray-100 text-gray-800 py-2 px-4 rounded font-medium flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <Printer size={18} className="mr-2" />
            Print Handout
          </button>
          <a 
            href={scheme.portalUrl} 
            target="_blank" 
            rel="noreferrer"
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded font-medium flex items-center justify-center hover:bg-blue-700 transition-colors"
          >
            Apply Now
            <ExternalLink size={18} className="ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
}
