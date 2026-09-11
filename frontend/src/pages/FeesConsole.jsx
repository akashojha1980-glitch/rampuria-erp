import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, Search, ArrowUpRight, TrendingUp, 
  AlertCircle, DollarSign, Calendar, Eye, Filter,
  Printer, FileText, ChevronLeft, ChevronRight, Settings, Plus, BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import Loading from '../components/Loading';
import Toast from '../components/Toast';
import FeeStructureSettingsModal from '../components/FeeStructureSettingsModal';
import PrintReceiptModal from '../components/PrintReceiptModal';
import ExpenseModal from '../components/ExpenseModal';

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

import { useSession } from '../context/SessionContext';

const FeesConsole = () => {
  const navigate = useNavigate();
  const { activeSession, sessions } = useSession();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [showFeeSettings, setShowFeeSettings] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState(null);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  
  // Filters
  const [search, setSearch] = useState('');
  const [course, setCourse] = useState('');
  const [installment, setInstallment] = useState('');
  const [sessionFilter, setSessionFilter] = useState(activeSession || '2025-26');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'paid' | 'due'
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (activeSession) {
      setSessionFilter(activeSession);
    }
  }, [activeSession]);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handlePrintReceipt = (txn) => {
    setSelectedReceipt(txn);
    setShowPrintModal(true);
  };

  const fetchFeesData = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (course && course !== 'all') params.append('course', course);
      if (installment && installment !== 'all') params.append('installment', installment);
      if (sessionFilter && sessionFilter !== 'All Sessions') params.append('session', sessionFilter);
      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);
      params.append('page', page);
      params.append('limit', '25');

      const res = await fetch(`/api/fees/dashboard?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const resData = await res.json();
      if (res.ok) {
        setData(resData);
      } else {
        showToastMsg(resData.message || 'Error fetching fees statistics', 'error');
      }
    } catch (err) {
      showToastMsg('Database or server connection offline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeesData();
  }, [course, installment, sessionFilter, statusFilter, page]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchFeesData();
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 }
  };

  if (loading && !data) {
    return <Loading size="lg" text="Loading college fees console & compiling cashflow statistics..." />;
  }

  const stats = data?.stats || { totalCollected: 0, totalOutstanding: 0, totalTransactions: 0, fullyPaidCount: 0, pendingDueCount: 0 };
  const transactions = data?.transactions || [];

  return (
    <div className="flex flex-col space-y-8 font-sans">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PrintReceiptModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        payment={selectedReceipt}
        student={selectedReceipt?.student}
      />

      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onExpenseSaved={() => {
          showToastMsg('Expense recorded successfully!', 'success');
          fetchFeesData();
        }}
        activeSession={sessionFilter}
      />

      <FeeStructureSettingsModal
        isOpen={showFeeSettings}
        onClose={() => setShowFeeSettings(false)}
        onFeeUpdated={fetchFeesData}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 no-print">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-lg font-black text-warm-900 dark:text-white uppercase tracking-wider">Fees Central Console</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
              Session {sessionFilter}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 tracking-wider">B.J.S. Rampuria Jain Law College ERP • Fee Collection & Due Recovery</p>
        </div>

        {/* Action Controls & Status Filter Tab Pills */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => navigate('/reports')}
            className="px-3 py-2 bg-brand-50 hover:bg-brand-100 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Day Book Ledger</span>
          </button>

          <button
            onClick={() => setShowExpenseModal(true)}
            className="px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Record Expense</span>
          </button>

          <button
            onClick={() => setShowFeeSettings(true)}
            className="px-3.5 py-2 bg-white dark:bg-darkbg-surface hover:bg-warm-100/70 dark:hover:bg-darkbg-base border border-warm-200 dark:border-darkbg-border text-warm-900 dark:text-slate-100 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shadow-sm active:scale-95"
            title="Manage Course Fees, Installments & Caution Money"
          >
            <Settings className="w-4 h-4 text-brand-500" />
            <span>Class & Fee Settings</span>
          </button>

          <div className="flex items-center bg-warm-100 dark:bg-darkbg-surface p-1 rounded-xl border border-warm-200 dark:border-darkbg-border">
            <button
              onClick={() => { setStatusFilter('all'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'all' 
                  ? 'bg-white dark:bg-darkbg-base text-warm-900 dark:text-white shadow-sm' 
                  : 'text-warm-800/60 dark:text-slate-400 hover:text-warm-900'
              }`}
            >
              All ({stats.totalTransactions})
            </button>
            <button
              onClick={() => { setStatusFilter('paid'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'paid' 
                  ? 'bg-emerald-500 text-white shadow-sm' 
                  : 'text-warm-800/60 dark:text-slate-400 hover:text-emerald-600'
              }`}
            >
              ✓ Fully Paid ({stats.fullyPaidCount || 0})
            </button>
            <button
              onClick={() => { setStatusFilter('due'); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                statusFilter === 'due' 
                  ? 'bg-rose-500 text-white shadow-sm' 
                  : 'text-warm-800/60 dark:text-slate-400 hover:text-rose-600'
              }`}
            >
              ⚠️ Pending Due ({stats.pendingDueCount || 0})
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 no-print">
        
        {/* Total Collected */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3 }}
          className="classy-card relative overflow-hidden group border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-400 uppercase tracking-widest block">Total Collected</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">₹{stats.totalCollected.toLocaleString()}/-</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[10px] font-semibold text-warm-800/40 dark:text-slate-500">
            Total cash received in session {sessionFilter}
          </div>
        </motion.div>

        {/* Total Outstanding */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.05 }}
          className="classy-card relative overflow-hidden group border-l-4 border-l-rose-500"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-400 uppercase tracking-widest block">Total Outstanding Due</span>
              <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400 leading-none">₹{stats.totalOutstanding.toLocaleString()}/-</h3>
            </div>
            <div className="p-3 bg-rose-500/10 dark:bg-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[10px] font-semibold text-warm-800/40 dark:text-slate-500">
            Pending dues to be recovered from students
          </div>
        </motion.div>

        {/* Fully Paid Count */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.1 }}
          className="classy-card relative overflow-hidden group border-l-4 border-l-emerald-500"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-400 uppercase tracking-widest block">Paid Vouchers (Cleared)</span>
              <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400 leading-none">{stats.fullyPaidCount || 0}</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-2xl text-emerald-600 dark:text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[10px] font-semibold text-warm-800/40 dark:text-slate-500">
            Transactions with zero outstanding balance
          </div>
        </motion.div>

        {/* Pending Due Count */}
        <motion.div 
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.3, delay: 0.15 }}
          className="classy-card relative overflow-hidden group border-l-4 border-l-amber-500"
        >
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-[10px] font-bold text-warm-900/60 dark:text-slate-400 uppercase tracking-widest block">Pending Due Vouchers</span>
              <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400 leading-none">{stats.pendingDueCount || 0}</h3>
            </div>
            <div className="p-3 bg-amber-500/10 dark:bg-amber-500/20 rounded-2xl text-amber-600 dark:text-amber-400">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-4 text-[10px] font-semibold text-warm-800/40 dark:text-slate-500">
            Transactions requiring follow-up collection
          </div>
        </motion.div>

      </div>

      {/* Main Console Grid */}
      <div className="grid grid-cols-1 gap-6 no-print">
        
        {/* Live Filter Controls */}
        <div className="classy-card flex flex-wrap items-center justify-between gap-4">
          <form onSubmit={handleSearchSubmit} className="flex items-center space-x-3 w-full md:w-auto md:flex-1 max-w-md">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search by student name, reg ID or receipt no..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-warm-850 dark:text-slate-200 placeholder-warm-800/35 outline-none focus:border-brand-500 transition-colors"
              />
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-warm-800/35 dark:text-slate-500" />
            </div>
            <button type="submit" className="classy-btn-primary px-5 py-2.5 text-xs font-bold shrink-0">
              Search
            </button>
          </form>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {/* Session Selector */}
            <div className="flex items-center space-x-2">
              <select
                value={sessionFilter}
                onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold outline-none text-brand-600 dark:text-brand-400 cursor-pointer"
              >
                {sessions.map(s => (
                  <option key={s} value={s}>Session: {s}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="w-3.5 h-3.5 text-warm-800/40 dark:text-slate-500" />
              <select
                value={course}
                onChange={(e) => { setCourse(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-850 dark:text-slate-250 cursor-pointer"
              >
                <option value="">All Courses</option>
                <option value="LL.B.">LL.B.</option>
                <option value="LL.M.">LL.M.</option>
                <option value="B.A. LL.B.">B.A. LL.B.</option>
                <option value="BA-LLB">BA-LLB</option>
                <option value="BCA">BCA</option>
                <option value="BBA">BBA</option>
              </select>
            </div>

            {/* Installment Filter */}
            <div className="flex items-center space-x-2">
              <select
                value={installment}
                onChange={(e) => { setInstallment(e.target.value); setPage(1); }}
                className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-850 dark:text-slate-250 cursor-pointer"
              >
                <option value="">All Installments</option>
                <option value="1st Installment">1st Installment</option>
                <option value="2nd Installment">2nd Installment</option>
                <option value="Full Payment">Full Payment</option>
              </select>
            </div>
          </div>
        </div>

        {/* Global Transactions Log table */}
        <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
            <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-brand-500" />
              <span>Global Payment Logs & Audit Ledger</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-warm-50/50 dark:bg-darkbg-base/30 text-warm-800/40 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-warm-200/50 dark:border-darkbg-border">
                  <th className="px-6 py-4">Receipt No</th>
                  <th className="px-6 py-4">Student Name</th>
                  <th className="px-6 py-4">Course</th>
                  <th className="px-6 py-4">Term / Installment</th>
                  <th className="px-6 py-4 text-emerald-600">Amount Paid</th>
                  <th className="px-6 py-4 text-rose-600">Balance Due</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Method & Ref</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Profile</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-100/50 dark:divide-darkbg-border text-xs font-semibold text-slate-700 dark:text-slate-200">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-12 text-slate-400 italic font-medium">
                      No matching student installment receipts found for selected filters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((txn) => {
                    const isFullyPaid = !txn.amountDue || txn.amountDue === 0;

                    return (
                      <tr key={txn._id} className="hover:bg-warm-50/30 dark:hover:bg-darkbg-base/20 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-mono font-bold text-slate-900 dark:text-white">{txn.receiptNo}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-slate-900 dark:text-slate-200">{txn.student?.fullName || 'N/A'}</div>
                          <div className="text-[10px] text-slate-400 font-bold">{txn.student?.registrationId}</div>
                        </td>
                        <td className="px-6 py-4">
                          {getCourseBadge(txn.student?.courseApplied)}
                        </td>
                        <td className="px-6 py-4">
                          <div>{txn.academicYear}</div>
                          <div className="text-[10px] text-slate-400">{txn.installmentName}</div>
                        </td>
                        <td className="px-6 py-4 font-black text-emerald-600 dark:text-emerald-400">
                          ₹{txn.amountPaid.toLocaleString()}/-
                        </td>
                        <td className="px-6 py-4 font-bold text-rose-600 dark:text-rose-400">
                          {txn.amountDue > 0 ? `₹${txn.amountDue.toLocaleString()}/-` : '₹0/-'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            isFullyPaid 
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400'
                          }`}>
                            {isFullyPaid ? '✓ Paid' : `⚠️ Due: ₹${txn.amountDue}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>{txn.paymentMode}</div>
                          <div className="font-mono text-[10px] text-slate-500">
                            {txn.transactionNo || '—'}
                          </div>
                        </td>
                        <td className="px-6 py-4">{new Date(txn.paymentDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-1">
                            <button
                              onClick={() => handlePrintReceipt(txn)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                              title="Print Official Fee Receipt"
                            >
                              <Printer className="w-4.5 h-4.5" />
                            </button>
                            <button
                              onClick={() => navigate(`/profile/${txn.studentId}`)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-brand-500/10 transition-colors"
                              title="View Student Dossier"
                            >
                              <Eye className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data && data.pages > 1 && (
            <div className="flex items-center justify-between border-t border-warm-250/30 dark:border-darkbg-border pt-4 text-xs font-bold text-warm-800 dark:text-slate-300 px-6 py-4">
              <span>Page {page} of {data.pages}</span>
              <div className="flex items-center space-x-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  className="px-3.5 py-1.5 bg-warm-100 hover:bg-warm-200/60 dark:bg-darkbg-surface dark:hover:bg-darkbg-border rounded-xl transition-all disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === data.pages}
                  onClick={() => setPage(p => Math.min(p + 1, data.pages))}
                  className="px-3.5 py-1.5 bg-warm-100 hover:bg-warm-200/60 dark:bg-darkbg-surface dark:hover:bg-darkbg-border rounded-xl transition-all disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FeesConsole;
