import React, { useState, useEffect } from 'react';
import { 
  X, DollarSign, Upload, Calendar, CheckCircle2, 
  AlertCircle, FileText, Tag, CreditCard, User, Layers
} from 'lucide-react';

const STANDARD_CATEGORIES = [
  'Stationery & Printing',
  'Electricity & Utilities',
  'Building & Campus Maintenance',
  'Tea & Refreshments / Hospitality',
  'Lab & Library Consumables',
  'Staff Welfare & Honorarium',
  'Affiliation & Legal Fees',
  'Security & Sanitization',
  'Sports & Cultural Events',
  'Miscellaneous & Petty Cash'
];

const ExpenseModal = ({ isOpen, onClose, onExpenseSaved, editingExpense, activeSession }) => {
  const [formData, setFormData] = useState({
    paidTo: '',
    amount: '',
    category: 'Miscellaneous & Petty Cash',
    expenseDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    transactionRef: '',
    narration: '',
    academicSession: activeSession || '2025-26',
    authorizedBy: 'Accountant'
  });

  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        paidTo: editingExpense.paidTo || '',
        amount: editingExpense.amount !== undefined ? editingExpense.amount : '',
        category: editingExpense.category || 'Miscellaneous & Petty Cash',
        expenseDate: editingExpense.expenseDate || new Date().toISOString().split('T')[0],
        paymentMode: editingExpense.paymentMode || 'Cash',
        transactionRef: editingExpense.transactionRef || '',
        narration: editingExpense.narration || '',
        academicSession: editingExpense.academicSession || activeSession || '2025-26',
        authorizedBy: editingExpense.authorizedBy || 'Accountant'
      });
      setReceiptFile(null);
    } else {
      setFormData({
        paidTo: '',
        amount: '',
        category: 'Miscellaneous & Petty Cash',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMode: 'Cash',
        transactionRef: '',
        narration: '',
        academicSession: activeSession || '2025-26',
        authorizedBy: 'Accountant'
      });
      setReceiptFile(null);
    }
    setError(null);
  }, [editingExpense, isOpen, activeSession]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setReceiptFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.paidTo.trim()) {
      setError('Please provide Payee or Vendor Name (Paid To).');
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid positive expense amount.');
      return;
    }

    setLoading(true);
    const token = localStorage.getItem('token');

    try {
      const dataPayload = new FormData();
      dataPayload.append('paidTo', formData.paidTo);
      dataPayload.append('amount', numAmount);
      dataPayload.append('category', formData.category);
      dataPayload.append('expenseDate', formData.expenseDate);
      dataPayload.append('paymentMode', formData.paymentMode);
      dataPayload.append('transactionRef', formData.transactionRef);
      dataPayload.append('narration', formData.narration);
      dataPayload.append('academicSession', formData.academicSession);
      dataPayload.append('authorizedBy', formData.authorizedBy);

      if (receiptFile) {
        dataPayload.append('receiptFile', receiptFile);
      }

      const url = editingExpense 
        ? `/api/expenses/${editingExpense.id || editingExpense._id}` 
        : '/api/expenses';
      
      const method = editingExpense ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: dataPayload
      });

      const resData = await res.json();

      if (res.ok) {
        if (onExpenseSaved) onExpenseSaved(resData);
        onClose();
      } else {
        setError(resData.message || 'Failed to record expense voucher');
      }
    } catch (err) {
      setError('Server connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white dark:bg-darkbg-surface w-full max-w-xl rounded-2xl shadow-2xl border border-warm-200 dark:border-darkbg-border overflow-hidden flex flex-col my-6">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-warm-900 dark:text-slate-100">
                {editingExpense ? 'Edit Expense / Debit Voucher' : 'Record College Expense (Debit Outflow)'}
              </h3>
              <p className="text-xs text-warm-700 dark:text-slate-400">
                Auto-creates a debit entry into the Unified College Day Book
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-darkbg-base rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[80vh]">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl flex items-center space-x-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payee / Paid To */}
            <div>
              <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-brand-500" />
                <span>Paid To (Vendor / Payee Name) *</span>
              </label>
              <input
                type="text"
                name="paidTo"
                value={formData.paidTo}
                onChange={handleChange}
                placeholder="e.g. Shyam Stationery, JVVNL Electric"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-warm-900 dark:text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-500" />
                <span>Expense Amount (₹) *</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                placeholder="0.00"
                min="1"
                step="any"
                required
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold text-warm-900 dark:text-slate-100 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense Category */}
            <div>
              <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-amber-500" />
                <span>Expense Category *</span>
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-warm-900 dark:text-slate-100 focus:border-brand-500 outline-none transition-all"
              >
                {STANDARD_CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Expense Date */}
            <div>
              <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Expense Date *</span>
              </label>
              <input
                type="date"
                name="expenseDate"
                value={formData.expenseDate}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-warm-900 dark:text-slate-100 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payment Mode */}
            <div>
              <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <CreditCard className="w-3.5 h-3.5 text-cyan-500" />
                <span>Payment Mode *</span>
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode}
                onChange={handleChange}
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-warm-900 dark:text-slate-100 focus:border-brand-500 outline-none transition-all"
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI / QR Code</option>
                <option value="Net Banking">Net Banking / NEFT / RTGS</option>
                <option value="Cheque">Cheque</option>
                <option value="DD">Demand Draft (DD)</option>
              </select>
            </div>

            {/* Transaction Ref / Bill No */}
            <div>
              <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>Bill / Cheque / UTR Ref</span>
              </label>
              <input
                type="text"
                name="transactionRef"
                value={formData.transactionRef}
                onChange={handleChange}
                placeholder="e.g. Bill #8492 or UTR #9482749"
                className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-warm-900 dark:text-slate-100 focus:border-brand-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Receipt Attachment File */}
          <div>
            <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5 flex items-center space-x-1">
              <Upload className="w-3.5 h-3.5 text-purple-500" />
              <span>Attach Bill / Invoice / Voucher Receipt (Optional)</span>
            </label>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf,.webp"
              onChange={handleFileChange}
              className="w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100 dark:file:bg-darkbg-base dark:file:text-slate-200 cursor-pointer"
            />
          </div>

          {/* Narration */}
          <div>
            <label className="block text-xs font-bold text-warm-800 dark:text-slate-300 mb-1.5">
              Narration / Description Notes
            </label>
            <textarea
              name="narration"
              value={formData.narration}
              onChange={handleChange}
              rows="2"
              placeholder="e.g. Purchased 5 reams of A4 paper and exam answer sheets..."
              className="w-full px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-normal text-warm-900 dark:text-slate-100 focus:border-brand-500 outline-none transition-all resize-none"
            ></textarea>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-2 flex items-center justify-end space-x-3 border-t border-warm-200 dark:border-darkbg-border">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-base rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2 active:scale-95 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{loading ? 'Recording...' : (editingExpense ? 'Update Expense Voucher' : 'Record Debit Voucher')}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default ExpenseModal;
