"use client";
import React, { useState } from 'react';

export interface EligibilityData {
  state: string;
  occupation: string;
  gender: string;
  maritalStatus: string;
  land: string;
  income: string;
  caste: string;
}

interface EligibilityCheckerProps {
  onCheck: (data: EligibilityData) => void;
}

export default function EligibilityChecker({ onCheck }: EligibilityCheckerProps) {
  const [formData, setFormData] = useState<EligibilityData>({
    state: '',
    occupation: '',
    gender: '',
    maritalStatus: '',
    land: '',
    income: '',
    caste: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCheck(formData);
  };

  return (
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <h3 className="text-xl font-semibold mb-4 text-gray-800">Check Eligibility</h3>
      <p className="text-gray-500 text-sm mb-6">Fill these details to get personalized scheme recommendations.</p>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">State</label>
          <select name="state" value={formData.state} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select State</option>
            <option value="madhya-pradesh">Madhya Pradesh</option>
            <option value="uttar-pradesh">Uttar Pradesh</option>
            <option value="maharashtra">Maharashtra</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
          <select name="occupation" value={formData.occupation} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select Occupation</option>
            <option value="farmer">Farmer</option>
            <option value="student">Student</option>
            <option value="unemployed">Unemployed</option>
            <option value="business">Business</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select Gender</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="transgender">Transgender</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Marital Status</label>
          <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select Status</option>
            <option value="single">Single</option>
            <option value="married">Married</option>
            <option value="widowed">Widowed</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Land Ownership</label>
          <select name="land" value={formData.land} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select Land Type</option>
            <option value="none">Landless</option>
            <option value="marginal">Marginal (Up to 1 Hectare)</option>
            <option value="small">Small (1-2 Hectares)</option>
            <option value="large">Large (More than 2 Hectares)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Annual Income (₹)</label>
          <select name="income" value={formData.income} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select Income Range</option>
            <option value="<50000">Below 50,000</option>
            <option value="50000-100000">50,000 - 1,00,000</option>
            <option value="100000-250000">1,00,000 - 2,50,000</option>
            <option value=">250000">Above 2,50,000</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Caste Category</label>
          <select name="caste" value={formData.caste} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-black">
            <option value="">Select Category</option>
            <option value="general">General</option>
            <option value="obc">OBC</option>
            <option value="sc">SC</option>
            <option value="st">ST</option>
          </select>
        </div>
        
        <div className="md:col-span-2 mt-2">
          <button type="submit" className="w-full bg-indigo-600 text-white font-medium py-3 px-4 rounded-md hover:bg-indigo-700 transition-colors">
            Check Eligible Schemes
          </button>
        </div>
      </form>
    </div>
  );
}
