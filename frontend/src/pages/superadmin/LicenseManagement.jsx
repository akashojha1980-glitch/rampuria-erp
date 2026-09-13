import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiKey, FiClock, FiCheckCircle, FiAlertTriangle, FiXCircle,
    FiSearch, FiFilter, FiCopy, FiCheck, FiRefreshCw, FiExternalLink
} from 'react-icons/fi';

const LicenseManagement = () => {
    const { token } = useSuperAdmin();
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [copiedKey, setCopiedKey] = useState(null);

    // Renewal Modal
    const [renewModal, setRenewModal] = useState({
        open: false,
        college: null,
        months: 12,
        package: 'Standard',
        maxUsers: 50,
        maxStudents: 5000,
        loading: false
    });

    const fetchLicenses = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/superadmin/colleges', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setColleges(res.data.colleges || []);
            }
        } catch (err) {
            console.error('Error fetching licenses:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLicenses();
    }, [token]);

    const getDaysRemaining = (validUntil) => {
        if (!validUntil) return null;
        const diff = new Date(validUntil) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const filteredLicenses = useMemo(() => {
        return colleges.filter(c => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query ||
                c.collegeName?.toLowerCase().includes(query) ||
                c.licenseKey?.toLowerCase().includes(query) ||
                c.clientId?.toLowerCase().includes(query) ||
                c.collegeCode?.toLowerCase().includes(query);

            const days = getDaysRemaining(c.licenseValidUntil);
            let matchesStatus = true;
            if (filterStatus === 'ACTIVE') matchesStatus = days === null || days > 30;
            else if (filterStatus === 'EXPIRING_30') matchesStatus = days !== null && days > 0 && days <= 30;
            else if (filterStatus === 'EXPIRING_15') matchesStatus = days !== null && days > 0 && days <= 15;
            else if (filterStatus === 'EXPIRED') matchesStatus = days !== null && days <= 0;

            return matchesSearch && matchesStatus;
        });
    }, [colleges, searchQuery, filterStatus]);

    const handleCopy = (key) => {
        navigator.clipboard.writeText(key);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    const handleRenewSubmit = async (e) => {
        e.preventDefault();
        if (!renewModal.college) return;
        setRenewModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.post(
                `/api/superadmin/colleges/${renewModal.college.id}/renew-license`,
                {
                    package: renewModal.package,
                    months: parseInt(renewModal.months),
                    maxUsers: parseInt(renewModal.maxUsers),
                    maxStudents: parseInt(renewModal.maxStudents)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('License validity extended successfully');
                setRenewModal({ open: false, college: null, months: 12, package: 'Standard', maxUsers: 50, maxStudents: 5000, loading: false });
                fetchLicenses();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to renew license');
            setRenewModal(prev => ({ ...prev, loading: false }));
        }
    };

    const expiring30Count = colleges.filter(c => {
        const d = getDaysRemaining(c.licenseValidUntil);
        return d !== null && d > 0 && d <= 30;
    }).length;

    const expiring15Count = colleges.filter(c => {
        const d = getDaysRemaining(c.licenseValidUntil);
        return d !== null && d > 0 && d <= 15;
    }).length;

    const expiredCount = colleges.filter(c => {
        const d = getDaysRemaining(c.licenseValidUntil);
        return d !== null && d <= 0;
    }).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiKey className="text-indigo-600" />
                        License & Subscription Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track cryptographic license keys, subscription cycles, automated expiry alerts, and tenant renewals.
                    </p>
                </div>
                <button
                    onClick={fetchLicenses}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Refresh Keys
                </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => setFilterStatus('ALL')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        filterStatus === 'ALL' ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-700' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                >
                    <p className="text-xs text-slate-400 uppercase font-semibold">Total Issued</p>
                    <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{colleges.length}</p>
                </div>

                <div
                    onClick={() => setFilterStatus('EXPIRING_30')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        filterStatus === 'EXPIRING_30' ? 'bg-amber-50 border-amber-300 dark:bg-amber-950/40 dark:border-amber-700' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                >
                    <p className="text-xs text-amber-500 uppercase font-semibold">Expiring in 30 Days</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{expiring30Count}</p>
                </div>

                <div
                    onClick={() => setFilterStatus('EXPIRING_15')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        filterStatus === 'EXPIRING_15' ? 'bg-orange-50 border-orange-300 dark:bg-orange-950/40 dark:border-orange-700' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                >
                    <p className="text-xs text-orange-500 uppercase font-semibold">Critical (&le;15 Days)</p>
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{expiring15Count}</p>
                </div>

                <div
                    onClick={() => setFilterStatus('EXPIRED')}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        filterStatus === 'EXPIRED' ? 'bg-rose-50 border-rose-300 dark:bg-rose-950/40 dark:border-rose-700' : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700'
                    }`}
                >
                    <p className="text-xs text-rose-500 uppercase font-semibold">Expired Licenses</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{expiredCount}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search by Institution or License Key..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <FiFilter className="text-slate-400" size={14} />
                    <span className="text-xs text-slate-500 font-semibold">Filter Status:</span>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white"
                    >
                        <option value="ALL">All Licenses</option>
                        <option value="ACTIVE">Healthy (&gt;30d)</option>
                        <option value="EXPIRING_30">Expiring in 30 Days</option>
                        <option value="EXPIRING_15">Expiring in 15 Days</option>
                        <option value="EXPIRED">Expired</option>
                    </select>
                </div>
            </div>

            {/* License Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                            <tr>
                                <th className="py-3.5 px-6">Institution</th>
                                <th className="py-3.5 px-4">License Key</th>
                                <th className="py-3.5 px-4">Package</th>
                                <th className="py-3.5 px-4">Expiry Date</th>
                                <th className="py-3.5 px-4">Days Left</th>
                                <th className="py-3.5 px-4">Users / Students</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">Loading licenses...</td>
                                </tr>
                            ) : filteredLicenses.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">No licenses match the selected criteria.</td>
                                </tr>
                            ) : (
                                filteredLicenses.map((c) => {
                                    const days = getDaysRemaining(c.licenseValidUntil);
                                    const isExpired = days !== null && days <= 0;
                                    const isCritical = days !== null && days > 0 && days <= 15;
                                    const isWarning = days !== null && days > 15 && days <= 30;

                                    return (
                                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                            <td className="py-4 px-6">
                                                <p className="font-bold text-slate-800 dark:text-white text-sm">{c.collegeName}</p>
                                                <p className="text-[11px] text-slate-400 font-mono">{c.collegeCode} • {c.clientId}</p>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-2.5 py-1 rounded">
                                                        {c.licenseKey || 'RAMP-UNSET-0000'}
                                                    </span>
                                                    <button
                                                        onClick={() => handleCopy(c.licenseKey)}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 rounded transition-colors"
                                                        title="Copy Key"
                                                    >
                                                        {copiedKey === c.licenseKey ? <FiCheck className="text-emerald-500" /> : <FiCopy />}
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                                                    {c.licensePackage || 'Standard'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-200">
                                                {c.licenseValidUntil ? new Date(c.licenseValidUntil).toLocaleDateString('en-IN') : 'Lifetime'}
                                            </td>
                                            <td className="py-4 px-4">
                                                {days === null ? (
                                                    <span className="text-emerald-600 font-bold">Unlimited</span>
                                                ) : isExpired ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-rose-600 bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded">
                                                        <FiXCircle size={12} /> Expired ({Math.abs(days)}d ago)
                                                    </span>
                                                ) : isCritical ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded animate-pulse">
                                                        <FiAlertTriangle size={12} /> {days} days left
                                                    </span>
                                                ) : isWarning ? (
                                                    <span className="inline-flex items-center gap-1 font-bold text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-2 py-0.5 rounded">
                                                        <FiClock size={12} /> {days} days left
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                                                        <FiCheckCircle size={12} /> {days} days left
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-4 text-slate-600 dark:text-slate-300">
                                                {c.maxUsers || 50} users / {c.maxStudents || 5000} std.
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => setRenewModal({
                                                        open: true,
                                                        college: c,
                                                        months: 12,
                                                        package: c.licensePackage || 'Standard',
                                                        maxUsers: c.maxUsers || 50,
                                                        maxStudents: c.maxStudents || 5000,
                                                        loading: false
                                                    })}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow text-xs transition-colors"
                                                >
                                                    Renew / Extend
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Renewal Modal */}
            {renewModal.open && renewModal.college && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                            <FiKey className="text-indigo-600" /> Renew License Subscription
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">
                            Extending license for <strong>{renewModal.college.collegeName}</strong> ({renewModal.college.collegeCode})
                        </p>
                        <form onSubmit={handleRenewSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Package / Tier</label>
                                <select
                                    value={renewModal.package}
                                    onChange={(e) => setRenewModal({ ...renewModal, package: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                >
                                    <option value="Basic">Basic Edition</option>
                                    <option value="Standard">Standard Edition</option>
                                    <option value="Premium">Premium Edition</option>
                                    <option value="Enterprise">Enterprise Edition</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Extension Period</label>
                                <select
                                    value={renewModal.months}
                                    onChange={(e) => setRenewModal({ ...renewModal, months: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                >
                                    <option value="1">1 Month (Trial / Emergency Extension)</option>
                                    <option value="3">3 Months (Quarterly)</option>
                                    <option value="6">6 Months (Half-Yearly)</option>
                                    <option value="12">12 Months (1 Year Standard)</option>
                                    <option value="24">24 Months (2 Years)</option>
                                    <option value="36">36 Months (3 Years)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Users</label>
                                    <input
                                        type="number"
                                        value={renewModal.maxUsers}
                                        onChange={(e) => setRenewModal({ ...renewModal, maxUsers: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Students</label>
                                    <input
                                        type="number"
                                        value={renewModal.maxStudents}
                                        onChange={(e) => setRenewModal({ ...renewModal, maxStudents: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    />
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setRenewModal({ ...renewModal, open: false })}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={renewModal.loading}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                                >
                                    {renewModal.loading ? 'Updating...' : 'Confirm Extension'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LicenseManagement;