import React from 'react';
import { BookOpen, Mic, FileText, CheckCircle2, AlertCircle, Clock } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, backendStatus }) {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30">
      <div className="max-w-6xl mx-auto px-4 py-3 sm:py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Branding & Status */}
        <div className="flex items-center justify-between w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md">
              <BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white m-0 p-0">
                Midday Meal Ledger
              </h1>
            </div>
          </div>

          {/* Mobile status indicator */}
          <div className="sm:hidden flex items-center gap-1.5 text-xs">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 text-[11px]">
              {backendStatus === 'online' ? 'Online' : 'Offline'}
            </span>
          </div>
        </div>

        {/* Navigation Tabs & Desktop Status */}
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
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

            {/* Extensibility Placeholder: Admin Notes (Coming Soon) */}
            <button
              onClick={() => setActiveTab('admin-notes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                activeTab === 'admin-notes'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/30'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span className="flex items-center gap-1">
                Admin Notes
                <span className="hidden md:inline text-[9px] bg-amber-900/60 text-amber-300 px-1 rounded border border-amber-700/50">
                  Soon
                </span>
              </span>
            </button>
          </nav>

          {/* Desktop status badge */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-700 text-xs">
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  backendStatus === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <span className="text-slate-300">
                {backendStatus === 'online' ? 'API Connected' : 'Backend Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
