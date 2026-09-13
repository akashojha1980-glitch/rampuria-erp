import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiDollarSign, FiPlus, FiSearch, FiFilter, FiDownload,
    FiCheckCircle, FiClock, FiCreditCard, FiRefreshCw, FiFileText
} from 'react-icons/fi';

const PaymentManagement = () => {
    const { token } = useSuperAdmin();
    const [payments, setPayments] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('ALL');

    // Record Payment Modal
    const [paymentModal, setPaymentModal] = useState({
        open: false,
        collegeId: '',
        amount: '',
        paymentType: 'AMC_RENEWAL',
        paymentMethod: 'Bank Transfer',
        transactionRef: '',
        periodMonths: 12,
        remarks: '',
        loading: false
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [paymentsRes, collegesRes] = await Promise.all([
                axios.get('/api/superadmin/payments', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/superadmin/colleges', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (paymentsRes.data.success) {
                setPayments(paymentsRes.data.payments || []);
            }
            if (collegesRes.data.success) {
                setColleges(collegesRes.data.colleges || []);
            }
        } catch (err) {
            console.error('Error fetching payments:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                p.invoiceNumber?.toLowerCase().includes(q) ||
                p.transactionRef?.toLowerCase().includes(q) ||
                p.college?.collegeName?.toLowerCase().includes(q) ||
                p.college?.collegeCode?.toLowerCase().includes(q);

            const matchesType = typeFilter === 'ALL' || p.paymentType === typeFilter;
            return matchesSearch && matchesType;
        });
    }, [payments, searchQuery, typeFilter]);

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setPaymentModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.post(
                '/api/superadmin/payments',
                {
                    collegeId: paymentModal.collegeId || colleges[0]?.id,
                    amount: parseFloat(paymentModal.amount),
                    paymentType: paymentModal.paymentType,
                    paymentMethod: paymentModal.paymentMethod,
                    transactionRef: paymentModal.transactionRef,
                    periodMonths: parseInt(paymentModal.periodMonths),
                    remarks: paymentModal.remarks
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('Payment recorded and invoice generated successfully');
                setPaymentModal({
                    open: false,
                    collegeId: '',
                    amount: '',
                    paymentType: 'AMC_RENEWAL',
                    paymentMethod: 'Bank Transfer',
                    transactionRef: '',
                    periodMonths: 12,
                    remarks: '',
                    loading: false
                });
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record payment');
            setPaymentModal(prev => ({ ...prev, loading: false }));
        }
    };

    const totalRevenue = payments.reduce((acc, p) => acc + (parseFloat(p.amount) || 0), 0);
    const amcCount = payments.filter(p => p.paymentType === 'AMC_RENEWAL').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiDollarSign className="text-indigo-600" />
                        Billing, Invoices & AMC Renewals
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track subscription billing, annual maintenance contracts (AMC), receipts, and financial ledger.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-200"
                        title="Refresh"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                    <button
                        onClick={() => setPaymentModal(prev => ({ ...prev, open: true }))}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-md text-xs transition-all"
                    >
                        <FiPlus size={16} /> Record Client Payment
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Total Revenue Collected</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        ₹{totalRevenue.toLocaleString('en-IN')}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">All time ledger volume</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Total Transactions</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">
                        {payments.length}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Invoices generated</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">AMC Renewals</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {amcCount}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Recurring service agreements</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search invoice #, college, ref..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white"
                    >
                        <option value="ALL">All Payment Types</option>
                        <option value="AMC_RENEWAL">AMC Renewal</option>
                        <option value="LICENSE_PURCHASE">License Purchase</option>
                        <option value="CUSTOMIZATION">Customization</option>
                        <option value="SUPPORT_FEE">Support Fee</option>
                    </select>
                </div>
            </div>

            {/* Ledger Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                            <tr>
                                <th className="py-3.5 px-6">Invoice #</th>
                                <th className="py-3.5 px-4">Institution</th>
                                <th className="py-3.5 px-4">Type</th>
                                <th className="py-3.5 px-4">Amount</th>
                                <th className="py-3.5 px-4">Method & Ref</th>
                                <th className="py-3.5 px-4">Date</th>
                                <th className="py-3.5 px-6 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">Loading billing ledger...</td>
                                </tr>
                            ) : filteredPayments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">No payment records found.</td>
                                </tr>
                            ) : (
                                filteredPayments.map((p) => (
                                    <tr key={p.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                        <td className="py-4 px-6 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                            {p.invoiceNumber}
                                        </td>
                                        <td className="py-4 px-4">
                                            <p className="font-bold text-slate-800 dark:text-white">{p.college?.collegeName || 'General Client'}</p>
                                            <p className="text-[10px] text-slate-400 font-mono">{p.college?.collegeCode}</p>
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            {p.paymentType}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white text-sm">
                                            ₹{Number(p.amount).toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="font-medium text-slate-700 dark:text-slate-300">{p.paymentMethod}</span>
                                            {p.transactionRef && (
                                                <span className="block text-[10px] text-slate-400 font-mono">Ref: {p.transactionRef}</span>
                                            )}
                                        </td>
                                        <td className="py-4 px-4 text-slate-500 font-mono">
                                            {new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                                {p.status || 'Paid'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Payment Modal */}
            {paymentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FiDollarSign className="text-emerald-600" /> Record Client Payment
                        </h3>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Institution</label>
                                <select
                                    value={paymentModal.collegeId}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, collegeId: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    required
                                >
                                    <option value="">Select College / Tenant</option>
                                    {colleges.map(c => (
                                        <option key={c.id} value={c.id}>{c.collegeName} ({c.collegeCode})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (INR ₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 50000"
                                    value={paymentModal.amount}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, amount: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold dark:text-white"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Type</label>
                                    <select
                                        value={paymentModal.paymentType}
                                        onChange={(e) => setPaymentModal({ ...paymentModal, paymentType: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    >
                                        <option value="AMC_RENEWAL">AMC Renewal</option>
                                        <option value="LICENSE_PURCHASE">License Purchase</option>
                                        <option value="CUSTOMIZATION">Customization</option>
                                        <option value="SUPPORT_FEE">Support Fee</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Payment Method</label>
                                    <select
                                        value={paymentModal.paymentMethod}
                                        onChange={(e) => setPaymentModal({ ...paymentModal, paymentMethod: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    >
                                        <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                                        <option value="UPI">UPI / QR</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Cash">Cash</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction Ref #</label>
                                <input
                                    type="text"
                                    placeholder="e.g., UTR-202609123891"
                                    value={paymentModal.transactionRef}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, transactionRef: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setPaymentModal({ ...paymentModal, open: false })}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={paymentModal.loading}
                                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow"
                                >
                                    {paymentModal.loading ? 'Saving...' : 'Save & Issue Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentManagement;