import React, { useState, useEffect } from 'react';
import { 
  FileText, CreditCard, UserCheck, Calendar, Search, 
  Filter, Printer, ArrowUpRight, TrendingUp, AlertCircle, 
  DollarSign, CheckSquare, Square, Eye, RotateCcw, HelpCircle,
  Download, BookOpen, Layers, Clock, ShieldCheck, User
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const getCourseBadge = (course) => {
  if (!course) return null;
  const normalized = course.trim().toUpperCase();
  let colorClasses = "bg-slate-500/10 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300";
  
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
  // Tabs: 'fees-posting' | 'day-book' | 'fees-analytics' | 'admissions'
  const [activeTab, setActiveTab] = useState('fees-posting');
  const [toast, setToast] = useState(null);
  
  // Available Sessions & Courses for dropdowns
  const [sessions, setSessions] = useState(['2024-25', '2025-26', '2026-27']);
  const [courses, setCourses] = useState(['LL.B. (3 Year)', 'B.A. LL.B. (5 Year)', 'LL.M. (2 Year)', 'Diploma in Cyber Law', 'Diploma in Labour Law']);

  // ─── 1. FEES POSTING LIST STATE ───
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingData, setPostingData] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    modeBreakdown: {},
    headBreakdown: {},
    records: []
  });
  const [postingFilters, setPostingFilters] = useState({
    startDate: '',
    endDate: '',
    session: 'All',
    course: 'All',
    paymentMode: 'All',
    feeHead: 'All',
    search: ''
  });

  // ─── 2. DAY BOOK STATE ───
  const [dayBookLoading, setDayBookLoading] = useState(false);
  const [dayBookDate, setDayBookDate] = useState(new Date().toISOString().split('T')[0]);
  const [dayBookSession, setDayBookSession] = useState('All');
  const [dayBookMode, setDayBookMode] = useState('All');
  const [dayBookData, setDayBookData] = useState({
    reportDate: '',
    totalAmount: 0,
    cashTotal: 0,
    upiTotal: 0,
    bankTotal: 0,
    chequeTotal: 0,
    voucherCount: 0,
    vouchers: []
  });

  // ─── 3. FEES ANALYTICS STATE ───
  const [feesSubTab, setFeesSubTab] = useState('daily');
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesData, setFeesData] = useState({ daily: [], monthly: [], yearly: [], logs: [] });
  const [feesFilters, setFeesFilters] = useState({
    startDate: '',
    endDate: '',
    course: '',
    paymentMode: ''
  });

  // ─── 4. ADMISSIONS REPORT STATE ───
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

  // Fetch helper lists (sessions & courses)
  useEffect(() => {
    const fetchMeta = async () => {
      const token = localStorage.getItem('token');
      try {
        const [resSess, resCourses] = await Promise.all([
          fetch('/api/sessions', { headers: { 'Authorization': `Bearer ${token}` } }),
          fetch('/api/courses', { headers: { 'Authorization': `Bearer ${token}` } })
        ]);
        if (resSess.ok) {
          const s = await resSess.json();
          if (Array.isArray(s) && s.length > 0) {
            const sessionNames = s.map(x => typeof x === 'string' ? x : (x.sessionName || x.name || '')).filter(Boolean);
            if (sessionNames.length > 0) setSessions(sessionNames);
          }
        }
        if (resCourses.ok) {
          const c = await resCourses.json();
          if (Array.isArray(c) && c.length > 0) {
            const courseNames = c.map(x => typeof x === 'string' ? x : (x.name || x.courseName || x.code || '')).filter(Boolean);
            if (courseNames.length > 0) setCourses(courseNames);
          }
        }
      } catch (err) {
        console.error('Failed to load sessions/courses meta', err);
      }
    };
    fetchMeta();
  }, []);

  // ─── FETCH FEES POSTING LIST ───
  const fetchPostingList = async () => {
    setPostingLoading(true);
    const token = localStorage.getItem('token');
    try {
      const q = new URLSearchParams(postingFilters);
      const res = await fetch(`/api/reports/fees-posting?${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPostingData(data);
      } else {
        showToastMsg(data.message || 'Error fetching posting list', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setPostingLoading(false);
    }
  };

  // ─── FETCH DAY BOOK ───
  const fetchDayBook = async () => {
    setDayBookLoading(true);
    const token = localStorage.getItem('token');
    try {
      const q = new URLSearchParams({
        date: dayBookDate,
        session: dayBookSession,
        paymentMode: dayBookMode
      });
      const res = await fetch(`/api/reports/day-book?${q}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDayBookData(data);
      } else {
        showToastMsg(data.message || 'Error fetching day book', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setDayBookLoading(false);
    }
  };

  // ─── FETCH FEES ANALYTICS ───
  const fetchFeesAnalytics = async () => {
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

  // ─── FETCH ADMISSIONS REPORT ───
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

  // Trigger data fetches based on active tab
  useEffect(() => {
    if (activeTab === 'fees-posting') fetchPostingList();
    else if (activeTab === 'day-book') fetchDayBook();
    else if (activeTab === 'fees-analytics') fetchFeesAnalytics();
    else if (activeTab === 'admissions') fetchAdmissionsReport();
  }, [activeTab, postingFilters, dayBookDate, dayBookSession, dayBookMode, feesFilters, admissionsFilters]);

  // ─── EXPORT TO EXCEL HELPERS ───
  const exportPostingListToExcel = () => {
    if (!postingData.records || postingData.records.length === 0) {
      showToastMsg('No records to export', 'error');
      return;
    }

    const rows = postingData.records.map((r, index) => ({
      'S.No': index + 1,
      'Receipt No': r.receiptNo || `REC-${r.id}`,
      'Date': r.paymentDate || '',
      'Registration ID': r.student?.registrationId || 'N/A',
      'Student Name': r.student?.fullName || 'N/A',
      "Father's Name": r.student?.fatherName || '',
      'Course': r.student?.courseApplied || '',
      'Session': r.student?.academicSession || '',
      'Year/Sem': `${r.student?.academicYear || ''} ${r.student?.semester || ''}`.trim(),
      'Fee Head': r.feeHead || 'Tuition',
      'Payment Mode': r.paymentMode || 'Cash',
      'Txn ID / Ref': r.transactionId || '',
      'Amount Paid (₹)': r.amountPaid || 0,
      'Mobile': r.student?.mobileNumber || ''
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Fees Posting List');
    XLSX.writeFile(workbook, `Fees_Posting_List_${new Date().toISOString().split('T')[0]}.xlsx`);
    showToastMsg('Exported Fees Posting List to Excel successfully');
  };

  const exportDayBookToExcel = () => {
    if (!dayBookData.vouchers || dayBookData.vouchers.length === 0) {
      showToastMsg('No day book vouchers to export', 'error');
      return;
    }

    const rows = dayBookData.vouchers.map((v, index) => ({
      'Voucher No': v.voucherNo || `VR-${index + 1}`,
      'Receipt No': v.receiptNo || '',
      'Date': v.paymentDate || '',
      'Reg No': v.student?.registrationId || '',
      'Student Name': v.student?.fullName || '',
      'Course': v.student?.courseApplied || '',
      'Session': v.student?.academicSession || '',
      'Particulars / Fee Head': v.feeHead || 'Tuition Fee',
      'Payment Mode': v.paymentMode || 'Cash',
      'Amount (₹)': v.amountPaid || 0
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Day Book');
    XLSX.writeFile(workbook, `Day_Book_${dayBookDate}.xlsx`);
    showToastMsg('Exported Day Book to Excel successfully');
  };

  // Quick Date presets for Fees Posting
  const applyDatePreset = (preset) => {
    const today = new Date();
    let start = '';
    let end = today.toISOString().split('T')[0];

    if (preset === 'today') {
      start = end;
    } else if (preset === 'yesterday') {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      start = y.toISOString().split('T')[0];
      end = start;
    } else if (preset === 'this-month') {
      const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
      start = firstDay.toISOString().split('T')[0];
    } else if (preset === 'all') {
      start = '';
      end = '';
    }

    setPostingFilters(prev => ({ ...prev, startDate: start, endDate: end }));
  };

  return (
    <div className="flex flex-col space-y-8 font-sans p-6 max-w-7xl mx-auto min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header & Main Tabs Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-darkbg-surface p-6 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm no-print">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 text-brand-600 dark:text-brand-300 rounded-lg">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-warm-900 dark:text-slate-100">College Reporting Hub</h1>
          </div>
          <p className="text-xs text-warm-800/60 dark:text-slate-400">
            Official Fees Posting Register, Daily Cash Day Book, Aggregate Financial Audits & Admissions Reports.
          </p>
        </div>
        
        {/* Main Tab Controls */}
        <div className="flex flex-wrap bg-warm-100/50 dark:bg-darkbg-base p-1 rounded-xl border border-warm-200/40 dark:border-darkbg-border text-[11px] font-bold uppercase tracking-wider self-start md:self-center shadow-inner shrink-0 gap-1">
          <button
            onClick={() => setActiveTab('fees-posting')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'fees-posting' 
                ? 'bg-white dark:bg-darkbg-surface shadow-md text-brand-600 dark:text-brand-400 font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Fees Posting List</span>
          </button>
          
          <button
            onClick={() => setActiveTab('day-book')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'day-book' 
                ? 'bg-white dark:bg-darkbg-surface shadow-md text-emerald-600 dark:text-emerald-400 font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Day Book (Daily Register)</span>
          </button>

          <button
            onClick={() => setActiveTab('fees-analytics')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'fees-analytics' 
                ? 'bg-white dark:bg-darkbg-surface shadow-md text-brand-600 dark:text-brand-400 font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Fees Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('admissions')}
            className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-lg transition-all ${
              activeTab === 'admissions' 
                ? 'bg-white dark:bg-darkbg-surface shadow-md text-purple-600 dark:text-purple-400 font-black' 
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>New Admissions</span>
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* ─── TAB 1: FEES POSTING LIST REGISTER ─── */}
      {/* ========================================================= */}
      {activeTab === 'fees-posting' && (
        <div className="space-y-6">
          
          {/* Filters Bar */}
          <div className="classy-card flex flex-col space-y-4 no-print">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-brand-600" />
                <span className="text-xs font-bold text-warm-900 dark:text-white uppercase tracking-wider">
                  Fees Posting Filter Parameters
                </span>
              </div>
              
              {/* Quick Presets */}
              <div className="flex items-center space-x-2 text-[11px] font-semibold">
                <span className="text-slate-400">Presets:</span>
                <button onClick={() => applyDatePreset('today')} className="px-2.5 py-1 rounded bg-warm-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-darkbg-base">Today</button>
                <button onClick={() => applyDatePreset('yesterday')} className="px-2.5 py-1 rounded bg-warm-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-darkbg-base">Yesterday</button>
                <button onClick={() => applyDatePreset('this-month')} className="px-2.5 py-1 rounded bg-warm-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-darkbg-base">This Month</button>
                <button onClick={() => applyDatePreset('all')} className="px-2.5 py-1 rounded bg-warm-100 hover:bg-brand-50 hover:text-brand-600 dark:bg-darkbg-base">All Time</button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
              {/* Start Date */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">From Date</label>
                <input
                  type="date"
                  value={postingFilters.startDate}
                  onChange={(e) => setPostingFilters(prev => ({ ...prev, startDate: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                />
              </div>

              {/* End Date */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">To Date</label>
                <input
                  type="date"
                  value={postingFilters.endDate}
                  onChange={(e) => setPostingFilters(prev => ({ ...prev, endDate: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                />
              </div>

              {/* Session */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Academic Session</label>
                <select
                  value={postingFilters.session}
                  onChange={(e) => setPostingFilters(prev => ({ ...prev, session: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                >
                  <option value="All">All Sessions</option>
                  {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              {/* Course */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Course Applied</label>
                <select
                  value={postingFilters.course}
                  onChange={(e) => setPostingFilters(prev => ({ ...prev, course: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                >
                  <option value="All">All Courses</option>
                  {courses.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Payment Mode */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Payment Mode</label>
                <select
                  value={postingFilters.paymentMode}
                  onChange={(e) => setPostingFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                >
                  <option value="All">All Modes</option>
                  <option value="Cash">Cash Only</option>
                  <option value="UPI">UPI / QR</option>
                  <option value="Bank Transfer">Bank Transfer / NEFT</option>
                  <option value="Cheque">Cheque / DD</option>
                </select>
              </div>

              {/* Search */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Search Student</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Name / Reg ID..."
                    value={postingFilters.search}
                    onChange={(e) => setPostingFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="classy-card bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20 p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Collection</span>
              <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
                ₹{postingData.totalAmount.toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">{postingData.totalTransactions} total transactions</span>
            </div>

            <div className="classy-card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cash Collections</span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-1">
                ₹{(postingData.modeBreakdown.Cash || 0).toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Physical Cash Handover</span>
            </div>

            <div className="classy-card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">Digital / UPI & Online</span>
              <h3 className="text-2xl font-black text-purple-700 dark:text-purple-300 mt-1">
                ₹{((postingData.modeBreakdown.UPI || 0) + (postingData.modeBreakdown.Online || 0)).toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">QR / UPI / Portal Gateway</span>
            </div>

            <div className="classy-card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">Bank Transfer / Cheque</span>
              <h3 className="text-2xl font-black text-blue-700 dark:text-blue-300 mt-1">
                ₹{((postingData.modeBreakdown.Bank || 0) + (postingData.modeBreakdown.Cheque || 0)).toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Direct Clearing & DDs</span>
            </div>
          </div>

          {/* Posting Table & Export Actions */}
          <div className="classy-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-warm-200/50 dark:border-darkbg-border">
              <div>
                <h3 className="text-sm font-bold text-warm-900 dark:text-white">Fees Posting Register</h3>
                <p className="text-[11px] text-slate-500 font-medium">Itemized receipt-by-receipt transaction audit log</p>
              </div>

              <div className="flex items-center space-x-2 no-print">
                <button
                  onClick={exportPostingListToExcel}
                  className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-warm-100 hover:bg-warm-200 text-warm-900 dark:bg-darkbg-base dark:text-slate-200 text-xs font-bold transition-all flex items-center space-x-1.5"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Register</span>
                </button>
              </div>
            </div>

            {/* Official Print Header */}
            <div className="hidden print:block text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider">B.J.S. Rampuria Jain Law College</h2>
              <p className="text-xs text-slate-600">Official Fees Posting & Collection Register</p>
              <p className="text-[11px] text-slate-500 mt-1">
                Filter: Session: {postingFilters.session} | Course: {postingFilters.course} | Period: {postingFilters.startDate || 'Beginning'} to {postingFilters.endDate || 'Present'}
              </p>
            </div>

            {postingLoading ? (
              <Loading size="md" text="Loading posting list..." />
            ) : postingData.records.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No fee posting transactions found matching the selected filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                      <th className="px-3 py-2.5">S.No</th>
                      <th className="px-3 py-2.5">Receipt No</th>
                      <th className="px-3 py-2.5">Posting Date</th>
                      <th className="px-3 py-2.5">Reg ID</th>
                      <th className="px-3 py-2.5">Student Name</th>
                      <th className="px-3 py-2.5">Course / Class</th>
                      <th className="px-3 py-2.5">Fee Particulars</th>
                      <th className="px-3 py-2.5">Payment Mode</th>
                      <th className="px-3 py-2.5 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                    {postingData.records.map((r, i) => (
                      <tr key={r.id || i} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/30 transition-colors">
                        <td className="px-3 py-2.5 font-mono text-slate-400">{i + 1}</td>
                        <td className="px-3 py-2.5 font-mono font-bold text-brand-600 dark:text-brand-400">
                          {r.receiptNo || `REC-${r.id}`}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 font-medium">
                          {r.paymentDate || new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-800 dark:text-slate-200">
                          {r.student?.registrationId || 'N/A'}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-warm-900 dark:text-slate-100">
                          {r.student?.fullName || 'N/A'}
                        </td>
                        <td className="px-3 py-2.5">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800 dark:text-slate-200">{r.student?.courseApplied}</span>
                            <span className="text-[10px] text-slate-400">{r.student?.academicSession} • {r.student?.academicYear}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 font-medium">
                          {r.feeHead || 'Tuition / Installment'}
                        </td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            r.paymentMode === 'Cash' 
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400' 
                              : r.paymentMode === 'UPI' 
                                ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400'
                                : 'bg-blue-500/10 text-blue-700 dark:text-blue-400'
                          }`}>
                            {r.paymentMode || 'Cash'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-slate-900 dark:text-white">
                          ₹{Number(r.amountPaid || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    <tr className="bg-warm-100/40 dark:bg-darkbg-base font-bold border-t-2 border-slate-300 dark:border-slate-700">
                      <td colSpan="8" className="px-3 py-3 text-right uppercase tracking-wider text-xs">Grand Total Collections:</td>
                      <td className="px-3 py-3 text-right text-sm font-black text-emerald-600 dark:text-emerald-400">
                        ₹{postingData.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Print Sign Box */}
            <div className="hidden print:flex justify-between pt-16 text-xs font-bold text-slate-800">
              <div className="text-center w-48 border-t pt-2">Accounts Clerk</div>
              <div className="text-center w-48 border-t pt-2">Accountant Verified</div>
              <div className="text-center w-48 border-t pt-2">Principal Sign & Seal</div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ─── TAB 2: DAY BOOK (DAILY CASH & INFLOW REGISTER) ─── */}
      {/* ========================================================= */}
      {activeTab === 'day-book' && (
        <div className="space-y-6">
          
          {/* Day Book Control Bar */}
          <div className="classy-card flex flex-wrap items-end justify-between gap-4 no-print">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Select Day Book Date</label>
                <input
                  type="date"
                  value={dayBookDate}
                  onChange={(e) => setDayBookDate(e.target.value)}
                  className="px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold text-warm-900 dark:text-white"
                />
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Session</label>
                <select
                  value={dayBookSession}
                  onChange={(e) => setDayBookSession(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                >
                  <option value="All">All Sessions</option>
                  {sessions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-wider">Payment Channel</label>
                <select
                  value={dayBookMode}
                  onChange={(e) => setDayBookMode(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold"
                >
                  <option value="All">All Channels</option>
                  <option value="Cash">Cash Only</option>
                  <option value="UPI">UPI / Online Only</option>
                  <option value="Bank Transfer">Bank Clearing</option>
                </select>
              </div>

              <button
                onClick={() => setDayBookDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 bg-warm-100 dark:bg-darkbg-base rounded-xl text-xs font-bold hover:bg-brand-50 text-slate-700 dark:text-slate-300"
              >
                Today's Book
              </button>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={exportDayBookToExcel}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export Day Book (.xlsx)</span>
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Day Book</span>
              </button>
            </div>
          </div>

          {/* Day Book Overview Summary KPI */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 no-print">
            <div className="classy-card bg-emerald-500/10 border-emerald-500/20 p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">Total Day Collection</span>
              <h3 className="text-2xl font-black text-emerald-800 dark:text-emerald-300 mt-1">
                ₹{dayBookData.totalAmount.toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">{dayBookData.voucherCount} Vouchers Cleared</span>
            </div>

            <div className="classy-card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400">Cash in Hand</span>
              <h3 className="text-2xl font-black text-amber-800 dark:text-amber-300 mt-1">
                ₹{dayBookData.cashTotal.toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Ready for Bank Deposit</span>
            </div>

            <div className="classy-card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400">UPI / QR Digital</span>
              <h3 className="text-2xl font-black text-purple-800 dark:text-purple-300 mt-1">
                ₹{dayBookData.upiTotal.toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Direct Account Inflow</span>
            </div>

            <div className="classy-card p-5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400">Bank / Cheques</span>
              <h3 className="text-2xl font-black text-blue-800 dark:text-blue-300 mt-1">
                ₹{(dayBookData.bankTotal + dayBookData.chequeTotal).toLocaleString('en-IN')}
              </h3>
              <span className="text-[11px] text-slate-500 font-semibold">Cheques / NEFT</span>
            </div>
          </div>

          {/* Official Day Book Journal View */}
          <div className="classy-card space-y-4">
            {/* Printable Letterhead Header */}
            <div className="text-center border-b pb-4 mb-4">
              <h2 className="text-xl font-bold uppercase tracking-wider font-serif text-warm-900 dark:text-white">
                B.J.S. Rampuria Jain Law College, Bikaner
              </h2>
              <h3 className="text-sm font-bold uppercase tracking-wider text-brand-600 mt-0.5">
                Official Daily Accounting Day Book
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Journal Date: <strong>{new Date(dayBookDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
              </p>
            </div>

            {dayBookLoading ? (
              <Loading size="md" text="Loading day book vouchers..." />
            ) : dayBookData.vouchers.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-400">
                No financial receipts recorded for {dayBookDate}.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse border border-warm-200 dark:border-darkbg-border">
                  <thead>
                    <tr className="bg-warm-100/60 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-warm-200 dark:border-darkbg-border">
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Voucher #</th>
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Receipt No</th>
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Reg No</th>
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Student Particulars</th>
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Course & Session</th>
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Account Head</th>
                      <th className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">Payment Mode</th>
                      <th className="px-3 py-2.5 text-right">Debit / Inflow (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                    {dayBookData.vouchers.map((v, i) => (
                      <tr key={v.id || i} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/30">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-500 border-r border-warm-200/40 dark:border-darkbg-border">
                          {v.voucherNo}
                        </td>
                        <td className="px-3 py-2.5 font-mono font-bold text-brand-600 dark:text-brand-400 border-r border-warm-200/40 dark:border-darkbg-border">
                          {v.receiptNo || `REC-${v.id}`}
                        </td>
                        <td className="px-3 py-2.5 font-mono text-slate-800 dark:text-slate-200 border-r border-warm-200/40 dark:border-darkbg-border">
                          {v.student?.registrationId || 'N/A'}
                        </td>
                        <td className="px-3 py-2.5 font-bold text-warm-900 dark:text-slate-100 border-r border-warm-200/40 dark:border-darkbg-border">
                          {v.student?.fullName || 'N/A'}
                        </td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400 border-r border-warm-200/40 dark:border-darkbg-border">
                          {v.student?.courseApplied} ({v.student?.academicSession})
                        </td>
                        <td className="px-3 py-2.5 text-slate-700 dark:text-slate-300 border-r border-warm-200/40 dark:border-darkbg-border">
                          {v.feeHead || 'College Tuition Fees'}
                        </td>
                        <td className="px-3 py-2.5 border-r border-warm-200/40 dark:border-darkbg-border">
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{v.paymentMode || 'Cash'}</span>
                        </td>
                        <td className="px-3 py-2.5 text-right font-black text-slate-900 dark:text-white">
                          ₹{Number(v.amountPaid || 0).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Day Book Balancing Summary Row */}
                    <tr className="bg-warm-100 dark:bg-darkbg-base font-bold text-xs">
                      <td colSpan="7" className="px-3 py-3 text-right uppercase tracking-wider text-slate-800 dark:text-slate-200">
                        Total Day Cash & Digital Collection ({dayBookData.vouchers.length} Vouchers):
                      </td>
                      <td className="px-3 py-3 text-right font-black text-sm text-emerald-600 dark:text-emerald-400">
                        ₹{dayBookData.totalAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Cashier & Principal Verification Sign-Off Box */}
            <div className="pt-12 grid grid-cols-3 gap-6 text-center text-xs font-bold text-slate-800 dark:text-slate-300">
              <div className="border-t border-slate-400 pt-2">
                <span>Cashier / Terminal Operator</span>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Verified cash in drawer</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span>Chief Accountant / Bursar</span>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">Bank posting confirmed</p>
              </div>
              <div className="border-t border-slate-400 pt-2">
                <span>Principal / Authorized Seal</span>
                <p className="text-[10px] text-slate-400 font-normal mt-0.5">B.J.S. Rampuria Jain Law College</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ─── TAB 3: FEES AGGREGATE ANALYTICS ─── */}
      {/* ========================================================= */}
      {activeTab === 'fees-analytics' && (
        <div className="space-y-6">
          <div className="classy-card flex flex-wrap items-end gap-4 no-print">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={feesFilters.startDate}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">End Date</label>
              <input
                type="date"
                value={feesFilters.endDate}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Course</label>
              <select
                value={feesFilters.course}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, course: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Payment Mode</label>
              <select
                value={feesFilters.paymentMode}
                onChange={(e) => setFeesFilters(prev => ({ ...prev, paymentMode: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              >
                <option value="">All Modes</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
              </select>
            </div>
          </div>

          <div className="classy-card space-y-4">
            <div className="flex bg-warm-100 dark:bg-darkbg-base p-1 rounded-xl w-fit text-xs font-bold uppercase tracking-wider no-print">
              <button
                onClick={() => setFeesSubTab('daily')}
                className={`px-3 py-1.5 rounded-lg ${feesSubTab === 'daily' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Daily Summary
              </button>
              <button
                onClick={() => setFeesSubTab('monthly')}
                className={`px-3 py-1.5 rounded-lg ${feesSubTab === 'monthly' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Monthly Summary
              </button>
              <button
                onClick={() => setFeesSubTab('yearly')}
                className={`px-3 py-1.5 rounded-lg ${feesSubTab === 'yearly' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Yearly Summary
              </button>
            </div>

            {feesLoading ? (
              <Loading size="md" text="Calculating fee metrics..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                      <th className="px-4 py-3">Timeframe / Period</th>
                      <th className="px-4 py-3">Transactions Count</th>
                      <th className="px-4 py-3 text-right">Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border font-medium">
                    {feesSubTab === 'daily' && feesData.daily.map((d, i) => (
                      <tr key={i} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/30">
                        <td className="px-4 py-3 font-semibold">{d.paymentDate}</td>
                        <td className="px-4 py-3">{d.transactionCount} transactions</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">₹{Number(d.totalAmount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {feesSubTab === 'monthly' && feesData.monthly.map((m, i) => (
                      <tr key={i} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/30">
                        <td className="px-4 py-3 font-semibold">{m.year}-{String(m.month).padStart(2, '0')}</td>
                        <td className="px-4 py-3">{m.transactionCount} transactions</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">₹{Number(m.totalAmount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {feesSubTab === 'yearly' && feesData.yearly.map((y, i) => (
                      <tr key={i} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/30">
                        <td className="px-4 py-3 font-semibold">Year {y.year}</td>
                        <td className="px-4 py-3">{y.transactionCount} transactions</td>
                        <td className="px-4 py-3 text-right font-black text-emerald-600 dark:text-emerald-400">₹{Number(y.totalAmount).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ─── TAB 4: ADMISSIONS ANALYTICS ─── */}
      {/* ========================================================= */}
      {activeTab === 'admissions' && (
        <div className="space-y-6">
          <div className="classy-card flex flex-wrap items-end gap-4 no-print">
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Start Date</label>
              <input
                type="date"
                value={admissionsFilters.startDate}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">End Date</label>
              <input
                type="date"
                value={admissionsFilters.endDate}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              />
            </div>
            <div className="flex flex-col space-y-1">
              <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Course</label>
              <select
                value={admissionsFilters.course}
                onChange={(e) => setAdmissionsFilters(prev => ({ ...prev, course: e.target.value }))}
                className="px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
              >
                <option value="">All Courses</option>
                {courses.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="classy-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-warm-200/50 dark:border-darkbg-border">
              <h3 className="text-sm font-bold text-warm-900 dark:text-white">New Admissions Roster</h3>
              <button
                onClick={() => window.print()}
                className="px-3 py-1.5 rounded-lg bg-warm-100 dark:bg-darkbg-base text-xs font-bold no-print flex items-center space-x-1"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Roster</span>
              </button>
            </div>

            {admissionsLoading ? (
              <Loading size="md" text="Loading admissions records..." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                      <th className="px-3 py-2.5">Reg ID</th>
                      <th className="px-3 py-2.5">Student Name</th>
                      <th className="px-3 py-2.5">Course</th>
                      <th className="px-3 py-2.5">Category</th>
                      <th className="px-3 py-2.5">Gender</th>
                      <th className="px-3 py-2.5">Mobile</th>
                      <th className="px-3 py-2.5">Status</th>
                      <th className="px-3 py-2.5">Registered Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                    {admissionsData.logs.map((std) => (
                      <tr key={std.id} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/30">
                        <td className="px-3 py-2.5 font-mono font-bold text-slate-900 dark:text-white">{std.registrationId}</td>
                        <td className="px-3 py-2.5 font-bold text-warm-900 dark:text-slate-100">{std.fullName}</td>
                        <td className="px-3 py-2.5">{getCourseBadge(std.courseApplied)}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{std.category}</td>
                        <td className="px-3 py-2.5 text-slate-600 dark:text-slate-400">{std.gender}</td>
                        <td className="px-3 py-2.5 font-mono">{std.mobileNumber}</td>
                        <td className="px-3 py-2.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                            std.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                          }`}>
                            {std.verificationStatus || 'Pending'}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-slate-500">{new Date(std.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default Reports;
