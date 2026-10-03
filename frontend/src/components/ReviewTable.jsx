import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle, 
  RotateCcw, 
  AlertCircle, 
  FileText, 
  DollarSign, 
  Users, 
  Package, 
  Utensils, 
  Calendar,
  Save,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { api, extractText } from '../api';

const EXPENSE_FIELDS = [
  { key: 'egg', label: 'Egg', defaultVal: '0.00' },
  { key: 'oil', label: 'Oil', defaultVal: '0.00' },
  { key: 'dal', label: 'Dal (Pulses)', defaultVal: '0.00' },
  { key: 'soya_potato', label: 'Soya / Potato', defaultVal: '0.00' },
  { key: 'masala', label: 'Masala & Spices', defaultVal: '0.00' },
  { key: 'grocery', label: 'Grocery / Salt', defaultVal: '0.00' },
  { key: 'veg', label: 'Fresh Vegetables', defaultVal: '0.00' },
  { key: 'fuel', label: 'Fuel / LPG / Firewood', defaultVal: '0.00' },
];

const ATTENDANCE_FIELDS = [
  { key: 'class_5', label: 'Class 5' },
  { key: 'class_6', label: 'Class 6' },
  { key: 'class_7', label: 'Class 7' },
  { key: 'class_8', label: 'Class 8' },
];

export default function ReviewTable({ 
  initialData, 
  transcription, 
  onSaveSuccess, 
  onCancel 
}) {
  const [formData, setFormData] = useState(() => {
    const d = initialData || {};
    return {
      date: d.date || new Date().toISOString().split('T')[0],
      menu: d.menu || '',
      egg: d.egg != null ? String(d.egg) : '0.00',
      oil: d.oil != null ? String(d.oil) : '0.00',
      dal: d.dal != null ? String(d.dal) : '0.00',
      soya_potato: d.soya_potato != null ? String(d.soya_potato) : '0.00',
      masala: d.masala != null ? String(d.masala) : '0.00',
      grocery: d.grocery != null ? String(d.grocery) : '0.00',
      veg: d.veg != null ? String(d.veg) : '0.00',
      fuel: d.fuel != null ? String(d.fuel) : '0.00',
      class_5: d.class_5 != null ? String(d.class_5) : '0',
      class_6: d.class_6 != null ? String(d.class_6) : '0',
      class_7: d.class_7 != null ? String(d.class_7) : '0',
      class_8: d.class_8 != null ? String(d.class_8) : '0',
      opening_balance_rice: d.opening_balance_rice != null ? String(d.opening_balance_rice) : '',
      daily_count: d.daily_count != null ? String(d.daily_count) : '',
      closing_balance_rice: d.closing_balance_rice != null ? String(d.closing_balance_rice) : '',
    };
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isReExtracting, setIsReExtracting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [editableTranscript, setEditableTranscript] = useState(transcription || '');

  // Synchronize transcript if prop updates
  useEffect(() => {
    if (transcription != null) {
      setEditableTranscript(transcription);
    }
  }, [transcription]);

  // Synchronize when initialData prop changes
  useEffect(() => {
    if (initialData) {
      setFormData({
        date: initialData.date || new Date().toISOString().split('T')[0],
        menu: initialData.menu || '',
        egg: initialData.egg != null ? String(initialData.egg) : '0.00',
        oil: initialData.oil != null ? String(initialData.oil) : '0.00',
        dal: initialData.dal != null ? String(initialData.dal) : '0.00',
        soya_potato: initialData.soya_potato != null ? String(initialData.soya_potato) : '0.00',
        masala: initialData.masala != null ? String(initialData.masala) : '0.00',
        grocery: initialData.grocery != null ? String(initialData.grocery) : '0.00',
        veg: initialData.veg != null ? String(initialData.veg) : '0.00',
        fuel: initialData.fuel != null ? String(initialData.fuel) : '0.00',
        class_5: initialData.class_5 != null ? String(initialData.class_5) : '0',
        class_6: initialData.class_6 != null ? String(initialData.class_6) : '0',
        class_7: initialData.class_7 != null ? String(initialData.class_7) : '0',
        class_8: initialData.class_8 != null ? String(initialData.class_8) : '0',
        opening_balance_rice: initialData.opening_balance_rice != null ? String(initialData.opening_balance_rice) : '',
        daily_count: initialData.daily_count != null ? String(initialData.daily_count) : '',
        closing_balance_rice: initialData.closing_balance_rice != null ? String(initialData.closing_balance_rice) : '',
      });
    }
  }, [initialData]);

  const handleFieldChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Live client-side calculation for Total Expense
  const calculatedTotalExpense = useMemo(() => {
    const sum = EXPENSE_FIELDS.reduce((acc, field) => {
      const val = parseFloat(formData[field.key]) || 0;
      return acc + val;
    }, 0);
    return sum.toFixed(2);
  }, [formData]);

  // Live client-side calculation for Attendance
  const calculatedAttendance = useMemo(() => {
    const c5 = parseInt(formData.class_5, 10) || 0;
    const c6 = parseInt(formData.class_6, 10) || 0;
    const c7 = parseInt(formData.class_7, 10) || 0;
    const c8 = parseInt(formData.class_8, 10) || 0;
    const total_6_8 = c6 + c7 + c8;
    const total = c5 + total_6_8;
    return { c5, c6, c7, c8, total_6_8, total };
  }, [formData.class_5, formData.class_6, formData.class_7, formData.class_8]);

  const handleReExtract = async () => {
    if (!editableTranscript.trim()) return;
    setIsReExtracting(true);
    setErrorMessage(null);

    try {
      const extractFn = api?.extractText || extractText;
      const extracted = await extractFn(editableTranscript.trim(), formData.date);
      setFormData({
        date: extracted.date || formData.date,
        menu: extracted.menu || '',
        egg: extracted.egg != null ? String(extracted.egg) : '0.00',
        oil: extracted.oil != null ? String(extracted.oil) : '0.00',
        dal: extracted.dal != null ? String(extracted.dal) : '0.00',
        soya_potato: extracted.soya_potato != null ? String(extracted.soya_potato) : '0.00',
        masala: extracted.masala != null ? String(extracted.masala) : '0.00',
        grocery: extracted.grocery != null ? String(extracted.grocery) : '0.00',
        veg: extracted.veg != null ? String(extracted.veg) : '0.00',
        fuel: extracted.fuel != null ? String(extracted.fuel) : '0.00',
        class_5: extracted.class_5 != null ? String(extracted.class_5) : '0',
        class_6: extracted.class_6 != null ? String(extracted.class_6) : '0',
        class_7: extracted.class_7 != null ? String(extracted.class_7) : '0',
        class_8: extracted.class_8 != null ? String(extracted.class_8) : '0',
        opening_balance_rice: extracted.opening_balance_rice != null ? String(extracted.opening_balance_rice) : '',
        daily_count: extracted.daily_count != null ? String(extracted.daily_count) : '',
        closing_balance_rice: extracted.closing_balance_rice != null ? String(extracted.closing_balance_rice) : '',
      });
    } catch (err) {
      console.error('Error re-extracting ledger data:', err);
      setErrorMessage(err.message || 'Failed to re-extract ledger data from edited text.');
    } finally {
      setIsReExtracting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSaving(true);

    try {
      // Build clean payload according to backend LedgerCreate schema
      const payload = {
        date: formData.date,
        menu: formData.menu.trim() || null,
        egg: parseFloat(formData.egg) || 0,
        oil: parseFloat(formData.oil) || 0,
        dal: parseFloat(formData.dal) || 0,
        soya_potato: parseFloat(formData.soya_potato) || 0,
        masala: parseFloat(formData.masala) || 0,
        grocery: parseFloat(formData.grocery) || 0,
        veg: parseFloat(formData.veg) || 0,
        fuel: parseFloat(formData.fuel) || 0,
        class_5: parseInt(formData.class_5, 10) || 0,
        class_6: parseInt(formData.class_6, 10) || 0,
        class_7: parseInt(formData.class_7, 10) || 0,
        class_8: parseInt(formData.class_8, 10) || 0,
        opening_balance_rice: formData.opening_balance_rice !== '' ? parseFloat(formData.opening_balance_rice) : null,
        daily_count: formData.daily_count !== '' ? parseInt(formData.daily_count, 10) : null,
        closing_balance_rice: formData.closing_balance_rice !== '' ? parseFloat(formData.closing_balance_rice) : null,
      };

      const savedRecord = await api.saveLedger(payload);
      onSaveSuccess(savedRecord);
    } catch (err) {
      console.error('Error saving ledger:', err);
      setErrorMessage(err.message || 'Failed to save ledger record.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Editable Transcript Review Card */}
      {transcription !== null && (
        <div className="bg-slate-900 text-slate-100 rounded-xl p-4 sm:p-5 shadow-sm border border-slate-800">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <MessageSquare className="w-4 h-4" />
              <span>Voice Recognition Transcript ("What Was Heard")</span>
            </div>
            <span className="text-[10px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              Editable
            </span>
          </div>

          <textarea
            rows={3}
            value={editableTranscript}
            onChange={(e) => setEditableTranscript(e.target.value)}
            disabled={isReExtracting || isSaving}
            placeholder="Edit or paste speech transcript here..."
            className="w-full text-xs sm:text-sm font-mono text-slate-100 bg-slate-950/80 p-3 rounded-lg border border-slate-700 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none leading-relaxed transition-all resize-y"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-3 pt-2.5 border-t border-slate-800/80">
            <p className="text-[11px] text-slate-400 m-0">
              Correct any misheard words or quantities, then click Re-extract to update the fields below.
            </p>

            <button
              type="button"
              onClick={handleReExtract}
              disabled={isReExtracting || isSaving || !editableTranscript.trim()}
              className="flex items-center justify-center gap-2 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-xs disabled:bg-slate-800 disabled:text-slate-500 disabled:cursor-not-allowed shrink-0"
            >
              {isReExtracting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Re-extracting Data...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Re-extract Data from Text</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Error Alert Banner */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-rose-900 text-sm shadow-xs">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold m-0">Submission Error</p>
            <p className="m-0 mt-1">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Review & Edit Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Form Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0">
              Review & Commit Daily Entry
            </h2>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Verify monetary expenses, attendance figures, and rice inventory.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onCancel}
              disabled={isSaving}
              className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 transition-colors"
            >
              Discard / Re-record
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save to Ledger</span>
                </>
              )}
            </button>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-6">
          {/* Section 1: Date & Menu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Record Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => handleFieldChange('date', e.target.value)}
                  className="w-full px-3 py-2 text-sm font-semibold text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Daily Menu Description
              </label>
              <input
                type="text"
                value={formData.menu}
                placeholder="e.g., Rice, Dal, Egg Curry, Mix Vegetable"
                onChange={(e) => handleFieldChange('menu', e.target.value)}
                className="w-full px-3 py-2 text-sm text-slate-800 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Section 2: Financial Expenses Breakdown */}
          <div className="pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                  ₹
                </div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Daily Expense Breakdown</h3>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-lg">
                <span className="text-xs text-emerald-800 font-medium">Auto-Calculated Total:</span>
                <span className="text-sm font-bold text-emerald-900 font-mono">
                  ₹{calculatedTotalExpense}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5">
              {EXPENSE_FIELDS.map((item) => (
                <div key={item.key} className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {item.label} (₹)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData[item.key]}
                      onChange={(e) => handleFieldChange(item.key, e.target.value)}
                      className="w-full pl-6 pr-2 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Student Attendance */}
          <div className="pb-6 border-b border-slate-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600" />
                <h3 className="text-sm font-bold text-slate-900 m-0">Student Attendance Headcount</h3>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-indigo-50 border border-indigo-200 px-3 py-1 rounded-lg text-xs">
                  <span className="text-indigo-800 font-medium">Class 6-8: </span>
                  <span className="font-bold text-indigo-900 font-mono">{calculatedAttendance.total_6_8}</span>
                </div>
                <div className="bg-slate-900 text-white px-3 py-1 rounded-lg text-xs">
                  <span className="text-slate-300 font-medium">Total Served: </span>
                  <span className="font-bold text-emerald-400 font-mono">{calculatedAttendance.total}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {ATTENDANCE_FIELDS.map((item) => (
                <div key={item.key} className="bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {item.label} Count
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={formData[item.key]}
                    onChange={(e) => handleFieldChange(item.key, e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-md focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-right"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Section 4: Rice Inventory (Kg) */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Package className="w-5 h-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-bold text-slate-900 m-0">Rice Stock & Consumption (Kg)</h3>
                <span className="text-[11px] text-slate-500">
                  Optional government tracking fields (Domain calculation deferred).
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Opening Balance (Kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 45.00"
                  value={formData.opening_balance_rice}
                  onChange={(e) => handleFieldChange('opening_balance_rice', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-right"
                />
              </div>

              <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Daily Rice Count (Headcount)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  placeholder="e.g. 85"
                  value={formData.daily_count}
                  onChange={(e) => handleFieldChange('daily_count', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-right"
                />
              </div>

              <div className="bg-amber-50/40 p-2.5 rounded-lg border border-amber-200/60">
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  Closing Balance (Kg)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 38.00"
                  value={formData.closing_balance_rice}
                  onChange={(e) => handleFieldChange('closing_balance_rice', e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs sm:text-sm font-mono font-bold text-slate-900 bg-white border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 focus:border-amber-500 outline-none text-right"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 px-5 py-4 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Discard Entry</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-emerald-600/20 active:scale-[0.99] transition-all"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Committing to Database...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Confirm & Save Ledger Entry</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
