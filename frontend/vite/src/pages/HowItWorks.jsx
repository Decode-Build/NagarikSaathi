import React from 'react';
import { ArrowRight, Search, List, MessageSquare, Printer, CheckCircle } from 'lucide-react';
import { useLanguage } from "../i18n/LanguageContext";

export default function HowItWorks() {
  const { lang } = useLanguage();

  const steps = [
    {
      icon: <Search className="w-8 h-8 text-blue-600" />,
      title: lang === 'hi' ? '1. नागरिक का प्रोफाइल दर्ज करें' : '1. Enter Citizen Profile',
      desc: lang === 'hi' 
        ? 'स्क्रीनर टूल में जाकर नागरिक की आयु, आय और व्यवसाय जैसे विवरण दर्ज करें।' 
        : 'Go to the Screener tool and enter details like age, income, and occupation.'
    },
    {
      icon: <List className="w-8 h-8 text-amber-600" />,
      title: lang === 'hi' ? '2. योजनाएं खोजें और फ़िल्टर करें' : '2. Discover & Filter Schemes',
      desc: lang === 'hi' 
        ? 'सटीक मेल खाने वाली योजनाओं की सूची प्राप्त करें। राज्य और श्रेणी के अनुसार फ़िल्टर करें।' 
        : 'Get a list of exact matching schemes. Filter them further by State and Category.'
    },
    {
      icon: <MessageSquare className="w-8 h-8 text-green-600" />,
      title: lang === 'hi' ? '3. एआई साथी से पूछें' : '3. Ask AI Saathi',
      desc: lang === 'hi' 
        ? 'यदि कोई संदेह हो, तो हमारे एआई चैटबॉट से अपनी भाषा या आवाज़ में सीधे प्रश्न पूछें।' 
        : 'If in doubt, ask our AI chatbot specific queries directly in your language or voice.'
    },
    {
      icon: <Printer className="w-8 h-8 text-purple-600" />,
      title: lang === 'hi' ? '4. चेकलिस्ट प्रिंट करें' : '4. Print Checklist',
      desc: lang === 'hi' 
        ? 'नागरिक के नाम के साथ आवेदन करने के लिए आवश्यक दस्तावेजों की चेकलिस्ट प्रिंट करें और उन्हें दें।' 
        : 'Print out the required documents checklist personalized with the citizen\'s name and hand it to them.'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-fade-in py-12 px-6">
      <div className="text-center space-y-4">
        <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-display">
          {lang === 'hi' ? 'नागरिक साथी कैसे काम करता है?' : 'How NagrikSaathi Works'}
        </h2>
        <p className="text-lg text-slate-500 max-w-2xl mx-auto">
          {lang === 'hi' 
            ? 'हमारा प्लेटफ़ॉर्म सीएससी ऑपरेटरों को नागरिकों को सरकारी योजनाओं से तेज़ी से जोड़ने में मदद करने के लिए डिज़ाइन किया गया है।' 
            : 'Our platform is designed to help CSC Operators quickly and accurately match citizens with government welfare schemes.'}
        </p>
      </div>

      <div className="space-y-8 relative before:absolute before:inset-0 before:ml-12 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-1 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
        {steps.map((step, idx) => (
          <div key={idx} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
            <div className="flex items-center justify-center w-24 h-24 rounded-full border-4 border-white bg-slate-50 shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
              {step.icon}
            </div>
            
            <div className="w-[calc(100%-6rem)] md:w-[calc(50%-3rem)] p-6 rounded-2xl bg-white border border-slate-200 shadow-sm transition-all hover:shadow-md">
              <div className="flex flex-col gap-2">
                <h3 className="text-xl font-bold text-slate-900">{step.title}</h3>
                <p className="text-slate-600 leading-relaxed font-medium">{step.desc}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center pt-8">
        <div className="inline-flex items-center gap-2 px-6 py-3 bg-green-50 text-green-700 rounded-xl border border-green-200 font-bold shadow-sm">
          <CheckCircle className="w-5 h-5" />
          {lang === 'hi' ? 'आप तैयार हैं! मेनू से शुरुआत करें।' : 'You are all set! Get started from the menu.'}
        </div>
      </div>
    </div>
  );
}
