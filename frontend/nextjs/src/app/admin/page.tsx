"use client";
import React from 'react';
import { Users, FileText, Search, Activity, Settings } from 'lucide-react';

export default function AdminDashboard() {
  const stats = [
    { label: "Total Queries", value: "1,248", icon: <Search className="w-6 h-6 text-blue-600" /> },
    { label: "Schemes Matched", value: "3,450", icon: <Activity className="w-6 h-6 text-green-600" /> },
    { label: "Citizens Assisted", value: "856", icon: <Users className="w-6 h-6 text-indigo-600" /> },
    { label: "Handouts Generated", value: "624", icon: <FileText className="w-6 h-6 text-orange-600" /> }
  ];

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      {/* Sidebar */}
      <div className="w-64 bg-white border-r border-gray-200 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold">N</div>
            <h1 className="text-xl font-bold text-gray-900 tracking-tight">NagarikSaathi</h1>
          </div>
          <p className="text-xs text-gray-500 mt-1">CSC Operator Dashboard</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <a href="#" className="flex items-center gap-3 bg-blue-50 text-blue-700 px-3 py-2 rounded-md font-medium">
            <Activity className="w-5 h-5" /> Dashboard
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md font-medium">
            <Users className="w-5 h-5" /> Citizens Log
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md font-medium">
            <FileText className="w-5 h-5" /> Scheme Database
          </a>
          <a href="#" className="flex items-center gap-3 text-gray-700 hover:bg-gray-100 px-3 py-2 rounded-md font-medium">
            <Settings className="w-5 h-5" /> Settings
          </a>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm sticky top-0 z-10 px-8 py-4 flex justify-between items-center border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800">Overview</h2>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Welcome, <strong>VLE Operator</strong></span>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
        </header>
        
        <main className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex items-center gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">{stat.icon}</div>
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">Recent Citizen Queries</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-6 py-3 font-medium">Citizen</th>
                      <th className="px-6 py-3 font-medium">Query Type</th>
                      <th className="px-6 py-3 font-medium">Matched Schemes</th>
                      <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 text-gray-800">
                    <tr>
                      <td className="px-6 py-4">Ramesh Kumar</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">Voice</span></td>
                      <td className="px-6 py-4">PM-KISAN</td>
                      <td className="px-6 py-4 text-green-600 font-medium">Handout Printed</td>
                    </tr>
                    <tr>
                      <td className="px-6 py-4">Sunita Devi</td>
                      <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs font-medium">Form</span></td>
                      <td className="px-6 py-4">Ayushman Bharat</td>
                      <td className="px-6 py-4 text-gray-500">Assistance in Progress</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="font-semibold text-gray-900">System Status</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">API Health (Gemini)</span>
                    <span className="text-green-600 font-medium">Online</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Database Connection</span>
                    <span className="text-green-600 font-medium">Stable</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
