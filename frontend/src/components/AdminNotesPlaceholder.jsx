import React from 'react';
import { Clock, ShieldAlert, Sparkles, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export default function AdminNotesPlaceholder() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-slate-900 p-6 sm:p-8 text-white">
        <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
          <Clock className="w-4 h-4" />
          <span>Institutional Module • Feature Preview</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white m-0">
          Principal's Administrative Notes & Voice Memos
        </h2>
        <p className="text-slate-200 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
          Upcoming extension designed for government school headmasters to dictate official inspection remarks, ration stock replenishment requests, and monthly midday meal compliance logs.
        </p>
      </div>

      {/* Feature roadmap preview */}
      <div className="p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold mb-3">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-800 m-0">Inspection Dictation</h3>
            <p className="text-xs text-slate-600 mt-1 leading-normal">
              Record voice remarks during block education officer (BEO) or district health team visits with automatic timestamping.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-800 flex items-center justify-center font-bold mb-3">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-800 m-0">Stock Alert Memorandums</h3>
            <p className="text-xs text-slate-600 mt-1 leading-normal">
              Dictate rice and ration shortage notices that auto-format into official government dispatch drafts.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold mb-3">
              3
            </div>
            <h3 className="text-sm font-bold text-slate-800 m-0">Monthly Audit Export</h3>
            <p className="text-xs text-slate-600 mt-1 leading-normal">
              Export consolidated notes and registers directly into government PM POSHAN portal formats.
            </p>
          </div>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs sm:text-sm text-amber-900">
          <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Scheduled Development:</span> This module will interface with the same AI voice engine and will be activated in the next development cycle. Current Phase 4 focuses on daily financial and attendance ledger verification.
          </div>
        </div>
      </div>
    </div>
  );
}
