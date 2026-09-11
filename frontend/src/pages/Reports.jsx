import React, { useState, useEffect } from 'react';
import { 
  FileText, CreditCard, UserCheck, Calendar, Search, 
  Filter, Printer, ArrowUpRight, TrendingUp, AlertCircle, 
  DollarSign, CheckSquare, Square, Eye, RotateCcw, HelpCircle,
  Download, BookOpen, Layers, Clock, ShieldCheck, User, Plus,
  ArrowDownRight, CheckCircle2, RefreshCw, X, AlertTriangle, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import Loading from '../components/Loading';
import Toast from '../components/Toast';
import PrintReceiptModal from '../components/PrintReceiptModal';
import ExpenseModal from '../components/ExpenseModal';
import { useSession } from '../context/SessionContext';

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
    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider whitespace-nowrap ${colorClasses}`}>
      {course}
    </span>
  );
};

const Reports = () => {
  const navigate = useNavigate();
  const { activeSession, sessions: availableSessions } = useSession();

  // Active Main Tab: 'day-book' | 'fees-posting' | 'defaulters' | 'head-summary' | 'expenses' | 'admissions'
  const [activeTab, setActiveTab] = useState('day-book');
  const [toast, setToast] = useState(null);

  // Modals state
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);

  // Filter Presets Helper
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };
  const getFirstDayOfMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  };

  // Global Filter State
  const [filterSession, setFilterSession] = useState(activeSession || '2025-26');
  const [filterCourse, setFilterCourse] = useState('All');
  const [filterPaymentMode, setFilterPaymentMode] = useState('All');
  const [dateRangePreset, setDateRangePreset] = useState('today'); // 'today' | 'yesterday' | 'this_month' | 'all' | 'custom'
  const [startDate, setStartDate] = useState(getTodayStr());
  const [endDate, setEndDate] = useState(getTodayStr());
  const [searchQuery, setSearchQuery] = useState('');

  // Course list
  const coursesList = [
    'All',
    'B.A. L.L.B. Integrated',
    'Bachelor of Laws (L.L.B.)',
    'Master of Laws (L.L.M.)',
    'LL.B. I & II Semester',
    'LL.B. III & IV Semester',
    'LL.B. IInd Year (Annual)',
    'LL.B. IIIrd Year (Annual)',
    'PGDCC & PGDLL',
    'LL.M. PART - I',
    'LL.M. PART - II'
  ];

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleDatePreset = (preset) => {
    setDateRangePreset(preset);
    if (preset === 'today') {
      setStartDate(getTodayStr());
      setEndDate(getTodayStr());
    } else if (preset === 'yesterday') {
      setStartDate(getYesterdayStr());
      setEndDate(getYesterdayStr());
    } else if (preset === 'this_month') {
      setStartDate(getFirstDayOfMonthStr());
      setEndDate(getTodayStr());
    } else if (preset === 'all') {
      setStartDate('');
      setEndDate('');
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 1. UNIFIED DAY BOOK STATE & FETCHER
  // ─────────────────────────────────────────────────────────────
  const [dayBookLoading, setDayBookLoading] = useState(false);
  const [dayBookData, setDayBookData] = useState({
    startDate: '',
    endDate: '',
    openingBalance: { total: 0, cash: 0, bank: 0 },
    summary: {
      totalReceipts: 0,
      cashReceipts: 0,
      onlineReceipts: 0,
      totalExpenses: 0,
      cashExpenses: 0,
      bankExpenses: 0,
      netCashflow: 0,
      closingBalance: 0,
      closingCash: 0,
      closingBank: 0,
      transactionCount: 0
    },
    vouchers: []
  });

  const fetchDayBook = async () => {
    setDayBookLoading(true);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterSession && filterSession !== 'All') params.append('session', filterSession);
      if (filterPaymentMode && filterPaymentMode !== 'All') params.append('paymentMode', filterPaymentMode);

      const res = await fetch(`/api/reports/day-book?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDayBookData(data);
      } else {
        showToastMsg(data.message || 'Failed to load Day Book', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setDayBookLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 2. DATE-WISE COLLECTION REPORT STATE & FETCHER
  // ─────────────────────────────────────────────────────────────
  const [postingLoading, setPostingLoading] = useState(false);
  const [postingData, setPostingData] = useState({
    totalAmount: 0,
    totalTransactions: 0,
    modeBreakdown: {},
    headBreakdown: {},
    records: []
  });

  const fetchPostingReport = async () => {
    setPostingLoading(true);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterSession && filterSession !== 'All') params.append('session', filterSession);
      if (filterCourse && filterCourse !== 'All') params.append('course', filterCourse);
      if (filterPaymentMode && filterPaymentMode !== 'All') params.append('paymentMode', filterPaymentMode);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/reports/fees-posting?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setPostingData(data);
      } else {
        showToastMsg(data.message || 'Failed to load fees collection', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setPostingLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 3. STUDENT DEFAULTER / OUTSTANDING LIST STATE & FETCHER
  // ─────────────────────────────────────────────────────────────
  const [defaultersLoading, setDefaultersLoading] = useState(false);
  const [defaultersData, setDefaultersData] = useState({
    summary: {
      totalDefaultersCount: 0,
      totalStudentsEvaluated: 0,
      totalExpectedFees: 0,
      totalCollectedFees: 0,
      totalOutstandingDueFees: 0,
      collectionPercentage: 0
    },
    defaulters: []
  });

  const fetchDefaulters = async () => {
    setDefaultersLoading(true);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (filterSession && filterSession !== 'All') params.append('session', filterSession);
      if (filterCourse && filterCourse !== 'All') params.append('course', filterCourse);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/reports/defaulters?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDefaultersData(data);
      } else {
        showToastMsg(data.message || 'Failed to load defaulters list', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setDefaultersLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 4. HEAD-WISE FEE SUMMARY STATE & FETCHER
  // ─────────────────────────────────────────────────────────────
  const [headLoading, setHeadLoading] = useState(false);
  const [headData, setHeadData] = useState({
    studentCount: 0,
    grandTotals: {
      grandTotalExpected: 0,
      grandTotalCollected: 0,
      grandTotalPending: 0,
      overallPercentage: 0
    },
    headBreakdown: []
  });

  const fetchHeadSummary = async () => {
    setHeadLoading(true);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (filterSession && filterSession !== 'All') params.append('session', filterSession);
      if (filterCourse && filterCourse !== 'All') params.append('course', filterCourse);

      const res = await fetch(`/api/reports/head-summary?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setHeadData(data);
      } else {
        showToastMsg(data.message || 'Failed to load head summary', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setHeadLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // 5. EXPENSES / DEBIT VOUCHERS STATE & FETCHER
  // ─────────────────────────────────────────────────────────────
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [expensesData, setExpensesData] = useState({
    stats: {
      totalAmount: 0,
      cashTotal: 0,
      bankTotal: 0,
      totalCount: 0,
      categoryBreakdown: {}
    },
    expenses: []
  });

  const fetchExpenses = async () => {
    setExpensesLoading(true);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (filterSession && filterSession !== 'All') params.append('session', filterSession);
      if (filterPaymentMode && filterPaymentMode !== 'All') params.append('paymentMode', filterPaymentMode);
      if (searchQuery) params.append('search', searchQuery);
      params.append('limit', '100');

      const res = await fetch(`/api/expenses?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setExpensesData(data);
      } else {
        showToastMsg(data.message || 'Failed to load expenses', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setExpensesLoading(false);
    }
  };

  // Trigger appropriate fetcher when tab or filter changes
  useEffect(() => {
    if (activeTab === 'day-book') fetchDayBook();
    else if (activeTab === 'fees-posting') fetchPostingReport();
    else if (activeTab === 'defaulters') fetchDefaulters();
    else if (activeTab === 'head-summary') fetchHeadSummary();
    else if (activeTab === 'expenses') fetchExpenses();
  }, [activeTab, startDate, endDate, filterSession, filterCourse, filterPaymentMode]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (activeTab === 'day-book') fetchDayBook();
    else if (activeTab === 'fees-posting') fetchPostingReport();
    else if (activeTab === 'defaulters') fetchDefaulters();
    else if (activeTab === 'head-summary') fetchHeadSummary();
    else if (activeTab === 'expenses') fetchExpenses();
  };

  // ─────────────────────────────────────────────────────────────
  // UNIVERSAL EXCEL EXPORT ENGINE
  // ─────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    try {
      let exportRows = [];
      let filename = `Report_${activeTab}_${getTodayStr()}.xlsx`;

      if (activeTab === 'day-book') {
        exportRows = dayBookData.vouchers.map(v => ({
          'Sr No': v.srNo,
          'Voucher No': v.voucherNo,
          'Date': v.date,
          'Type': v.transactionType,
          'Particulars': v.particulars,
          'Account Head': v.accountHead,
          'Ref / Roll No': v.refNo,
          'Payment Mode': v.paymentMode,
          'Credit (Inflow ₹)': v.credit || 0,
          'Debit (Outflow ₹)': v.debit || 0,
          'Running Balance (₹)': v.runningBalance,
          'Handled By': v.handledBy,
          'Narration': v.narration || ''
        }));
        filename = `DayBook_Register_${startDate || 'All'}_to_${endDate || 'All'}.xlsx`;
      } else if (activeTab === 'fees-posting') {
        exportRows = postingData.records.map(r => ({
          'Sr No': r.srNo,
          'Receipt No': r.receiptNo,
          'Date': r.paymentDate,
          'Student Name': r.student?.fullName || '',
          'Father Name': r.student?.fatherName || '',
          'Scholar / Reg No': r.student?.registrationId || r.student?.srNo || '',
          'Course': r.student?.courseApplied || '',
          'Year / Sem': `${r.student?.academicYear || '1st Year'} - ${r.student?.semester || 'Annual'}`,
          'Fee Head': r.feeHead,
          'Payment Mode': r.paymentMode,
          'Transaction ID / UTR': r.transactionNo || '',
          'Paid Amount (₹)': r.amountPaid,
          'Remarks': r.remarks || ''
        }));
        filename = `Fees_Collection_Report_${startDate || 'All'}_to_${endDate || 'All'}.xlsx`;
      } else if (activeTab === 'defaulters') {
        exportRows = defaultersData.defaulters.map(d => ({
          'Sr No': d.srNo,
          'Student Name': d.fullName,
          'Father Name': d.fatherName,
          'Scholar / Reg No': d.registrationId,
          'Contact Mobile': d.mobileNumber,
          'Course': d.courseApplied,
          'Year / Sem': `${d.currentYear} (${d.currentSemester})`,
          'Session': d.academicSession,
          'Total Course Fee (₹)': d.totalCourseFee,
          'Total Paid (₹)': d.totalPaid,
          'Balance Due (₹)': d.balanceDue,
          'Due Date': d.dueDate,
          'Last Payment Date': d.lastPaymentDate,
          'Status': d.status
        }));
        filename = `Student_Outstanding_Defaulters_${getTodayStr()}.xlsx`;
      } else if (activeTab === 'head-summary') {
        exportRows = headData.headBreakdown.map(h => ({
          'Fee Category / Head': h.feeHead,
          'Per Student Rate (₹)': h.perStudentRate,
          'Student Count': h.studentCount,
          'Total Expected (₹)': h.totalExpected,
          'Total Collected (₹)': h.totalCollected,
          'Total Pending (₹)': h.totalPending,
          'Collection %': `${h.collectionPercentage}%`
        }));
        filename = `HeadWise_Fee_Summary_${getTodayStr()}.xlsx`;
      } else if (activeTab === 'expenses') {
        exportRows = expensesData.expenses.map((e, idx) => ({
          'Sr No': idx + 1,
          'Voucher No': e.voucherNo,
          'Expense Date': e.expenseDate,
          'Category': e.category,
          'Paid To (Vendor)': e.paidTo,
          'Amount (₹)': e.amount,
          'Payment Mode': e.paymentMode,
          'Transaction Ref / Bill No': e.transactionRef || '',
          'Narration': e.narration || '',
          'Session': e.academicSession,
          'Authorized By': e.authorizedBy
        }));
        filename = `Expenses_Register_${startDate || 'All'}_to_${endDate || 'All'}.xlsx`;
      }

      if (exportRows.length === 0) {
        showToastMsg('No data rows available to export for this selection', 'error');
        return;
      }

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
      XLSX.writeFile(workbook, filename);
      showToastMsg(`Exported ${exportRows.length} rows to Excel successfully!`, 'success');
    } catch (err) {
      showToastMsg('Failed to export Excel file', 'error');
    }
  };

  const handlePrintReceiptClick = (paymentObj) => {
    setSelectedReceipt(paymentObj);
    setShowReceiptModal(true);
  };

  const handleOpenExpenseModal = (exp = null) => {
    setEditingExpense(exp);
    setShowExpenseModal(true);
  };

  const handleExpenseSaved = () => {
    showToastMsg('Expense voucher recorded and posted to Day Book!', 'success');
    if (activeTab === 'expenses') fetchExpenses();
    if (activeTab === 'day-book') fetchDayBook();
  };

  const handleDeleteExpense = async (id) => {
    if (!window.confirm('Are you sure you want to delete this expense voucher? This will adjust the day book balances.')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/expenses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToastMsg('Expense voucher deleted', 'success');
        fetchExpenses();
      } else {
        const data = await res.json();
        showToastMsg(data.message || 'Failed to delete expense', 'error');
      }
    } catch (e) {
      showToastMsg('Server error deleting expense', 'error');
    }
  };

  const handleSeedDemoData = async () => {
    const token = localStorage.getItem('token');
    try {
      showToastMsg('Generating realistic Law College finance demo records...', 'info');
      const res = await fetch('/api/reports/seed-demo-data', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg('✓ Sample Day Book, Fee Receipts, and Expense vouchers populated successfully!', 'success');
        if (activeTab === 'day-book') fetchDayBook();
        else if (activeTab === 'fees-posting') fetchPostingReport();
        else if (activeTab === 'defaulters') fetchDefaulters();
        else if (activeTab === 'head-summary') fetchHeadSummary();
        else if (activeTab === 'expenses') fetchExpenses();
      } else {
        showToastMsg(data.message || 'Failed to seed demo data', 'error');
      }
    } catch (err) {
      showToastMsg('Server error seeding data', 'error');
    }
  };

  return (
    <div className="flex flex-col space-y-6 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Printable Receipt Modal */}
      <PrintReceiptModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        payment={selectedReceipt}
        student={selectedReceipt?.student}
      />

      {/* Expense Creator / Editor Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseSaved={handleExpenseSaved}
        editingExpense={editingExpense}
        activeSession={filterSession}
      />

      {/* Top Header & Master Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkbg-surface p-5 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-xl">
              <CreditCard className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-xl font-serif font-black text-warm-900 dark:text-slate-100 tracking-tight">
                Finance & Day Book Central Hub
              </h1>
              <p className="text-xs text-warm-700 dark:text-slate-400">
                Double-Entry Daily Transaction Register, Expense Tracking & Audit-Ready Fee Reports
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={handleSeedDemoData}
            className="px-3.5 py-2.5 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-1.5 active:scale-95"
            title="Populate realistic dummy finance and day book entries"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Load Sample Demo Data</span>
          </button>

          <button
            onClick={() => handleOpenExpenseModal(null)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-2 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense (Debit)</span>
          </button>

          <button
            onClick={exportToExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center space-x-2 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-warm-100 dark:bg-darkbg-base hover:bg-warm-200 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            title="Print Current Report View"
          >
            <Printer className="w-4 h-4" />
            <span>Print View</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center space-x-2 border-b border-warm-200/60 dark:border-darkbg-border pb-1 overflow-x-auto no-print">
        <button
          onClick={() => setActiveTab('day-book')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'day-book'
              ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-surface'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Unified Day Book (Ledger)</span>
        </button>

        <button
          onClick={() => setActiveTab('fees-posting')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'fees-posting'
              ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-surface'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Daily Collection Register</span>
        </button>

        <button
          onClick={() => setActiveTab('defaulters')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'defaulters'
              ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-surface'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>Outstanding / Defaulters</span>
        </button>

        <button
          onClick={() => setActiveTab('head-summary')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'head-summary'
              ? 'bg-brand-600 text-white shadow-sm dark:bg-brand-500'
              : 'text-slate-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-surface'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Head-Wise Fee Summary</span>
        </button>

        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'expenses'
              ? 'bg-rose-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-surface'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Expenses & Debit Vouchers</span>
        </button>
      </div>

      {/* Global Filter Bar */}
      <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm space-y-3 no-print">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Presets Button Group */}
          <div className="flex items-center space-x-1.5 bg-warm-100 dark:bg-darkbg-base p-1 rounded-xl">
            <button
              onClick={() => handleDatePreset('today')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRangePreset === 'today'
                  ? 'bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => handleDatePreset('yesterday')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRangePreset === 'yesterday'
                  ? 'bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Yesterday
            </button>
            <button
              onClick={() => handleDatePreset('this_month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRangePreset === 'this_month'
                  ? 'bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => handleDatePreset('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRangePreset === 'all'
                  ? 'bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              All Time
            </button>
          </div>

          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-2 flex-1 max-w-sm">
            <div className="relative w-full">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Receipt, Student, Vendor, Roll No..."
                className="w-full pl-9 pr-3 py-1.5 bg-warm-50 dark:bg-darkbg-base border border-warm-200 dark:border-darkbg-border rounded-xl text-xs font-semibold text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:border-brand-500 outline-none transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-3 py-1.5 bg-brand-600 text-white rounded-xl text-xs font-bold hover:bg-brand-700 transition-all"
            >
              Filter
            </button>
          </form>

        </div>

        {/* Extended Filter Dropdowns */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-warm-100 dark:border-darkbg-border/60 text-xs">
          
          {/* Start Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">From Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => { setStartDate(e.target.value); setDateRangePreset('custom'); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base font-semibold text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">To Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => { setEndDate(e.target.value); setDateRangePreset('custom'); }}
              className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base font-semibold text-slate-800 dark:text-slate-200 outline-none"
            />
          </div>

          {/* Academic Session */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Session</label>
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="All">All Sessions</option>
              {availableSessions && availableSessions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
              <option value="2025-26">2025-26 (Active)</option>
              <option value="2024-25">2024-25</option>
              <option value="2026-27">2026-27</option>
            </select>
          </div>

          {/* Course Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course / Class</label>
            <select
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              {coursesList.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Payment Mode Filter */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Payment Mode</label>
            <select
              value={filterPaymentMode}
              onChange={(e) => setFilterPaymentMode(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base font-semibold text-slate-800 dark:text-slate-200 outline-none cursor-pointer"
            >
              <option value="All">All Modes</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI / Online</option>
              <option value="Net Banking">Net Banking / NEFT</option>
              <option value="Cheque">Cheque</option>
              <option value="DD">Demand Draft</option>
            </select>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          TAB 1: UNIFIED DAY BOOK REGISTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'day-book' && (
        <div className="space-y-6">
          {/* Dynamic KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Opening Balance */}
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Opening Balance (B/F)</span>
                <span className="p-1.5 bg-blue-500/10 text-blue-600 rounded-lg">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black font-mono text-slate-900 dark:text-slate-100">
                ₹{(dayBookData.openingBalance.total || 0).toLocaleString('en-IN')}/-
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-darkbg-border">
                <span>Cash: ₹{(dayBookData.openingBalance.cash || 0).toLocaleString('en-IN')}</span>
                <span>Bank: ₹{(dayBookData.openingBalance.bank || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Card 2: Total Fees Collected (Inflow) */}
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Total Credits (Fee Inflow)</span>
                <span className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">
                + ₹{(dayBookData.summary.totalReceipts || 0).toLocaleString('en-IN')}/-
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-darkbg-border">
                <span>Cash: ₹{(dayBookData.summary.cashReceipts || 0).toLocaleString('en-IN')}</span>
                <span>Online: ₹{(dayBookData.summary.onlineReceipts || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Card 3: Total Expenses Paid (Outflow) */}
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Total Debits (Expense Outflow)</span>
                <span className="p-1.5 bg-rose-500/10 text-rose-600 rounded-lg">
                  <ArrowDownRight className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                - ₹{(dayBookData.summary.totalExpenses || 0).toLocaleString('en-IN')}/-
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2 pt-2 border-t border-slate-100 dark:border-darkbg-border">
                <span>Cash: ₹{(dayBookData.summary.cashExpenses || 0).toLocaleString('en-IN')}</span>
                <span>Bank: ₹{(dayBookData.summary.bankExpenses || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Card 4: Net Closing Balance */}
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-brand-500/30 dark:border-brand-500/40 shadow-sm bg-gradient-to-br from-brand-50/40 dark:from-brand-950/20 to-transparent">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-700 dark:text-brand-300">Net Closing Balance (C/F)</span>
                <span className="p-1.5 bg-brand-500/20 text-brand-700 dark:text-brand-300 rounded-lg">
                  <ShieldCheck className="w-4 h-4" />
                </span>
              </div>
              <div className="text-xl font-black font-mono text-brand-900 dark:text-brand-200">
                ₹{(dayBookData.summary.closingBalance || 0).toLocaleString('en-IN')}/-
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 mt-2 pt-2 border-t border-brand-200/50 dark:border-brand-800/50 font-semibold">
                <span>Cash in Hand: ₹{(dayBookData.summary.closingCash || 0).toLocaleString('en-IN')}</span>
                <span>Bank Balance: ₹{(dayBookData.summary.closingBank || 0).toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          {/* Unified Ledger Table */}
          <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 flex items-center space-x-2">
                  <span>Unified Daily Transaction Ledger</span>
                  <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-darkbg-base text-[10px] font-mono text-slate-600 dark:text-slate-300">
                    {dayBookData.vouchers.length} Entries
                  </span>
                </h3>
                <p className="text-xs text-warm-700 dark:text-slate-400">
                  Chronological double-entry cashflow records with dynamic running balance
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
                <span>Period: {startDate || 'Beginning'} to {endDate || 'Today'}</span>
              </div>
            </div>

            {dayBookLoading ? (
              <div className="py-16 text-center">
                <Loading size="md" text="Compiling day book ledger..." />
              </div>
            ) : dayBookData.vouchers.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <BookOpen className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No monetary transactions logged for this selected date range.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-50/80 dark:bg-darkbg-base/80 text-[10px] font-black uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-3 px-3 text-center w-12">Sr. No.</th>
                      <th className="py-3 px-3">Voucher / Rec. No</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-4">Account / Particulars</th>
                      <th className="py-3 px-3">Ref / Roll No</th>
                      <th className="py-3 px-3 text-center">Type</th>
                      <th className="py-3 px-3 text-center">Payment Mode</th>
                      <th className="py-3 px-3 text-right text-emerald-600">Credit (₹ In)</th>
                      <th className="py-3 px-3 text-right text-rose-600">Debit (₹ Out)</th>
                      <th className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">Balance (₹)</th>
                      <th className="py-3 px-3 text-center">Handled By</th>
                      <th className="py-3 px-3 text-center no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border/60">
                    {dayBookData.vouchers.map((row) => (
                      <tr key={row.id} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/50 transition-colors">
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-400">{row.srNo}</td>
                        <td className="py-3 px-3 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">
                          {row.voucherNo}
                        </td>
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-300 whitespace-nowrap">{row.date}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${row.transactionType === 'Credit' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                            <div>
                              <span className="font-bold text-slate-900 dark:text-slate-100 block">{row.particulars}</span>
                              <span className="text-[10px] text-slate-500">{row.accountHead} {row.narration ? `— ${row.narration}` : ''}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{row.refNo || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            row.transactionType === 'Credit' 
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300' 
                              : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                          }`}>
                            {row.transactionType === 'Credit' ? 'Receipt (Inflow)' : 'Payment (Outflow)'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-slate-100 dark:bg-darkbg-base text-slate-700 dark:text-slate-300">
                            {row.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {row.credit > 0 ? `+ ₹${row.credit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-rose-600 dark:text-rose-400">
                          {row.debit > 0 ? `- ₹${row.debit.toLocaleString('en-IN')}` : '-'}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                          ₹{row.runningBalance.toLocaleString('en-IN')}/-
                        </td>
                        <td className="py-3 px-3 text-center font-semibold text-[11px] text-slate-600 dark:text-slate-400">
                          {row.handledBy || 'Accountant'}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          {row.sourceType === 'FEE_PAYMENT' ? (
                            <button
                              onClick={() => handlePrintReceiptClick(row.receiptData)}
                              className="p-1.5 hover:bg-brand-50 text-brand-600 dark:text-brand-400 rounded-lg transition-all"
                              title="Print Official Fee Receipt"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">Voucher</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-warm-100/70 dark:bg-darkbg-base/90 font-black text-xs border-t-2 border-slate-300 dark:border-darkbg-border">
                      <td colSpan="7" className="py-3 px-4 text-right uppercase text-slate-700 dark:text-slate-300">
                        Period Net Summary & Final Closing Balance:
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                        + ₹{(dayBookData.summary.totalReceipts || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-rose-600 dark:text-rose-400">
                        - ₹{(dayBookData.summary.totalExpenses || 0).toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-brand-700 dark:text-brand-300">
                        ₹{(dayBookData.summary.closingBalance || 0).toLocaleString('en-IN')}/-
                      </td>
                      <td colSpan="2" className="no-print"></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 2: DAILY COLLECTION REGISTER
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'fees-posting' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Fees Collected</span>
              <div className="text-2xl font-black font-mono text-emerald-600">
                ₹{postingData.totalAmount.toLocaleString('en-IN')}/-
              </div>
            </div>
            <div className="flex items-center space-x-4 text-xs">
              <div className="text-right">
                <span className="text-slate-400 block text-[10px]">Total Receipts</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{postingData.totalTransactions} Items</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200/50 dark:border-darkbg-border">
              <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">Daily / Date-Wise Collection Report</h3>
              <p className="text-xs text-warm-700 dark:text-slate-400">Audit-ready receipt log with direct print action</p>
            </div>

            {postingLoading ? (
              <div className="py-16 text-center">
                <Loading size="md" text="Loading collection records..." />
              </div>
            ) : postingData.records.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <p className="text-xs">No fee payments found matching this criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-50/80 dark:bg-darkbg-base/80 text-[10px] font-black uppercase text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-3 px-3 text-center">S.No.</th>
                      <th className="py-3 px-3">Receipt No.</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Student Name</th>
                      <th className="py-3 px-3">Roll No. / Scholar No.</th>
                      <th className="py-3 px-3">Course & Semester</th>
                      <th className="py-3 px-3">Fee Head</th>
                      <th className="py-3 px-3 text-center">Payment Mode</th>
                      <th className="py-3 px-3">Transaction ID / UTR</th>
                      <th className="py-3 px-3 text-right">Paid Amount (₹)</th>
                      <th className="py-3 px-3 text-center no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border/60">
                    {postingData.records.map((row) => (
                      <tr key={row.id} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/50">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{row.srNo}</td>
                        <td className="py-3 px-3 font-mono font-bold text-brand-600 dark:text-brand-400">{row.receiptNo}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{row.paymentDate}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{row.student?.fullName || 'N/A'}</span>
                          <span className="text-[10px] text-slate-500">S/D/O {row.student?.fatherName || 'N/A'}</span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{row.student?.registrationId || row.student?.srNo || '-'}</td>
                        <td className="py-3 px-3">
                          {getCourseBadge(row.student?.courseApplied)}
                          <span className="text-[10px] text-slate-500 block mt-0.5">{row.student?.academicYear || '1st Year'} ({row.student?.semester || 'Annual'})</span>
                        </td>
                        <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">{row.feeHead}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-darkbg-base text-slate-700 dark:text-slate-300">
                            {row.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{row.transactionNo || row.transactionRef || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-slate-900 dark:text-slate-100">
                          ₹{(Number(row.amountPaid) || 0).toLocaleString('en-IN')}/-
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <button
                            onClick={() => handlePrintReceiptClick(row)}
                            className="px-2 py-1 bg-brand-50 dark:bg-brand-950/40 text-brand-600 dark:text-brand-400 rounded-lg font-bold text-[11px] hover:bg-brand-100 transition-all flex items-center space-x-1 mx-auto"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Print Receipt</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 3: STUDENT OUTSTANDING / DEFAULTER LIST
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'defaulters' && (
        <div className="space-y-6">
          {/* Defaulter Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Defaulter Students Count</span>
              <div className="text-2xl font-black font-mono text-rose-600 mt-1">
                {defaultersData.summary.totalDefaultersCount} Students
              </div>
              <span className="text-[10px] text-slate-400">Out of {defaultersData.summary.totalStudentsEvaluated} evaluated</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Outstanding Due Fees</span>
              <div className="text-2xl font-black font-mono text-rose-600 mt-1">
                ₹{defaultersData.summary.totalOutstandingDueFees.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">Total expected ₹{defaultersData.summary.totalExpectedFees.toLocaleString('en-IN')}</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Overall Collection Ratio</span>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                {defaultersData.summary.collectionPercentage}%
              </div>
              <span className="text-[10px] text-slate-400">₹{defaultersData.summary.totalCollectedFees.toLocaleString('en-IN')} collected</span>
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">Student Dues & Defaulter Register</h3>
                <p className="text-xs text-warm-700 dark:text-slate-400">Detailed balance pending breakdown for fee recovery notice generation</p>
              </div>
            </div>

            {defaultersLoading ? (
              <div className="py-16 text-center">
                <Loading size="md" text="Compiling student fee balances..." />
              </div>
            ) : defaultersData.defaulters.length === 0 ? (
              <div className="py-16 text-center text-emerald-600 space-y-1">
                <CheckCircle2 className="w-8 h-8 mx-auto" />
                <p className="text-xs font-bold">Excellent! Zero pending dues or defaulters found for this selection.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-50/80 dark:bg-darkbg-base/80 text-[10px] font-black uppercase text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-3 px-3 text-center">S.No.</th>
                      <th className="py-3 px-3">Student & Parent</th>
                      <th className="py-3 px-3">Scholar No</th>
                      <th className="py-3 px-3">Contact No</th>
                      <th className="py-3 px-3">Course & Year</th>
                      <th className="py-3 px-3 text-right">Total Fee (₹)</th>
                      <th className="py-3 px-3 text-right">Paid (₹)</th>
                      <th className="py-3 px-3 text-right text-rose-600">Balance Due (₹)</th>
                      <th className="py-3 px-3 text-center">Last Payment</th>
                      <th className="py-3 px-3 text-center no-print">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border/60">
                    {defaultersData.defaulters.map((d) => (
                      <tr key={d.studentId} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/50">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{d.srNo}</td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{d.fullName}</span>
                          <span className="text-[10px] text-slate-500">Father: {d.fatherName}</span>
                        </td>
                        <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">{d.registrationId}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{d.mobileNumber}</td>
                        <td className="py-3 px-3">
                          <div>{getCourseBadge(d.courseApplied)}</div>
                          <span className="text-[10px] text-slate-500 block mt-0.5">{d.currentYear} ({d.currentSemester})</span>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-slate-600 dark:text-slate-300">
                          ₹{d.totalCourseFee.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-semibold text-emerald-600">
                          ₹{d.totalPaid.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          ₹{d.balanceDue.toLocaleString('en-IN')}/-
                        </td>
                        <td className="py-3 px-3 text-center font-mono text-[11px] text-slate-500">
                          {d.lastPaymentDate}
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <button
                            onClick={() => navigate('/fees')}
                            className="px-2.5 py-1 bg-brand-600 hover:bg-brand-700 text-white rounded-lg text-[10px] font-bold transition-all shadow-sm"
                          >
                            Collect Fee
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 4: HEAD-WISE FEE SUMMARY
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'head-summary' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Total Expected Revenue</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                ₹{headData.grandTotals.grandTotalExpected.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">For {headData.studentCount} active enrolled students</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">Total Realized Collection</span>
              <div className="text-2xl font-black font-mono text-emerald-600 mt-1">
                ₹{headData.grandTotals.grandTotalCollected.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">Realization Rate: {headData.grandTotals.overallPercentage}%</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Pending Dues</span>
              <div className="text-2xl font-black font-mono text-rose-600 mt-1">
                ₹{headData.grandTotals.grandTotalPending.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">Institutional outstanding balance</span>
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200/50 dark:border-darkbg-border">
              <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">Fee Category & Head Breakdown</h3>
              <p className="text-xs text-warm-700 dark:text-slate-400">Auditing breakdown comparing institutional targets vs collections</p>
            </div>

            {headLoading ? (
              <div className="py-16 text-center">
                <Loading size="md" text="Aggregating fee heads..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-50/80 dark:bg-darkbg-base/80 text-[10px] font-black uppercase text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-3 px-4">Fee Category / Head</th>
                      <th className="py-3 px-3 text-right">Rate / Student (₹)</th>
                      <th className="py-3 px-3 text-right">Expected (₹)</th>
                      <th className="py-3 px-3 text-right text-emerald-600">Collected (₹)</th>
                      <th className="py-3 px-3 text-right text-rose-600">Pending (₹)</th>
                      <th className="py-3 px-4 text-center">Collection %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border/60">
                    {headData.headBreakdown.map((h, i) => (
                      <tr key={i} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/50">
                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100">
                          {h.feeHead}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                          ₹{h.perStudentRate.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                          ₹{h.totalExpected.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-emerald-600">
                          ₹{h.totalCollected.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-bold text-rose-600">
                          ₹{h.totalPending.toLocaleString('en-IN')}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="w-full bg-warm-100 dark:bg-darkbg-base rounded-full h-2 overflow-hidden">
                              <div
                                className="bg-brand-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, parseFloat(h.collectionPercentage))}%` }}
                              />
                            </div>
                            <span className="font-mono font-bold text-[10px] text-slate-700 dark:text-slate-300 w-10 text-right">
                              {h.collectionPercentage}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          TAB 5: EXPENSES & DEBIT VOUCHERS
      ───────────────────────────────────────────────────────────── */}
      {activeTab === 'expenses' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600">Total Expenses Disbursed</span>
              <div className="text-2xl font-black font-mono text-rose-600 mt-1">
                ₹{expensesData.stats.totalAmount.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">{expensesData.stats.totalCount} Debit Vouchers Created</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Cash Petty Disbursements</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                ₹{expensesData.stats.cashTotal.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">Direct cash outflow</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Bank / Online Disbursements</span>
              <div className="text-2xl font-black font-mono text-slate-900 dark:text-slate-100 mt-1">
                ₹{expensesData.stats.bankTotal.toLocaleString('en-IN')}/-
              </div>
              <span className="text-[10px] text-slate-400">UPI, Net Banking, Cheque</span>
            </div>
          </div>

          <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">Operational Expenses & Debit Vouchers</h3>
                <p className="text-xs text-warm-700 dark:text-slate-400">Manage vendor payments, utilities, and daily college outflows</p>
              </div>
              <button
                onClick={() => handleOpenExpenseModal(null)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Expense</span>
              </button>
            </div>

            {expensesLoading ? (
              <div className="py-16 text-center">
                <Loading size="md" text="Loading expense register..." />
              </div>
            ) : expensesData.expenses.length === 0 ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <DollarSign className="w-8 h-8 mx-auto opacity-40" />
                <p className="text-xs">No expense vouchers recorded for this period.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-warm-50/80 dark:bg-darkbg-base/80 text-[10px] font-black uppercase text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                    <tr>
                      <th className="py-3 px-3 text-center">S.No.</th>
                      <th className="py-3 px-3">Voucher No</th>
                      <th className="py-3 px-3">Date</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Paid To (Vendor)</th>
                      <th className="py-3 px-3 text-center">Mode</th>
                      <th className="py-3 px-3">Bill / Ref</th>
                      <th className="py-3 px-3 text-right text-rose-600">Amount (₹)</th>
                      <th className="py-3 px-3 text-center no-print">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border/60">
                    {expensesData.expenses.map((e, idx) => (
                      <tr key={e.id || e._id} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-base/50">
                        <td className="py-3 px-3 text-center font-mono text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-rose-600 dark:text-rose-400">{e.voucherNo}</td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{e.expenseDate}</td>
                        <td className="py-3 px-3">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-700 dark:text-amber-300">
                            {e.category}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-bold text-slate-900 dark:text-slate-100 block">{e.paidTo}</span>
                          {e.narration && <span className="text-[10px] text-slate-500 truncate max-w-xs block">{e.narration}</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 dark:bg-darkbg-base text-slate-700 dark:text-slate-300">
                            {e.paymentMode}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600 dark:text-slate-300">{e.transactionRef || '-'}</td>
                        <td className="py-3 px-3 text-right font-mono font-black text-rose-600 dark:text-rose-400 text-sm">
                          ₹{(Number(e.amount) || 0).toLocaleString('en-IN')}/-
                        </td>
                        <td className="py-3 px-3 text-center no-print">
                          <div className="flex items-center justify-center space-x-1.5">
                            {e.receiptFileUrl && (
                              <a
                                href={e.receiptFileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1 hover:bg-slate-100 dark:hover:bg-darkbg-base text-slate-600 rounded"
                                title="View Attached Receipt"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button
                              onClick={() => handleOpenExpenseModal(e)}
                              className="p-1 hover:bg-slate-100 dark:hover:bg-darkbg-base text-slate-600 rounded"
                              title="Edit Expense"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteExpense(e.id || e._id)}
                              className="p-1 hover:bg-rose-50 dark:hover:bg-rose-950 text-rose-600 rounded"
                              title="Delete Expense"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
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
