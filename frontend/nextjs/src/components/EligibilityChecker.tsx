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
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-100 p-6 md:p-8">
      <div className="border-b border-slate-100 pb-5 mb-6">
        <h3 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-6 bg-indigo-600 rounded-full"></span>
          Check Eligibility
        </h3>
        <p className="text-gray-500 text-sm mt-1 font-medium">Fill in your profile details to discover personalized government welfare schemes.</p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Section 1: Demographics */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>👤</span> Personal Demographics
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">State</label>
                <select name="state" value={formData.state} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select State</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                  <option value="Assam">Assam</option>
                  <option value="Bihar">Bihar</option>
                  <option value="Chhattisgarh">Chhattisgarh</option>
                  <option value="Goa">Goa</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Haryana">Haryana</option>
                  <option value="Himachal Pradesh">Himachal Pradesh</option>
                  <option value="Jharkhand">Jharkhand</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Madhya Pradesh">Madhya Pradesh</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Manipur">Manipur</option>
                  <option value="Meghalaya">Meghalaya</option>
                  <option value="Mizoram">Mizoram</option>
                  <option value="Nagaland">Nagaland</option>
                  <option value="Odisha">Odisha</option>
                  <option value="Punjab">Punjab</option>
                  <option value="Rajasthan">Rajasthan</option>
                  <option value="Sikkim">Sikkim</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Telangana">Telangana</option>
                  <option value="Tripura">Tripura</option>
                  <option value="Uttarakhand">Uttarakhand</option>
                  <option value="Uttar Pradesh">Uttar Pradesh</option>
                  <option value="West Bengal">West Bengal</option>
                  <option value="Andaman and Nicobar Islands">Andaman & Nicobar Islands</option>
                  <option value="Chandigarh">Chandigarh</option>
                  <option value="Dadra and Nagar Haveli and Daman and Diu">Dadra & Nagar Haveli and Daman & Diu</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Jammu and Kashmir">Jammu & Kashmir</option>
                  <option value="Ladakh">Ladakh</option>
                  <option value="Lakshadweep">Lakshadweep</option>
                  <option value="Puducherry">Puducherry</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">Gender</label>
                <select name="gender" value={formData.gender} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="All">All / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">Marital Status</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select Status</option>
                  <option value="Single">Single</option>
                  <option value="Married">Married</option>
                  <option value="Widowed">Widowed</option>
                  <option value="All">All / Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">Caste Category</label>
                <select name="caste" value={formData.caste} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select Category</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Assets & Occupation */}
          <div className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <span>🌾</span> Assets & Occupation
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">Occupation</label>
                <select name="occupation" value={formData.occupation} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select Occupation</option>
                  <option value="Farmer">Farmer</option>
                  <option value="Student">Student</option>
                  <option value="Labourer">Labourer / Worker</option>
                  <option value="Artisan">Artisan / Self-Employed</option>
                  <option value="Business Owner">Business Owner / MSME</option>
                  <option value="Unemployed">Unemployed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">Land Ownership</label>
                <select name="land" value={formData.land} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select Land Type</option>
                  <option value="0">Landless (0 Acres)</option>
                  <option value="2">Marginal (Up to 2.5 Acres)</option>
                  <option value="5">Small (2.5 to 5 Acres)</option>
                  <option value="10">Large (More than 5 Acres)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-1.5 pl-1">Annual Income (₹)</label>
                <select name="income" value={formData.income} onChange={handleChange} className="w-full p-3 bg-white border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-600 outline-none text-gray-800 text-sm font-semibold transition-all shadow-sm">
                  <option value="">Select Income Range</option>
                  <option value="45000">Below 50,000</option>
                  <option value="90000">50,000 - 1,00,000</option>
                  <option value="200000">1,00,000 - 2,50,000</option>
                  <option value="500000">Above 2,50,000</option>
                </select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Consent Checkbox and Submit Button */}
        <div className="space-y-4 pt-2">
          <div className="flex items-start gap-3 bg-amber-50/50 border border-amber-200/60 p-4.5 rounded-2xl text-xs text-amber-950 font-medium leading-relaxed shadow-sm">
            <input 
              type="checkbox" 
              id="dpdp-consent" 
              required 
              className="mt-1 w-4 h-4 rounded border-amber-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
            />
            <label htmlFor="dpdp-consent" className="cursor-pointer select-none text-gray-700">
              <strong className="text-amber-800 block mb-0.5">DPDP Act Consent:</strong> I hereby consent to the ephemeral processing of my profile details (state, occupation, gender, marital status, land ownership, income, caste) strictly for the purpose of discovering eligible government schemes. I understand that my queries will be processed in-memory and will not be logged to long-term request databases.
            </label>
          </div>
          
          <button 
            type="submit" 
            className="w-full bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-850 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-[1.005] transition-all duration-200 cursor-pointer text-sm tracking-wide uppercase"
          >
            Check Eligible Schemes
          </button>
        </div>
      </form>
    </div>
  );
}
