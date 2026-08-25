import React, { useState, useEffect } from 'react';
import { 
  FileText, CreditCard, UserCheck, Calendar, Search, 
  Filter, Printer, ArrowUpRight, TrendingUp, AlertCircle, 
  DollarSign, CheckSquare, Square, Eye, RotateCcw, HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const MODULES = [
  { key: 'dashboard', name: 'Dashboard' },
  { key: 'registration', name: 'Registration' },
  { key: 'verification', name: 'Verification' },
  { key: 'fees', name: 'Fees Console' },
  { key: 'library', name: 'Library Console' }
];

const getCourseBadge = (course) => {
  if (!course) return null;
  const normalized = course.trim().toUpperCase();
  let colorClasses = "bg-slate-500/10 text-slate-655 dark:bg-slate-500/20 dark:text-slate-300";
  
  if (normalized.includes("LL.B") && !normalized.includes("B.A")) {
    colorClasses = "bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-300";
  } else if (normalized.includes("LL.M")) {
    colorClasses = "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-300";
  } else if (normalized.includes("B.A. LL.B") || normalized.includes("BA-LLB") || normalized.includes("B.A")) {
    colorClasses = "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-300";
  } else if (normalized.includes("DIPLOMA")) {
    colorClasses = "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300";
  }
  
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${colorClasses}`}>
      {course}
    </span>
  );
};

const Reports = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fees'); // 'fees' or 'admissions'
  const [toast, setToast] = useState(null);
  
  // Fees Report States
  const [feesSubTab, setFeesSubTab] = useState('daily');
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesData, setFeesData] = useState({ daily: [], monthly: [], yearly: [], logs: [] });
  const [feesFilters, setFeesFilters] = useState({
    startDate: '',
    endDate: '',
    course: '',
    paymentMode: ''
  });

  // Admissions Report States
  const [admissionsLoading, setAdmissionsLoading] = useState(false);
  const [admissionsData, setAdmissionsData] = useState({ daily: [], monthly: [], courseStats: [], logs: [] });
  const [admissionsFilters, setAdmissionsFilters] = useState({
    startDate: '',
    endDate: '',
    course: '',
    status: '',
    category: ''
  });

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchFeesReport = async () => {
    setFeesLoading(true);
    const token = localStorage.getItem('token');
    try {
      const queryParams = new URLSearchParams(feesFilters);
      const res = await fetch(`/api/reports/fees?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFeesData(data);
      } else {
        showToastMsg(data.message || 'Error fetching fees report', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline or server connection failed', 'error');
    } finally {
      setFeesLoading(false);
    }
  };

  const fetchAdmissionsReport = async () => {
    setAdmissionsLoading(true);
    const token = localStorage.getItem('token');
    try {
      const queryParams = new URLSearchParams(admissionsFilters);
      const res = await fetch(`/api/reports/admissions?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setAdmissionsData(data);
      } else {
        showToastMsg(data.message || 'Error fetching admissions report', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline or server connection failed', 'error');
    } finally {
      setAdmissionsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'fees') {
      fetchFeesReport();
    } else {
      fetchAdmissionsReport();
    }
  }, [activeTab, feesFilters, admissionsFilters]);

  const handleResetFeesFilters = () => {
    setFeesFilters({
      startDate: '',
      endDate: '',
      course: '',
      paymentMode: ''
    });
  };

  const handleResetAdmissionsFilters = () => {
    setAdmissionsFilters({
      startDate: '',
      endDate: '',
      course: '',
      status: '',
      category: ''
    });
  };

  const handlePrint = () => {
    window.print();
  };

  // Aggregated Sum calculations for summary cards
  const totalAmountCollected = feesData.logs.reduce((sum, item) => sum + item.amountPaid, 0);
  const totalReceiptsCount = feesData.logs.length;
  const newRegistrationsCount = admissionsData.logs.length;

  return (
    <div className="flex flex-col space-y-8 font-sans p-6 max-w-7xl mx-auto min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header & Tabs Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-darkbg-surface p-6 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 text-brand-650 dark:text-brand-300 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-warm-900 dark:text-slate-100">College Reporting Hub</h1>
          </div>
          <p className="text-xs text-warm-850 dark:text-slate-400">
            Generate and print executive daily, monthly, and yearly reports for tuition collections and new admissions.
          </p>
        </div>
        
        {/* Main Tab Controls */}
        <div className="flex bg-warm-100/50 dark:bg-darkbg-base p-1 rounded-xl border border-warm-200/40 dark:border-darkbg-border text-[10px] font-bold uppercase tracking-wider self-start md:self-center shadow-inner shrink-0">
          <button
            onClick={() => setActiveTab('fees')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${activeTab === 'fees' ? 'bg-white dark:bg-darkbg-surface shadow-md text-brand-600 dark:text-brand-400 font-black' : 'text-slate-400 hover:text-slate-650'}`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Fees Collections</span>
          </button>
          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-all ${activeTab === 'admissions' ? 'bg-white dark:bg-darkbg-surface shadow-md text-brand-600 dark:text-brand-400 font-black' : 'text-slate-400 hover:text-slate-650'}`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>New Admissions</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ─── TAB 1: FEES COLLECTIONS REPORT ─── */}
      {/* ========================================================= */}
      {activeTab === 'fees' && (
        <div className="space-y-6">
          {/* Filters Toolbar */}
          <div className="classy-card flex flex-wrap items-end gap-4 no-print">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={feesFilters.startDate}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200"
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">End Date</label>
              <input
                type="date"
                value={feesFilters.endDate}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Course</label>
              <select
                value={feesFilters.course}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, course: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Courses</option>
                <option value="LL.B.">LL.B.</option>
                <option value="LL.M.">LL.M.</option>
                <option value="B.A. LL.B.">B.A. LL.B.</option>
                <option value="P.G. Diploma in Law">P.G. Diploma</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Payment Mode</label>
              <select
                value={feesFilters.paymentMode}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="Online (UPI/NetBanking)">Online / UPI</option>
                <option value="Bank Challan">Bank Challan</option>
                <option value="Credit/Debit Card">Credit/Debit Card</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleResetFeesFilters}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-warm-100 dark:bg-darkbg-surface hover:bg-warm-200/50 dark:hover:bg-darkbg-border text-xs font-bold text-warm-800 dark:text-slate-200 rounded-xl transition-all border border-warm-200/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handlePrint}
                className="classy-btn-primary flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* Aggregation Summary Cards (Print layout will hide this or render beautifully) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <div className="classy-card border-l-4 border-l-emerald-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Total Receipts Amount</span>
                  <h2 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totalAmountCollected.toLocaleString()}/-</h2>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-2xl">
                  <TrendingUp className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="classy-card border-l-4 border-l-indigo-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Receipts / Vouchers Issued</span>
                  <h2 className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{totalReceiptsCount}</h2>
                </div>
                <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-2xl">
                  <FileText className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="classy-card border-l-4 border-l-brand-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Average Value / Receipt</span>
                  <h2 className="text-2xl font-black text-brand-600 dark:text-brand-300">
                    ₹{totalReceiptsCount > 0 ? Math.round(totalAmountCollected / totalReceiptsCount).toLocaleString() : 0}/-
                  </h2>
                </div>
                <div className="p-3 bg-brand-500/10 text-brand-650 rounded-2xl">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Reports Printable Layout Container */}
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200/50 dark:border-darkbg-border rounded-2xl shadow-sm p-6 space-y-8">
            
            {/* Print Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold uppercase">B.J.S. Rampuria Jain Law College</h2>
              <h3 className="text-sm font-semibold text-slate-700 capitalize mt-1">Fees Collection Financial Summary Report</h3>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-4">
                <span>FILTER COURSE: {feesFilters.course || 'ALL'} | MODE: {feesFilters.paymentMode || 'ALL'}</span>
                <span>RANGE: {feesFilters.startDate || 'START'} to {feesFilters.endDate || 'TODAY'}</span>
                <span>PRINT DATE: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {/* Sub Tabs switcher */}
            <div className="flex space-x-6 border-b border-warm-200/40 dark:border-darkbg-border text-xs font-bold uppercase tracking-wider no-print">
              {['daily', 'monthly', 'yearly'].map((subTab) => (
                <button
                  key={subTab}
                  onClick={() => setFeesSubTab(subTab)}
                  className={`pb-3 transition-colors relative capitalize ${feesSubTab === subTab ? 'text-brand-600 dark:text-brand-400 border-b-2 border-brand-500' : 'text-slate-400 hover:text-slate-655'}`}
                >
                  {subTab} Summary
                </button>
              ))}
            </div>

            {feesLoading ? (
              <Loading text="Compiling fees cashflow report..." />
            ) : (
              <div className="space-y-8">
                {/* 1. Aggregation Table */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-brand-500" />
                    <span>Aggregated Cashflow Summaries ({feesSubTab.toUpperCase()})</span>
                  </span>
                  
                  {feesSubTab === 'daily' && (
                    <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                      <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border">Collection Date</th>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-center">Receipts Count</th>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right">Total Amount Collected</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                          {feesData.daily.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center py-6 text-slate-400 italic">No daily collection match found.</td>
                            </tr>
                          ) : (
                            feesData.daily.map((d, index) => (
                              <tr key={index} className="hover:bg-warm-50/10 transition-colors">
                                <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border">{d.paymentDate}</td>
                                <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border text-center font-bold text-slate-900 dark:text-white">{d.transactionCount}</td>
                                <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border text-right font-black text-emerald-600 dark:text-emerald-400">₹{d.totalAmount.toLocaleString()}/-</td>
                              </tr>
                            ))
                          )}
                          {feesData.daily.length > 0 && (
                            <tr className="bg-slate-50 dark:bg-darkbg-base/30 font-black">
                              <td className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right" colSpan="2">Net Total Collections</td>
                              <td className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right text-emerald-700 dark:text-emerald-450">
                                ₹{feesData.daily.reduce((sum, d) => sum + d.totalAmount, 0).toLocaleString()}/-
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {feesSubTab === 'monthly' && (
                    <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                      <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border">Month / Calendar Year</th>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-center">Receipts Count</th>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right">Total Amount Collected</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                          {feesData.monthly.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center py-6 text-slate-400 italic">No monthly collection match found.</td>
                            </tr>
                          ) : (
                            feesData.monthly.map((m, index) => {
                              const months = ["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                              return (
                                <tr key={index} className="hover:bg-warm-50/10 transition-colors">
                                  <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border font-bold text-slate-900 dark:text-white">{months[m.month]} - {m.year}</td>
                                  <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border text-center font-bold">{m.transactionCount}</td>
                                  <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border text-right font-black text-emerald-600 dark:text-emerald-400">₹{m.totalAmount.toLocaleString()}/-</td>
                                </tr>
                              );
                            })
                          )}
                          {feesData.monthly.length > 0 && (
                            <tr className="bg-slate-50 dark:bg-darkbg-base/30 font-black">
                              <td className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right" colSpan="2">Net Total Collections</td>
                              <td className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right text-emerald-700 dark:text-emerald-450">
                                ₹{feesData.monthly.reduce((sum, m) => sum + m.totalAmount, 0).toLocaleString()}/-
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {feesSubTab === 'yearly' && (
                    <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                      <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border">Financial Year</th>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-center">Receipts Count</th>
                            <th className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right">Total Amount Collected</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                          {feesData.yearly.length === 0 ? (
                            <tr>
                              <td colSpan="3" className="text-center py-6 text-slate-400 italic">No yearly collection match found.</td>
                            </tr>
                          ) : (
                            feesData.yearly.map((y, index) => (
                              <tr key={index} className="hover:bg-warm-50/10 transition-colors">
                                <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border font-bold text-slate-900 dark:text-white">YEAR {y.year}</td>
                                <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border text-center font-bold">{y.transactionCount}</td>
                                <td className="px-5 py-3.5 border border-warm-250/10 dark:border-darkbg-border text-right font-black text-emerald-600 dark:text-emerald-400">₹{y.totalAmount.toLocaleString()}/-</td>
                              </tr>
                            ))
                          )}
                          {feesData.yearly.length > 0 && (
                            <tr className="bg-slate-50 dark:bg-darkbg-base/30 font-black">
                              <td className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right" colSpan="2">Net Total Collections</td>
                              <td className="px-5 py-3.5 border border-warm-250/20 dark:border-darkbg-border text-right text-emerald-700 dark:text-emerald-455">
                                ₹{feesData.yearly.reduce((sum, y) => sum + y.totalAmount, 0).toLocaleString()}/-
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* 2. Detailed Logs Table */}
                <div className="space-y-3 page-break-before">
                  <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span>Detailed Transaction Ledger & Audit Logs ({feesData.logs.length} Vouchers)</span>
                  </span>
                  
                  <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                    <table className="min-w-full text-xs text-left border-collapse">
                      <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Receipt No</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Student Name</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Course</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Term/Installment</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border text-right">Amount Paid</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Payment Mode</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Transaction Ref No</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Date</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                        {feesData.logs.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-6 text-slate-400 italic">No receipts match filters in database.</td>
                          </tr>
                        ) : (
                          feesData.logs.map((log) => (
                            <tr key={log.id} className="hover:bg-warm-50/10 transition-colors">
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border font-mono font-bold text-slate-900 dark:text-white">{log.receiptNo}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">
                                <div className="font-bold text-slate-900 dark:text-slate-200">{log.student?.fullName}</div>
                                <div className="text-[10px] text-slate-400 font-bold">{log.student?.registrationId}</div>
                              </td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{getCourseBadge(log.student?.courseApplied)}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">
                                <div>{log.academicYear}</div>
                                <div className="text-[10px] text-slate-400">{log.installmentName}</div>
                              </td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border text-right font-black text-emerald-600 dark:text-emerald-400">₹{log.amountPaid.toLocaleString()}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{log.paymentMode}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border font-mono text-[10px] text-slate-450">{log.transactionNo || <span className="text-slate-300 italic">—</span>}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{log.paymentDate}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Print Sign block */}
                <div className="hidden print:flex justify-between pt-16 text-xs font-bold text-slate-800">
                  <div className="text-center w-48 border-t pt-2">ERP Clerk Signature</div>
                  <div className="text-center w-48 border-t pt-2">Authorized Seal</div>
                  <div className="text-center w-48 border-t pt-2">Principal Approval</div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ─── TAB 2: NEW ADMISSIONS REPORT ─── */}
      {/* ========================================================= */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          {/* Filters Toolbar */}
          <div className="classy-card flex flex-wrap items-end gap-4 no-print">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={admissionsFilters.startDate}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200"
              />
            </div>
            
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">End Date</label>
              <input
                type="date"
                value={admissionsFilters.endDate}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200"
              />
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Course</label>
              <select
                value={admissionsFilters.course}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, course: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Courses</option>
                <option value="LL.B.">LL.B.</option>
                <option value="LL.M.">LL.M.</option>
                <option value="B.A. LL.B.">B.A. LL.B.</option>
                <option value="P.G. Diploma in Law">P.G. Diploma</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Verification Status</label>
              <select
                value={admissionsFilters.status}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, status: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Category</label>
              <select
                value={admissionsFilters.category}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, category: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-200 cursor-pointer"
              >
                <option value="">All Categories</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
              </select>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={handleResetAdmissionsFilters}
                className="flex items-center space-x-1.5 px-4 py-2.5 bg-warm-100 dark:bg-darkbg-surface hover:bg-warm-200/50 dark:hover:bg-darkbg-border text-xs font-bold text-warm-800 dark:text-slate-200 rounded-xl transition-all border border-warm-200/50"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
              <button
                onClick={handlePrint}
                className="classy-btn-primary flex items-center space-x-1.5 px-4 py-2.5 text-xs font-bold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Report</span>
              </button>
            </div>
          </div>

          {/* KPI Admissions Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print">
            <div className="classy-card border-l-4 border-l-brand-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">New Registrations Count</span>
                  <h2 className="text-2xl font-black text-brand-600 dark:text-brand-350">{newRegistrationsCount} Students</h2>
                </div>
                <div className="p-3 bg-brand-500/10 text-brand-650 rounded-2xl">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="classy-card border-l-4 border-l-amber-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Verified Enrolled</span>
                  <h2 className="text-2xl font-black text-amber-600 dark:text-amber-400 font-serif">
                    {admissionsData.logs.filter(s => s.verificationStatus === 'Verified').length} Accounts
                  </h2>
                </div>
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <CheckSquare className="w-5 h-5" />
                </div>
              </div>
            </div>

            <div className="classy-card border-l-4 border-l-rose-500">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pending Documents Verification</span>
                  <h2 className="text-2xl font-black text-rose-600 dark:text-rose-400">
                    {admissionsData.logs.filter(s => s.verificationStatus === 'Pending' || !s.verificationStatus).length} Pending
                  </h2>
                </div>
                <div className="p-3 bg-rose-500/10 text-rose-600 rounded-2xl">
                  <AlertCircle className="w-5 h-5" />
                </div>
              </div>
            </div>
          </div>

          {/* Printable Layout Container */}
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200/50 dark:border-darkbg-border rounded-2xl shadow-sm p-6 space-y-8">
            {/* Print Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold uppercase">B.J.S. Rampuria Jain Law College</h2>
              <h3 className="text-sm font-semibold text-slate-700 capitalize mt-1">New Admission & Student Registrations Audit Report</h3>
              <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-4">
                <span>FILTER COURSE: {admissionsFilters.course || 'ALL'} | CAT: {admissionsFilters.category || 'ALL'}</span>
                <span>RANGE: {admissionsFilters.startDate || 'START'} to {admissionsFilters.endDate || 'TODAY'}</span>
                <span>PRINT DATE: {new Date().toLocaleDateString()}</span>
              </div>
            </div>

            {admissionsLoading ? (
              <Loading text="Compiling new admissions matrices..." />
            ) : (
              <div className="space-y-8">
                
                {/* Course Wise stats & category stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Course metrics */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4 text-brand-500" />
                      <span>Course Wise Distribution</span>
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                      <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-5 py-3 border border-warm-250/20 dark:border-darkbg-border">Applied Course</th>
                            <th className="px-5 py-3 border border-warm-250/20 dark:border-darkbg-border text-center">Registrations Count</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                          {admissionsData.courseStats.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="text-center py-4 text-slate-400 italic">No registrations found.</td>
                            </tr>
                          ) : (
                            admissionsData.courseStats.map((stat, i) => (
                              <tr key={i} className="hover:bg-warm-50/10 transition-colors">
                                <td className="px-5 py-3 border border-warm-250/10 dark:border-darkbg-border font-bold text-slate-800 dark:text-slate-250">{getCourseBadge(stat.courseApplied)}</td>
                                <td className="px-5 py-3 border border-warm-250/10 dark:border-darkbg-border text-center font-black text-brand-600 dark:text-brand-350">{stat.count}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Daily Registrations summary */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                      <Calendar className="w-4 h-4 text-brand-500" />
                      <span>Daily Admissions Aggregation</span>
                    </span>
                    <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                      <table className="min-w-full text-xs text-left border-collapse">
                        <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                          <tr>
                            <th className="px-5 py-3 border border-warm-250/20 dark:border-darkbg-border">Date of Registration</th>
                            <th className="px-5 py-3 border border-warm-250/20 dark:border-darkbg-border text-center">Registrations</th>
                          </tr>
                        </thead>
                        <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                          {admissionsData.daily.length === 0 ? (
                            <tr>
                              <td colSpan="2" className="text-center py-4 text-slate-400 italic">No registrations matches found.</td>
                            </tr>
                          ) : (
                            admissionsData.daily.map((d, i) => (
                              <tr key={i} className="hover:bg-warm-50/10 transition-colors">
                                <td className="px-5 py-3 border border-warm-250/10 dark:border-darkbg-border">{d.date}</td>
                                <td className="px-5 py-3 border border-warm-250/10 dark:border-darkbg-border text-center font-bold text-slate-900 dark:text-white">{d.count}</td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Detailed Logs lists */}
                <div className="space-y-3 page-break-before">
                  <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-brand-500" />
                    <span>Admitted Students Roster List ({admissionsData.logs.length} Profiles)</span>
                  </span>
                  
                  <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                    <table className="min-w-full text-xs text-left border-collapse">
                      <thead className="bg-warm-50/50 dark:bg-darkbg-base font-bold uppercase tracking-wider text-slate-400">
                        <tr>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Reg ID</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Student Full Name</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Course</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Category</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Gender</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Mobile</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border text-center">Status</th>
                          <th className="px-4 py-3 border border-warm-250/20 dark:border-darkbg-border">Admitted Date</th>
                        </tr>
                      </thead>
                      <tbody className="font-semibold text-slate-700 dark:text-slate-200">
                        {admissionsData.logs.length === 0 ? (
                          <tr>
                            <td colSpan="8" className="text-center py-6 text-slate-400 italic">No registrations found in this timeframe.</td>
                          </tr>
                        ) : (
                          admissionsData.logs.map((std) => (
                            <tr key={std.id} className="hover:bg-warm-50/10 transition-colors">
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border font-mono font-bold text-slate-900 dark:text-white">{std.registrationId}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border font-bold text-slate-900 dark:text-slate-200">{std.fullName}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{getCourseBadge(std.courseApplied)}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{std.category}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{std.gender}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border font-mono">{std.mobileNumber}</td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border text-center">
                                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase
                                  ${std.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 
                                    std.verificationStatus === 'Rejected' ? 'bg-rose-500/10 text-rose-600' : 'bg-amber-500/10 text-amber-600'}`}
                                >
                                  {std.verificationStatus || 'Pending'}
                                </span>
                              </td>
                              <td className="px-4 py-3 border border-warm-250/10 dark:border-darkbg-border">{new Date(std.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Print Sign block */}
                <div className="hidden print:flex justify-between pt-16 text-xs font-bold text-slate-800">
                  <div className="text-center w-48 border-t pt-2">ERP Clerk Signature</div>
                  <div className="text-center w-48 border-t pt-2">Authorized Seal</div>
                  <div className="text-center w-48 border-t pt-2">Principal Approval</div>
                </div>

              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
