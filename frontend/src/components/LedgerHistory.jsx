import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  FileText, 
  Calendar, 
  Filter, 
  RotateCcw, 
  TrendingUp, 
  Users, 
  Package, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { api } from '../api';

export default function LedgerHistory() {
  const [ledgers, setLedgers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [expandedId, setExpandedId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.fetchLedgers(
        startDate || null,
        endDate || null,
        100,
        0
      );
      setLedgers(data);
    } catch (err) {
      console.error('Failed to load ledger records:', err);
      setError(err.message || 'Unable to retrieve historical ledger records.');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  // Aggregated Summary Metrics
  const summary = useMemo(() => {
    const totalCount = ledgers.length;
    const totalExpenditure = ledgers.reduce((acc, row) => acc + (parseFloat(row.total_expense) || 0), 0);
    const totalMealsServed = ledgers.reduce((acc, row) => acc + (parseInt(row.total_attendance, 10) || 0), 0);
    const avgDailyExpense = totalCount > 0 ? (totalExpenditure / totalCount) : 0;

    return {
      totalCount,
      totalExpenditure: totalExpenditure.toFixed(2),
      totalMealsServed,
      avgDailyExpense: avgDailyExpense.toFixed(2),
    };
  }, [ledgers]);

  return (
    <div className="space-y-6">
      {/* Header and Filter Controls */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 m-0">
              Government School Ledger History
            </h2>
            <p className="text-xs text-slate-500 m-0 mt-0.5">
              Chronological log of verified daily expenditures and midday meal attendance.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 self-start md:self-auto transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Date Filter Bar */}
        <div className="pt-4 flex flex-col sm:flex-row items-end sm:items-center gap-3">
          <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                From Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                To Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs text-slate-800 bg-slate-50 border border-slate-300 rounded-lg focus:ring-1 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={loadData}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Filter</span>
            </button>

            {(startDate || endDate) && (
              <button
                onClick={handleClearFilter}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg border border-slate-300 text-slate-600 text-xs font-medium hover:bg-slate-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Entries Logged</span>
            <FileText className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-900">
            {summary.totalCount}
          </div>
          <span className="text-[10px] text-slate-400">Total days recorded</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Expense</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-emerald-700">
            ₹{summary.totalExpenditure}
          </div>
          <span className="text-[10px] text-slate-400">Cumulative funding spent</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Meals Served</span>
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-700">
            {summary.totalMealsServed}
          </div>
          <span className="text-[10px] text-slate-400">Student attendance count</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider">Avg Daily Cost</span>
            <span className="font-mono text-xs font-bold text-amber-600">₹/day</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold font-mono text-slate-800">
            ₹{summary.avgDailyExpense}
          </div>
          <span className="text-[10px] text-slate-400">Average cost per day</span>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3 text-rose-800 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold m-0">Failed to Load Ledgers</p>
            <p className="m-0 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Main Ledger Content */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-500">
            <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm font-medium">Loading ledger records...</p>
          </div>
        ) : ledgers.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 m-0">No Ledger Entries Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              {startDate || endDate
                ? 'No records match the selected date range. Try widening the dates.'
                : 'No daily midday meal entries have been committed yet.'}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop Table View (Hidden on mobile < 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Menu</th>
                    <th className="py-3 px-4 text-right">Total Expense</th>
                    <th className="py-3 px-4 text-center">Attendance (5 / 6-8 / Total)</th>
                    <th className="py-3 px-4 text-right">Rice Stock (Kg)</th>
                    <th className="py-3 px-4 text-center">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {ledgers.map((row) => {
                    const isExpanded = expandedId === row.id;
                    return (
                      <React.Fragment key={row.id}>
                        <tr 
                          onClick={() => toggleExpand(row.id)}
                          className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                        >
                          <td className="py-3.5 px-4 font-bold font-mono text-slate-900 whitespace-nowrap">
                            {row.date}
                          </td>
                          <td className="py-3.5 px-4 max-w-xs truncate text-slate-700">
                            {row.menu || <span className="text-slate-400 italic">None specified</span>}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800 whitespace-nowrap">
                            ₹{parseFloat(row.total_expense).toFixed(2)}
                          </td>
                          <td className="py-3.5 px-4 text-center whitespace-nowrap">
                            <span className="font-mono text-slate-600">{row.class_5}</span>
                            <span className="text-slate-300 mx-1.5">/</span>
                            <span className="font-mono text-slate-600">{row.total_attendance_6_8}</span>
                            <span className="text-slate-300 mx-1.5">/</span>
                            <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                              {row.total_attendance}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono text-slate-600 whitespace-nowrap">
                            {row.closing_balance_rice != null ? (
                              <span>{parseFloat(row.closing_balance_rice).toFixed(2)} kg</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <button
                              type="button"
                              className="text-slate-400 hover:text-slate-700 p-1 rounded hover:bg-slate-200/50"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                          </td>
                        </tr>

                        {/* Expanded details row */}
                        {isExpanded && (
                          <tr className="bg-slate-50/90 border-y border-slate-200">
                            <td colSpan={6} className="p-4 sm:p-5">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Itemized expense breakdown */}
                                <div>
                                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                                    <span>Itemized Expenses</span>
                                    <span className="text-[10px] text-emerald-700 bg-emerald-100 px-1.5 rounded">
                                      Total ₹{parseFloat(row.total_expense).toFixed(2)}
                                    </span>
                                  </h4>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Egg:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.egg).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Oil:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.oil).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Dal:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.dal).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Soya/Potato:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.soya_potato).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Masala:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.masala).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Grocery:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.grocery).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Vegetables:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.veg).toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between bg-white p-2 rounded border border-slate-200">
                                      <span className="text-slate-600">Fuel:</span>
                                      <span className="font-mono font-semibold">₹{parseFloat(row.fuel).toFixed(2)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Attendance & Rice Stock details */}
                                <div className="space-y-4">
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                      Attendance Breakdown
                                    </h4>
                                    <div className="grid grid-cols-4 gap-2 text-center text-xs">
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Class 5</span>
                                        <span className="font-mono font-bold text-slate-800">{row.class_5}</span>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Class 6</span>
                                        <span className="font-mono font-bold text-slate-800">{row.class_6}</span>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Class 7</span>
                                        <span className="font-mono font-bold text-slate-800">{row.class_7}</span>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Class 8</span>
                                        <span className="font-mono font-bold text-slate-800">{row.class_8}</span>
                                      </div>
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                                      Rice Inventory
                                    </h4>
                                    <div className="grid grid-cols-3 gap-2 text-xs">
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Opening</span>
                                        <span className="font-mono font-bold text-slate-800">
                                          {row.opening_balance_rice != null ? `${parseFloat(row.opening_balance_rice).toFixed(2)} kg` : '—'}
                                        </span>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Daily Count</span>
                                        <span className="font-mono font-bold text-slate-800">
                                          {row.daily_count != null ? row.daily_count : '—'}
                                        </span>
                                      </div>
                                      <div className="bg-white p-2 rounded border border-slate-200">
                                        <span className="text-[10px] text-slate-500 block">Closing</span>
                                        <span className="font-mono font-bold text-slate-800">
                                          {row.closing_balance_rice != null ? `${parseFloat(row.closing_balance_rice).toFixed(2)} kg` : '—'}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (Optimized for 360px - 420px viewports) */}
            <div className="md:hidden divide-y divide-slate-100">
              {ledgers.map((row) => {
                const isExpanded = expandedId === row.id;
                return (
                  <div key={row.id} className="p-4">
                    <div 
                      onClick={() => toggleExpand(row.id)}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold font-mono text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                          {row.date}
                        </span>
                        <span className="text-sm font-bold font-mono text-emerald-800">
                          ₹{parseFloat(row.total_expense).toFixed(2)}
                        </span>
                      </div>

                      <p className="text-xs text-slate-700 font-medium line-clamp-1 mb-2">
                        {row.menu || <span className="text-slate-400 italic">No menu specified</span>}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-50">
                        <span>Students: <strong className="text-slate-800">{row.total_attendance}</strong></span>
                        <span>Rice: <strong className="text-slate-800">{row.closing_balance_rice != null ? `${parseFloat(row.closing_balance_rice).toFixed(1)}kg` : '—'}</strong></span>
                        <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                          {isExpanded ? 'Less' : 'More'}
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </span>
                      </div>
                    </div>

                    {/* Mobile Expanded Breakdown */}
                    {isExpanded && (
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-3 bg-slate-50/70 -mx-4 -mb-4 p-4 rounded-b-xl">
                        <div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Expenses Breakdown
                          </p>
                          <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Egg:</span>
                              <span className="font-mono font-semibold">₹{row.egg}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Oil:</span>
                              <span className="font-mono font-semibold">₹{row.oil}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Dal:</span>
                              <span className="font-mono font-semibold">₹{row.dal}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Soya/Pot:</span>
                              <span className="font-mono font-semibold">₹{row.soya_potato}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Masala:</span>
                              <span className="font-mono font-semibold">₹{row.masala}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Grocery:</span>
                              <span className="font-mono font-semibold">₹{row.grocery}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Veg:</span>
                              <span className="font-mono font-semibold">₹{row.veg}</span>
                            </div>
                            <div className="bg-white p-1.5 rounded border border-slate-200 flex justify-between">
                              <span className="text-slate-500">Fuel:</span>
                              <span className="font-mono font-semibold">₹{row.fuel}</span>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                            Attendance Classes (5, 6, 7, 8)
                          </p>
                          <div className="grid grid-cols-4 gap-1 text-center text-xs">
                            <div className="bg-white p-1 rounded border border-slate-200">
                              <span className="text-[9px] text-slate-400 block">C5</span>
                              <span className="font-mono font-bold">{row.class_5}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-slate-200">
                              <span className="text-[9px] text-slate-400 block">C6</span>
                              <span className="font-mono font-bold">{row.class_6}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-slate-200">
                              <span className="text-[9px] text-slate-400 block">C7</span>
                              <span className="font-mono font-bold">{row.class_7}</span>
                            </div>
                            <div className="bg-white p-1 rounded border border-slate-200">
                              <span className="text-[9px] text-slate-400 block">C8</span>
                              <span className="font-mono font-bold">{row.class_8}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
