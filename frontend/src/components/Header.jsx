import React from 'react';
import { BookOpen, Mic, FileText } from 'lucide-react';

export default function Header({ activeTab, setActiveTab }) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0 p-0">
              SchoolDesk
            </h1>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center bg-slate-800/80 p-1 rounded-lg border border-slate-700/60 text-xs sm:text-sm w-full sm:w-auto justify-center">
          <button
            onClick={() => setActiveTab('daily-entry')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'daily-entry'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <Mic className="w-4 h-4" />
            <span>Daily Entry</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Ledger History</span>
          </button>

          {/* Admin Notes & PDF Scanner Tab */}
          <button
            onClick={() => setActiveTab('admin-notes')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
              activeTab === 'admin-notes'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Admin Notes</span>
          </button>
        </nav>
      </div>
    </header>
  );
}

