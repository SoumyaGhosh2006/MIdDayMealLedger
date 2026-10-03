import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import AudioRecorder from './components/AudioRecorder';
import ReviewTable from './components/ReviewTable';
import LedgerHistory from './components/LedgerHistory';
import AdminNotesPlaceholder from './components/AdminNotesPlaceholder';
import { api } from './api';
import { CheckCircle2, AlertTriangle, X, PlusCircle } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('daily-entry');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [currentDraft, setCurrentDraft] = useState(null);
  const [notification, setNotification] = useState(null);

  // Health check on mount and interval
  useEffect(() => {
    let isMounted = true;

    const performHealthCheck = async () => {
      try {
        await api.checkHealth();
        if (isMounted) setBackendStatus('online');
      } catch (err) {
        if (isMounted) setBackendStatus('offline');
      }
    };

    performHealthCheck();
    const interval = setInterval(performHealthCheck, 30000); // 30s probe

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleVoiceProcessed = ({ transcription, data }) => {
    setCurrentDraft({ transcription, data });
    setNotification(null);
  };

  const handleStartManualEntry = () => {
    setCurrentDraft({
      transcription: null,
      data: {
        date: new Date().toISOString().split('T')[0],
        menu: '',
        egg: '0.00',
        oil: '0.00',
        dal: '0.00',
        soya_potato: '0.00',
        masala: '0.00',
        grocery: '0.00',
        veg: '0.00',
        fuel: '0.00',
        class_5: 0,
        class_6: 0,
        class_7: 0,
        class_8: 0,
        opening_balance_rice: null,
        daily_count: null,
        closing_balance_rice: null,
      },
    });
  };

  const handleSaveSuccess = (savedRecord) => {
    setCurrentDraft(null);
    setNotification({
      type: 'success',
      message: `Ledger entry for ${savedRecord.date} successfully committed to database! Total: ₹${parseFloat(savedRecord.total_expense).toFixed(2)}`,
    });
    // Switch to history tab to see the saved record
    setActiveTab('history');
  };

  const handleDiscardDraft = () => {
    setCurrentDraft(null);
  };

  const handleError = (errorMsg) => {
    setNotification({
      type: 'error',
      message: errorMsg,
    });
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans antialiased text-slate-800">
      {/* Top Institutional Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
      />

      {/* Global Toast Notification */}
      {notification && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-4">
          <div
            className={`p-4 rounded-xl border flex items-center justify-between shadow-sm transition-all ${
              notification.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {notification.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
              )}
              <span className="text-xs sm:text-sm font-semibold">{notification.message}</span>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6 sm:py-8">
        {activeTab === 'daily-entry' && (
          <div className="space-y-6">
            {currentDraft ? (
              <ReviewTable
                initialData={currentDraft.data}
                transcription={currentDraft.transcription}
                onSaveSuccess={handleSaveSuccess}
                onCancel={handleDiscardDraft}
              />
            ) : (
              <div className="space-y-4">
                <AudioRecorder
                  onVoiceProcessed={handleVoiceProcessed}
                  onError={handleError}
                />

                <div className="flex justify-center">
                  <button
                    type="button"
                    onClick={handleStartManualEntry}
                    className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-emerald-700 bg-white hover:bg-slate-50 border border-slate-300 px-4 py-2 rounded-lg shadow-2xs transition-colors"
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    <span>Or Create Manual Entry Without Voice Dictation</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && <LedgerHistory />}

        {activeTab === 'admin-notes' && <AdminNotesPlaceholder />}
      </main>

      {/* Institutional Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs border-t border-slate-800 py-6 mt-12">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <p className="font-semibold text-slate-300 m-0">
              PM POSHAN National Scheme for Mid-Day Meals in Schools
            </p>
            <p className="text-[11px] text-slate-500 m-0 mt-0.5">
              Automated Financial Ledger & Voice-Driven Record System • Production Release v1.0
            </p>
          </div>
          <div className="text-[11px] text-slate-500">
            Compliant with Government School Food & Financial Audit Guidelines
          </div>
        </div>
      </footer>
    </div>
  );
}