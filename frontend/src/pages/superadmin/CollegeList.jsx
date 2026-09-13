import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiPlus, FiSearch, FiFilter, FiDownload,
    FiEye, FiTrash2, FiAlertCircle, FiCheckCircle,
    FiXCircle, FiClock, FiDatabase, FiRefreshCw,
    FiLayers, FiPhone, FiMail, FiMapPin, FiCalendar, FiShield
} from 'react-icons/fi';

const CollegeList = () => {
    const navigate = useNavigate();
    const { token } = useSuperAdmin();
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Filters & Search
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [packageFilter, setPackageFilter] = useState('ALL');
    const [productFilter, setProductFilter] = useState('ALL');

    // Modals & Action states
    const [deleteModal, setDeleteModal] = useState({ open: false, college: null, confirmName: '', loading: false });
    const [statusChangeModal, setStatusChangeModal] = useState({ open: false, college: null, newStatus: '', reason: '', loading: false });

    const fetchColleges = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/superadmin/colleges', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setColleges(res.data.colleges || []);
            }
        } catch (err) {
            console.error('Error fetching colleges:', err);
            setError(err.response?.data?.message || 'Failed to fetch registered institutions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColleges();
    }, [token]);

    const filteredColleges = useMemo(() => {
        return colleges.filter(c => {
            const query = searchQuery.toLowerCase().trim();
            const matchesSearch = !query || 
                c.collegeName?.toLowerCase().includes(query) ||
                c.collegeCode?.toLowerCase().includes(query) ||
                c.clientId?.toLowerCase().includes(query) ||
                c.city?.toLowerCase().includes(query) ||
                c.contactPerson?.toLowerCase().includes(query) ||
                c.contactPhone?.toLowerCase().includes(query) ||
                c.contactEmail?.toLowerCase().includes(query);

            const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
            const matchesPackage = packageFilter === 'ALL' || c.licensePackage === packageFilter;
            const matchesProduct = productFilter === 'ALL' || c.productType === productFilter;

            return matchesSearch && matchesStatus && matchesPackage && matchesProduct;
        });
    }, [colleges, searchQuery, statusFilter, packageFilter, productFilter]);

    const handleStatusChange = async () => {
        if (!statusChangeModal.college || !statusChangeModal.newStatus) return;
        setStatusChangeModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.put(
                `/api/superadmin/colleges/${statusChangeModal.college.id}/status`,
                { status: statusChangeModal.newStatus, reason: statusChangeModal.reason },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setColleges(prev => prev.map(item => item.id === statusChangeModal.college.id ? { ...item, status: statusChangeModal.newStatus } : item));
                setStatusChangeModal({ open: false, college: null, newStatus: '', reason: '', loading: false });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update status');
            setStatusChangeModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleDeleteCollege = async () => {
        if (!deleteModal.college) return;
        if (deleteModal.confirmName !== deleteModal.college.collegeCode) {
            alert(`Please type "${deleteModal.college.collegeCode}" exactly to confirm.`);
            return;
        }
        setDeleteModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.delete(
                `/api/superadmin/colleges/${deleteModal.college.id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setColleges(prev => prev.filter(item => item.id !== deleteModal.college.id));
                setDeleteModal({ open: false, college: null, confirmName: '', loading: false });
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to delete college record');
            setDeleteModal(prev => ({ ...prev, loading: false }));
        }
    };

    const exportToCSV = () => {
        if (filteredColleges.length === 0) return;
        const headers = ['Client ID', 'College Code', 'College Name', 'Product', 'Package', 'Status', 'License Expiry', 'Contact Person', 'Phone', 'Email', 'City', 'State', 'DB Name'];
        const rows = filteredColleges.map(c => [
            `"${c.clientId || ''}"`,
            `"${c.collegeCode || ''}"`,
            `"${c.collegeName?.replace(/"/g, '""') || ''}"`,
            `"${c.productType || 'College ERP'}"`,
            `"${c.licensePackage || 'Standard'}"`,
            `"${c.status || 'Active'}"`,
            `"${c.licenseValidUntil ? new Date(c.licenseValidUntil).toLocaleDateString() : 'N/A'}"`,
            `"${c.contactPerson || ''}"`,
            `"${c.contactPhone || ''}"`,
            `"${c.contactEmail || ''}"`,
            `"${c.city || ''}"`,
            `"${c.state || ''}"`,
            `"${c.dbName || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(',')).join('\n')];
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Institutions_Directory_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getDaysRemaining = (validUntil) => {
        if (!validUntil) return null;
        const diff = new Date(validUntil) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700/60">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiLayers className="text-indigo-600" />
                        Client Institutions & Colleges
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Comprehensive registry of all onboarded college tenants, their license validity, database mappings, and module entitlements.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium rounded-xl hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors shadow-sm text-sm"
                    >
                        <FiDownload /> Export CSV
                    </button>
                    <button
                        onClick={() => navigate('/superadmin/colleges/new')}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all text-sm"
                    >
                        <FiPlus className="text-lg" /> Register New Institution
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-slate-400 uppercase font-semibold">Total Onboarded</p>
                        <p className="text-2xl font-bold text-slate-800 dark:text-white mt-1">{colleges.length}</p>
                    </div>
                    <span className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                        {colleges.length}
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-emerald-500 uppercase font-semibold">Active Clients</p>
                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                            {colleges.filter(c => c.status === 'Active').length}
                        </p>
                    </div>
                    <span className="w-10 h-10 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                        <FiCheckCircle size={20} />
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-amber-500 uppercase font-semibold">Expiring Soon</p>
                        <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                            {colleges.filter(c => {
                                const days = getDaysRemaining(c.licenseValidUntil);
                                return days !== null && days > 0 && days <= 30;
                            }).length}
                        </p>
                    </div>
                    <span className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                        <FiClock size={20} />
                    </span>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-rose-500 uppercase font-semibold">Suspended / Expired</p>
                        <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">
                            {colleges.filter(c => c.status === 'Suspended' || c.status === 'Expired' || (getDaysRemaining(c.licenseValidUntil) !== null && getDaysRemaining(c.licenseValidUntil) <= 0)).length}
                        </p>
                    </div>
                    <span className="w-10 h-10 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center">
                        <FiXCircle size={20} />
                    </span>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Search name, code, client ID, city, phone..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                        <FiFilter className="text-slate-400" size={16} />
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                        >
                            <option value="ALL">All Statuses</option>
                            <option value="Active">Active</option>
                            <option value="Suspended">Suspended</option>
                            <option value="Expired">Expired</option>
                            <option value="Pending">Pending</option>
                        </select>
                    </div>

                    <select
                        value={packageFilter}
                        onChange={(e) => setPackageFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">All Packages</option>
                        <option value="Basic">Basic Edition</option>
                        <option value="Standard">Standard Edition</option>
                        <option value="Premium">Premium Edition</option>
                        <option value="Enterprise">Enterprise Edition</option>
                        <option value="Custom">Custom Suite</option>
                    </select>

                    <select
                        value={productFilter}
                        onChange={(e) => setProductFilter(e.target.value)}
                        className="px-3 py-2 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-500"
                    >
                        <option value="ALL">All Products</option>
                        <option value="College ERP">College ERP</option>
                        <option value="School ERP">School ERP</option>
                        <option value="Hospital ERP">Hospital ERP</option>
                        <option value="Lab ERP">Lab ERP</option>
                        <option value="Pharmacy ERP">Pharmacy ERP</option>
                        <option value="Service ERP">Service ERP</option>
                    </select>

                    <button
                        onClick={fetchColleges}
                        title="Refresh list"
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300 transition-colors"
                    >
                        <FiRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700/80 uppercase text-xs tracking-wider">
                            <tr>
                                <th className="py-4 px-6">Institution & Details</th>
                                <th className="py-4 px-4">Product & Plan</th>
                                <th className="py-4 px-4">Contact Person</th>
                                <th className="py-4 px-4">Database Target</th>
                                <th className="py-4 px-4">License Validity</th>
                                <th className="py-4 px-4 text-center">Status</th>
                                <th className="py-4 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                            <p className="text-sm font-medium">Loading institution database...</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : filteredColleges.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">
                                        <div className="flex flex-col items-center justify-center gap-2">
                                            <FiLayers size={36} className="text-slate-300 dark:text-slate-600" />
                                            <p className="text-base font-semibold text-slate-600 dark:text-slate-300">No institutions found</p>
                                            <p className="text-xs text-slate-400">Try adjusting your search query or filters</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredColleges.map((col) => {
                                    const daysRemaining = getDaysRemaining(col.licenseValidUntil);
                                    const isExpired = daysRemaining !== null && daysRemaining <= 0;
                                    const isExpiringSoon = daysRemaining !== null && daysRemaining > 0 && daysRemaining <= 30;

                                    return (
                                        <tr key={col.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3.5">
                                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white flex items-center justify-center font-bold text-sm shadow-sm flex-shrink-0">
                                                        {col.collegeCode ? col.collegeCode.slice(0, 3) : 'ERP'}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                onClick={() => navigate(`/superadmin/colleges/${col.id}`)}
                                                                className="font-bold text-slate-800 dark:text-white hover:text-indigo-600 cursor-pointer"
                                                            >
                                                                {col.collegeName}
                                                            </span>
                                                            <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                                                {col.collegeCode}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                                                            <span>ID: <strong className="text-slate-600 dark:text-slate-300 font-mono">{col.clientId}</strong></span>
                                                            {col.city && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span className="flex items-center gap-1"><FiMapPin size={11} /> {col.city}, {col.state}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div>
                                                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 mb-1">
                                                        {col.productType || 'College ERP'}
                                                    </span>
                                                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                                                        {col.licensePackage || 'Standard'} Edition
                                                    </p>
                                                    <p className="text-[11px] text-slate-400">
                                                        Max {col.maxUsers || 50} users • {col.maxStudents || 5000} students
                                                    </p>
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-xs space-y-0.5">
                                                    <p className="font-semibold text-slate-800 dark:text-white">{col.contactPerson || 'N/A'}</p>
                                                    {col.contactPhone && (
                                                        <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                                            <FiPhone size={10} /> {col.contactPhone}
                                                        </p>
                                                    )}
                                                    {col.contactEmail && (
                                                        <p className="text-slate-400 truncate max-w-[160px] flex items-center gap-1" title={col.contactEmail}>
                                                            <FiMail size={10} /> {col.contactEmail}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-1.5 text-xs">
                                                    <FiDatabase className="text-slate-400 flex-shrink-0" size={13} />
                                                    <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[120px]" title={col.dbName}>
                                                        {col.dbName || 'admission_db'}
                                                    </span>
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                                    {col.dbServer || 'localhost:1433'}
                                                </p>
                                            </td>

                                            <td className="py-4 px-4">
                                                <div className="text-xs">
                                                    <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-200">
                                                        <FiCalendar size={12} className="text-slate-400" />
                                                        {col.licenseValidUntil ? new Date(col.licenseValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}
                                                    </div>
                                                    {daysRemaining !== null && (
                                                        <p className={`text-[11px] font-bold mt-0.5 ${
                                                            isExpired ? 'text-rose-600' :
                                                            isExpiringSoon ? 'text-amber-600' : 'text-emerald-600'
                                                        }`}>
                                                            {isExpired ? `Expired (${Math.abs(daysRemaining)}d ago)` : `${daysRemaining} days left`}
                                                        </p>
                                                    )}
                                                </div>
                                            </td>

                                            <td className="py-4 px-4 text-center">
                                                <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                                    col.status === 'Active' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' :
                                                    col.status === 'Suspended' ? 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400' :
                                                    col.status === 'Expired' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400' :
                                                    'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                                                }`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                                        col.status === 'Active' ? 'bg-emerald-500' :
                                                        col.status === 'Suspended' ? 'bg-rose-500' :
                                                        col.status === 'Expired' ? 'bg-amber-500' : 'bg-slate-400'
                                                    }`}></span>
                                                    {col.status || 'Active'}
                                                </span>
                                            </td>

                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button
                                                        onClick={() => navigate(`/superadmin/colleges/${col.id}`)}
                                                        title="Open 360° Profile"
                                                        className="p-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg transition-colors"
                                                    >
                                                        <FiEye size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setStatusChangeModal({
                                                            open: true,
                                                            college: col,
                                                            newStatus: col.status === 'Active' ? 'Suspended' : 'Active',
                                                            reason: '',
                                                            loading: false
                                                        })}
                                                        title={col.status === 'Active' ? 'Suspend College Access' : 'Activate College'}
                                                        className={`p-2 rounded-lg transition-colors ${
                                                            col.status === 'Active'
                                                                ? 'bg-amber-50 dark:bg-amber-900/30 hover:bg-amber-100 text-amber-600'
                                                                : 'bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 text-emerald-600'
                                                        }`}
                                                    >
                                                        <FiShield size={15} />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, college: col, confirmName: '', loading: false })}
                                                        title="Delete Institution"
                                                        className="p-2 bg-rose-50 dark:bg-rose-900/30 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors"
                                                    >
                                                        <FiTrash2 size={15} />
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

                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs text-slate-500">
                    <span>Showing {filteredColleges.length} of {colleges.length} registered institutions</span>
                    <span>Offline Multi-Tenant Engine active</span>
                </div>
            </div>

            {statusChangeModal.open && statusChangeModal.college && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3 text-amber-600 mb-4">
                            <FiShield size={24} />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {statusChangeModal.newStatus === 'Suspended' ? 'Suspend Institution Access' : 'Activate Institution Access'}
                            </h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            Are you sure you want to change the status of <strong>{statusChangeModal.college.collegeName}</strong> to{' '}
                            <span className="font-bold uppercase text-indigo-600">{statusChangeModal.newStatus}</span>?
                        </p>
                        {statusChangeModal.newStatus === 'Suspended' && (
                            <p className="text-xs text-rose-500 mt-2 bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-lg border border-rose-200 dark:border-rose-800">
                                Warning: College staff and administrators will immediately be blocked from logging into this tenant instance until reactivated.
                            </p>
                        )}
                        <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">Reason / Admin Note</label>
                            <input
                                type="text"
                                placeholder="e.g., Annual subscription fee pending"
                                value={statusChangeModal.reason}
                                onChange={(e) => setStatusChangeModal(prev => ({ ...prev, reason: e.target.value }))}
                                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                            />
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setStatusChangeModal({ open: false, college: null, newStatus: '', reason: '', loading: false })}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusChange}
                                disabled={statusChangeModal.loading}
                                className={`px-4 py-2 text-white text-sm font-semibold rounded-xl ${
                                    statusChangeModal.newStatus === 'Suspended' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                                }`}
                            >
                                {statusChangeModal.loading ? 'Updating...' : `Confirm ${statusChangeModal.newStatus}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {deleteModal.open && deleteModal.college && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-rose-200 dark:border-rose-900">
                        <div className="flex items-center gap-3 text-rose-600 mb-4">
                            <FiAlertCircle size={24} />
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Delete Tenant Record</h3>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300">
                            This will permanently remove <strong>{deleteModal.college.collegeName}</strong> from your Super Admin registry.
                        </p>
                        <p className="text-xs text-rose-600 dark:text-rose-400 mt-2 bg-rose-50 dark:bg-rose-900/20 p-2.5 rounded-lg border border-rose-200">
                            Type the college code <strong>{deleteModal.college.collegeCode}</strong> below to confirm deletion:
                        </p>
                        <input
                            type="text"
                            placeholder={deleteModal.college.collegeCode}
                            value={deleteModal.confirmName}
                            onChange={(e) => setDeleteModal(prev => ({ ...prev, confirmName: e.target.value }))}
                            className="w-full mt-3 px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                        />
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setDeleteModal({ open: false, college: null, confirmName: '', loading: false })}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteCollege}
                                disabled={deleteModal.confirmName !== deleteModal.college.collegeCode || deleteModal.loading}
                                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-sm font-semibold rounded-xl"
                            >
                                {deleteModal.loading ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollegeList;