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
  lang?: 'en' | 'hi';
}

const eligibilityTranslations = {
  en: {
    title: "Check Eligibility",
    subtitle: "Fill these details to get personalized scheme recommendations.",
    labelState: "State",
    labelOccupation: "Occupation",
    labelGender: "Gender",
    labelMarital: "Marital Status",
    labelLand: "Land Ownership",
    labelIncome: "Annual Income (₹)",
    labelCaste: "Caste Category",
    selectState: "Select State",
    selectOccupation: "Select Occupation",
    selectGender: "Select Gender",
    selectMarital: "Select Status",
    selectLand: "Select Land Type",
    selectIncome: "Select Income Range",
    selectCaste: "Select Category",
    oFarmer: "Farmer",
    oStudent: "Student",
    oLabourer: "Labourer / Worker",
    oArtisan: "Artisan / Self-Employed",
    oBusiness: "Business Owner / MSME",
    oUnemployed: "Unemployed",
    oMale: "Male",
    oFemale: "Female",
    oOther: "All / Other",
    oSingle: "Single",
    oMarried: "Married",
    oWidowed: "Widowed",
    oLandless: "Landless (0 Acres)",
    oMarginal: "Marginal (Up to 2.5 Acres)",
    oSmall: "Small (2.5 to 5 Acres)",
    oLarge: "Large (More than 5 Acres)",
    oIncome1: "Below 50,000",
    oIncome2: "50,000 - 1,00,000",
    oIncome3: "1,00,000 - 2,50,000",
    oIncome4: "Above 2,50,000",
    oGeneral: "General",
    consentLabel: "DPDP Act Consent:",
    consentText: "I hereby consent to the ephemeral processing of my profile details (state, occupation, gender, marital status, land ownership, income, caste) strictly for the purpose of discovering eligible government schemes. I understand that my queries will be processed in-memory and will not be logged to long-term request databases.",
    submitBtn: "Check Eligible Schemes",
  },
  hi: {
    title: "पात्रता जांचें",
    subtitle: "व्यक्तिगत योजना सुझाव पाने के लिए ये विवरण भरें।",
    labelState: "राज्य",
    labelOccupation: "व्यवसाय",
    labelGender: "लिंग",
    labelMarital: "वैवाहिक स्थिति",
    labelLand: "भूमि स्वामित्व",
    labelIncome: "वार्षिक आय (₹)",
    labelCaste: "जाति वर्ग",
    selectState: "राज्य चुनें",
    selectOccupation: "व्यवसाय चुनें",
    selectGender: "लिंग चुनें",
    selectMarital: "स्थिति चुनें",
    selectLand: "भूमि प्रकार चुनें",
    selectIncome: "आय सीमा चुनें",
    selectCaste: "वर्ग चुनें",
    oFarmer: "किसान",
    oStudent: "छात्र / छात्रा",
    oLabourer: "मजदूर / श्रमिक",
    oArtisan: "कारीगर / स्वरोजगार",
    oBusiness: "व्यापारी / एमएसएमई",
    oUnemployed: "बेरोजगार",
    oMale: "पुरुष",
    oFemale: "महिला",
    oOther: "सभी / अन्य",
    oSingle: "अविवाहित",
    oMarried: "विवाहित",
    oWidowed: "विधवा / विधुर",
    oLandless: "भूमिहीन (0 एकड़)",
    oMarginal: "सीमांत (2.5 एकड़ तक)",
    oSmall: "लघु (2.5 से 5 एकड़)",
    oLarge: "बड़ा (5 एकड़ से अधिक)",
    oIncome1: "50,000 से कम",
    oIncome2: "50,000 - 1,00,000",
    oIncome3: "1,00,000 - 2,50,000",
    oIncome4: "2,50,000 से अधिक",
    oGeneral: "सामान्य",
    consentLabel: "डीपीडीपी अधिनियम सहमति:",
    consentText: "मैं एतद्द्वारा सरकारी योजनाओं की पात्रता जानने के उद्देश्य से अपने प्रोफ़ाइल विवरण (राज्य, व्यवसाय, लिंग, वैवाहिक स्थिति, भूमि स्वामित्व, आय, जाति) के अस्थायी प्रसंस्करण के लिए सहमति देता/देती हूँ। मैं समझता/समझती हूँ कि मेरी जानकारी केवल मेमोरी में संसाधित की जाएगी और किसी डेटाबेस में संग्रहीत नहीं की जाएगी।",
    submitBtn: "पात्र योजनाएं देखें",
  }
};

const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand",
  "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur",
  "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura",
  "Uttarakhand", "Uttar Pradesh", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh",
  "Dadra and Nagar Haveli and Daman and Diu", "Delhi",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export default function EligibilityChecker({ onCheck, lang = 'en' }: EligibilityCheckerProps) {
  const t = eligibilityTranslations[lang];

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

  const inputClass = "w-full p-2 border border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 text-black text-sm";

  return (
    <div className="w-full bg-white rounded-xl shadow-md border border-gray-100 p-6">
      <h3 className="text-xl font-semibold mb-1 text-gray-800">{t.title}</h3>
      <p className="text-gray-500 text-sm mb-6">{t.subtitle}</p>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* State */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelState}</label>
          <select name="state" value={formData.state} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectState}</option>
            {STATES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Occupation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelOccupation}</label>
          <select name="occupation" value={formData.occupation} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectOccupation}</option>
            <option value="Farmer">{t.oFarmer}</option>
            <option value="Student">{t.oStudent}</option>
            <option value="Labourer">{t.oLabourer}</option>
            <option value="Artisan">{t.oArtisan}</option>
            <option value="Business Owner">{t.oBusiness}</option>
            <option value="Unemployed">{t.oUnemployed}</option>
          </select>
        </div>

        {/* Gender */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelGender}</label>
          <select name="gender" value={formData.gender} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectGender}</option>
            <option value="Male">{t.oMale}</option>
            <option value="Female">{t.oFemale}</option>
            <option value="All">{t.oOther}</option>
          </select>
        </div>

        {/* Marital Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelMarital}</label>
          <select name="maritalStatus" value={formData.maritalStatus} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectMarital}</option>
            <option value="Single">{t.oSingle}</option>
            <option value="Married">{t.oMarried}</option>
            <option value="Widowed">{t.oWidowed}</option>
            <option value="All">{t.oOther}</option>
          </select>
        </div>

        {/* Land */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelLand}</label>
          <select name="land" value={formData.land} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectLand}</option>
            <option value="0">{t.oLandless}</option>
            <option value="2">{t.oMarginal}</option>
            <option value="5">{t.oSmall}</option>
            <option value="10">{t.oLarge}</option>
          </select>
        </div>

        {/* Income */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelIncome}</label>
          <select name="income" value={formData.income} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectIncome}</option>
            <option value="45000">{t.oIncome1}</option>
            <option value="90000">{t.oIncome2}</option>
            <option value="200000">{t.oIncome3}</option>
            <option value="500000">{t.oIncome4}</option>
          </select>
        </div>

        {/* Caste */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t.labelCaste}</label>
          <select name="caste" value={formData.caste} onChange={handleChange} className={inputClass}>
            <option value="">{t.selectCaste}</option>
            <option value="General">{t.oGeneral}</option>
            <option value="OBC">OBC</option>
            <option value="SC">SC</option>
            <option value="ST">ST</option>
          </select>
        </div>

        {/* Submit + DPDP consent */}
        <div className="md:col-span-2 mt-2">
          <div className="flex items-start gap-2.5 bg-orange-50/55 border border-orange-150 p-3 rounded-lg mb-4 text-xs text-orange-950 font-medium leading-relaxed">
            <input 
              type="checkbox" 
              id="dpdp-consent" 
              required 
              className="mt-0.5 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
            />
            <label htmlFor="dpdp-consent" className="cursor-pointer select-none">
              <strong>{t.consentLabel}</strong> {t.consentText}
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold py-3 px-4 rounded-xl hover:from-orange-700 hover:to-red-700 transition-all shadow-md"
          >
            {t.submitBtn}
          </button>
        </div>
      </form>
    </div>
  );
}
