import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiArrowLeft, FiShield, FiKey, FiLayers, FiDatabase,
    FiDollarSign, FiLifeBuoy, FiActivity, FiImage, FiCheckCircle,
    FiAlertCircle, FiClock, FiEdit2, FiSave, FiUpload, FiDownload,
    FiPhone, FiMail, FiMapPin, FiGlobe, FiRefreshCw, FiCopy, FiCheck
} from 'react-icons/fi';

const MODULE_OPTIONS = [
    { key: 'admissions', label: 'Student Admissions & Registration', desc: 'Direct form entry, merit calculation, document tracking' },
    { key: 'feeManagement', label: 'Fee Management & Accounts', desc: 'Receipts, concessions, fee head categorization, installments' },
    { key: 'idCards', label: 'ID Card & Document Generation', desc: 'Batch ID cards, admission slips, character certificates' },
    { key: 'reports', label: 'Analytics & Master Reports', desc: 'Custom Excel/PDF exports, admission trends, fee summaries' },
    { key: 'attendance', label: 'Student & Staff Attendance', desc: 'Daily attendance marking, defaulter alerts, monthly sheets' },
    { key: 'library', label: 'Library & Book Circulation', desc: 'Cataloging, issue/return tracker, fine computation' },
    { key: 'hostel', label: 'Hostel & Room Allocation', desc: 'Room inventory, mess billing, warden logs' },
    { key: 'transport', label: 'Transport & Fleet Routing', desc: 'Bus routes, stop allocations, driver/vehicle records' },
    { key: 'examinations', label: 'Examinations & Marks Grading', desc: 'Exam schedules, hall tickets, marksheets, rank lists' },
    { key: 'smsAlerts', label: 'SMS & WhatsApp Gateway', desc: 'Automated fee reminders, admission confirmations' },
    { key: 'auditTrail', label: 'Security & Audit Logging', desc: 'User action audit logs, deletion records, login trackers' },
    { key: 'backupRestore', label: 'Database Backup & Restore', desc: 'Automated local backups and point-in-time recovery' }
];

const CollegeProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { token } = useSuperAdmin();

    const [college, setCollege] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('overview');
    const [copiedKey, setCopiedKey] = useState(false);

    // Edit Details State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [saving, setSaving] = useState(false);

    // Module toggles state
    const [modules, setModules] = useState({});
    const [updatingModules, setUpdatingModules] = useState(false);

    // Renew License Modal
    const [renewModal, setRenewModal] = useState({ open: false, months: 12, package: 'Standard', maxUsers: 50, maxStudents: 5000, loading: false });

    // New Payment Modal
    const [paymentModal, setPaymentModal] = useState({
        open: false,
        amount: '',
        paymentType: 'AMC_RENEWAL',
        paymentMethod: 'Bank Transfer',
        transactionRef: '',
        periodMonths: 12,
        remarks: '',
        loading: false
    });

    // Support Ticket Modal
    const [ticketModal, setTicketModal] = useState({
        open: false,
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Software Issue',
        loading: false
    });

    // Branding Asset State
    const [brandingUploading, setBrandingUploading] = useState(false);

    const fetchCollegeDetails = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/superadmin/colleges/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCollege(res.data.college);
                setEditForm(res.data.college);
                setModules(res.data.college.enabledModules || {});
                setRenewModal(prev => ({
                    ...prev,
                    package: res.data.college.licensePackage || 'Standard',
                    maxUsers: res.data.college.maxUsers || 50,
                    maxStudents: res.data.college.maxStudents || 5000
                }));
            }
        } catch (err) {
            console.error('Error fetching college profile:', err);
            setError(err.response?.data?.message || 'Failed to fetch college profile');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCollegeDetails();
    }, [id, token]);

    const handleCopyLicenseKey = () => {
        if (college?.licenseKey) {
            navigator.clipboard.writeText(college.licenseKey);
            setCopiedKey(true);
            setTimeout(() => setCopiedKey(false), 2000);
        }
    };

    const handleSaveDetails = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await axios.put(`/api/superadmin/colleges/${id}`, editForm, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setCollege(res.data.college);
                setIsEditing(false);
                alert('Institution details updated successfully');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save changes');
        } finally {
            setSaving(false);
        }
    };

    const handleModuleToggle = async (moduleKey) => {
        const updated = { ...modules, [moduleKey]: !modules[moduleKey] };
        setModules(updated);
        setUpdatingModules(true);
        try {
            const res = await axios.put(
                `/api/superadmin/colleges/${id}/modules`,
                { modules: updated },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                setCollege(prev => ({ ...prev, enabledModules: updated }));
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update module entitlement');
            setModules(modules); // Revert
        } finally {
            setUpdatingModules(false);
        }
    };

    const handleRenewLicense = async () => {
        setRenewModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.post(
                `/api/superadmin/colleges/${id}/renew-license`,
                {
                    package: renewModal.package,
                    months: parseInt(renewModal.months),
                    maxUsers: parseInt(renewModal.maxUsers),
                    maxStudents: parseInt(renewModal.maxStudents)
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('License renewed and updated successfully');
                setRenewModal(prev => ({ ...prev, open: false, loading: false }));
                fetchCollegeDetails();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to renew license');
            setRenewModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleRecordPayment = async (e) => {
        e.preventDefault();
        setPaymentModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.post(
                '/api/superadmin/payments',
                {
                    collegeId: id,
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
                alert('Payment record saved successfully');
                setPaymentModal({
                    open: false,
                    amount: '',
                    paymentType: 'AMC_RENEWAL',
                    paymentMethod: 'Bank Transfer',
                    transactionRef: '',
                    periodMonths: 12,
                    remarks: '',
                    loading: false
                });
                fetchCollegeDetails();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to record payment');
            setPaymentModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setTicketModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.post(
                '/api/superadmin/support/tickets',
                {
                    collegeId: id,
                    title: ticketModal.title,
                    description: ticketModal.description,
                    priority: ticketModal.priority,
                    category: ticketModal.category
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('Support ticket created successfully');
                setTicketModal({
                    open: false,
                    title: '',
                    description: '',
                    priority: 'Medium',
                    category: 'Software Issue',
                    loading: false
                });
                fetchCollegeDetails();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create support ticket');
            setTicketModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleFileUpload = async (assetType, e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Data = reader.result;
            setBrandingUploading(true);
            try {
                const res = await axios.post(
                    `/api/superadmin/colleges/${id}/branding`,
                    { assetType, base64Data },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                if (res.data.success) {
                    alert(`${assetType.toUpperCase()} updated successfully`);
                    fetchCollegeDetails();
                }
            } catch (err) {
                alert(err.response?.data?.message || 'Failed to upload asset');
            } finally {
                setBrandingUploading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const getDaysRemaining = (validUntil) => {
        if (!validUntil) return null;
        const diff = new Date(validUntil) - new Date();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-500 font-medium">Loading 360° Institution Profile...</p>
            </div>
        );
    }

    if (error || !college) {
        return (
            <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl border border-rose-200 text-center max-w-lg mx-auto mt-12">
                <FiAlertCircle className="mx-auto text-rose-500 mb-3" size={42} />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white">Institution Not Found</h2>
                <p className="text-slate-500 text-sm mt-1 mb-6">{error || 'Unable to locate tenant record'}</p>
                <button
                    onClick={() => navigate('/superadmin/colleges')}
                    className="px-5 py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded-xl"
                >
                    Back to Institutions Directory
                </button>
            </div>
        );
    }

    const daysRemaining = getDaysRemaining(college.licenseValidUntil);

    return (
        <div className="space-y-6">
            {/* Top Navigation & Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate('/superadmin/colleges')}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-600 dark:text-slate-300 rounded-xl transition-colors"
                        title="Back to College List"
                    >
                        <FiArrowLeft size={18} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{college.collegeName}</h1>
                            <span className="font-mono text-xs px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold">
                                {college.collegeCode}
                            </span>
                            <span className={`inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-xs font-bold ${
                                college.status === 'Active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                college.status === 'Suspended' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                    college.status === 'Active' ? 'bg-emerald-500' :
                                    college.status === 'Suspended' ? 'bg-rose-500' : 'bg-amber-500'
                                }`}></span>
                                {college.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                            Client ID: <span className="font-mono font-semibold text-slate-600 dark:text-slate-300">{college.clientId}</span> • {college.productType || 'College ERP'} ({college.licensePackage} Edition)
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setRenewModal(prev => ({ ...prev, open: true }))}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                        <FiClock size={14} /> Renew / Extend License
                    </button>
                    <button
                        onClick={() => setPaymentModal(prev => ({ ...prev, open: true }))}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-md transition-all"
                    >
                        <FiDollarSign size={14} /> Record Payment
                    </button>
                </div>
            </div>

            {/* Quick Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">License Expiry</p>
                    <p className="text-base font-bold text-slate-800 dark:text-white mt-1">
                        {college.licenseValidUntil ? new Date(college.licenseValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime'}
                    </p>
                    <p className={`text-xs font-semibold mt-1 ${daysRemaining <= 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {daysRemaining !== null ? (daysRemaining > 0 ? `${daysRemaining} days remaining` : `Expired ${Math.abs(daysRemaining)}d ago`) : 'Unlimited'}
                    </p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Allocated DB</p>
                    <p className="text-base font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1 truncate" title={college.dbName}>
                        {college.dbName || 'admission_db'}
                    </p>
                    <p className="text-xs text-slate-400 mt-1 font-mono">{college.dbServer || 'localhost:1433'}</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Licensed Capacity</p>
                    <p className="text-base font-bold text-slate-800 dark:text-white mt-1">
                        {college.maxUsers || 50} Staff Users
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Max {college.maxStudents || 5000} Students</p>
                </div>

                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-semibold">Enabled Modules</p>
                    <p className="text-base font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {Object.values(college.enabledModules || {}).filter(Boolean).length} / {MODULE_OPTIONS.length} Active
                    </p>
                    <p className="text-xs text-slate-400 mt-1">1-Click Matrix Managed</p>
                </div>
            </div>

            {/* Main Tabs Header */}
            <div className="flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-t-2xl px-4 overflow-x-auto">
                {[
                    { id: 'overview', label: 'Overview & Contacts', icon: FiLayers },
                    { id: 'license', label: 'License & Security', icon: FiKey },
                    { id: 'modules', label: 'Module Control Matrix', icon: FiShield },
                    { id: 'database', label: 'Database Config', icon: FiDatabase },
                    { id: 'payments', label: 'Invoices & Payments', icon: FiDollarSign },
                    { id: 'support', label: 'Support & Tickets', icon: FiLifeBuoy },
                    { id: 'branding', label: 'Branding Assets', icon: FiImage },
                    { id: 'audit', label: 'Audit Logs', icon: FiActivity }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 py-4 px-4 font-semibold text-xs md:text-sm border-b-2 whitespace-nowrap transition-colors ${
                                activeTab === tab.id
                                    ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                            }`}
                        >
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* TAB CONTENT 1: OVERVIEW */}
            {activeTab === 'overview' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Institution Profile Details</h3>
                        <button
                            onClick={() => setIsEditing(!isEditing)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-slate-200"
                        >
                            <FiEdit2 size={13} /> {isEditing ? 'Cancel Edit' : 'Edit Information'}
                        </button>
                    </div>

                    {isEditing ? (
                        <form onSubmit={handleSaveDetails} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">College Full Name</label>
                                    <input
                                        type="text"
                                        value={editForm.collegeName || ''}
                                        onChange={(e) => setEditForm({ ...editForm, collegeName: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Affiliation / Board</label>
                                    <input
                                        type="text"
                                        value={editForm.affiliation || ''}
                                        onChange={(e) => setEditForm({ ...editForm, affiliation: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Person</label>
                                    <input
                                        type="text"
                                        value={editForm.contactPerson || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contactPerson: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
                                    <input
                                        type="text"
                                        value={editForm.contactPhone || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contactPhone: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
                                    <input
                                        type="email"
                                        value={editForm.contactEmail || ''}
                                        onChange={(e) => setEditForm({ ...editForm, contactEmail: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">City & State</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input
                                            type="text"
                                            placeholder="City"
                                            value={editForm.city || ''}
                                            onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                        />
                                        <input
                                            type="text"
                                            placeholder="State"
                                            value={editForm.state || ''}
                                            onChange={(e) => setEditForm({ ...editForm, state: e.target.value })}
                                            className="px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-700">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                                >
                                    <FiSave /> {saving ? 'Saving Changes...' : 'Save Profile Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Institution Name</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm">{college.collegeName}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Affiliation / Board</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm">{college.affiliation || 'Autonomous / University'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">College Code</span>
                                <p className="font-mono font-semibold text-indigo-600 dark:text-indigo-400 text-sm">{college.collegeCode}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Client / Tenant ID</span>
                                <p className="font-mono font-semibold text-slate-700 dark:text-slate-300 text-sm">{college.clientId}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Contact Person</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm">{college.contactPerson || 'Not provided'}</p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Contact Phone</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-1">
                                    <FiPhone size={13} className="text-slate-400" /> {college.contactPhone || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Contact Email</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-1">
                                    <FiMail size={13} className="text-slate-400" /> {college.contactEmail || 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Location</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm flex items-center gap-1">
                                    <FiMapPin size={13} className="text-slate-400" /> {college.city ? `${college.city}, ${college.state}` : 'N/A'}
                                </p>
                            </div>
                            <div className="space-y-1">
                                <span className="text-xs text-slate-400 block uppercase font-medium">Onboarded Date</span>
                                <p className="font-semibold text-slate-800 dark:text-white text-sm">
                                    {college.createdAt ? new Date(college.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* TAB CONTENT 2: LICENSE & SECURITY */}
            {activeTab === 'license' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-2xl">
                        <div>
                            <span className="text-xs uppercase font-bold text-indigo-300 tracking-wider">Cryptographic License Key</span>
                            <div className="flex items-center gap-3 mt-1.5">
                                <span className="font-mono text-lg font-bold tracking-widest text-white">
                                    {college.licenseKey || 'RAMP-XXXX-XXXX-XXXX-YYYY'}
                                </span>
                                <button
                                    onClick={handleCopyLicenseKey}
                                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
                                    title="Copy License Key"
                                >
                                    {copiedKey ? <FiCheck className="text-emerald-400" /> : <FiCopy />}
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setRenewModal(prev => ({ ...prev, open: true }))}
                            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
                        >
                            Renew License Period
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Active Edition</span>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{college.licensePackage || 'Standard'} Edition</p>
                            <p className="text-xs text-slate-500 mt-1">Multi-user offline client deployment</p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Valid Until</span>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                {college.licenseValidUntil ? new Date(college.licenseValidUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Lifetime'}
                            </p>
                            <p className={`text-xs font-bold mt-1 ${daysRemaining <= 15 ? 'text-rose-600' : 'text-emerald-600'}`}>
                                {daysRemaining !== null ? `${daysRemaining} days remaining` : 'Permanent'}
                            </p>
                        </div>
                        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                            <span className="text-xs text-slate-400 uppercase font-semibold">Limits & Entitlements</span>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">{college.maxUsers || 50} Users / {college.maxStudents || 5000} Students</p>
                            <p className="text-xs text-slate-500 mt-1">Concurrency and quota limits</p>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 3: MODULE CONTROL MATRIX */}
            {activeTab === 'modules' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">1-Click Module Entitlement Matrix</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Toggle feature modules on or off for this college instance. Changes apply instantly.
                            </p>
                        </div>
                        {updatingModules && (
                            <span className="text-xs text-indigo-600 font-semibold animate-pulse flex items-center gap-1.5">
                                <FiRefreshCw className="animate-spin" size={13} /> Saving state...
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {MODULE_OPTIONS.map((mod) => {
                            const isEnabled = !!modules[mod.key];
                            return (
                                <div
                                    key={mod.key}
                                    onClick={() => handleModuleToggle(mod.key)}
                                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                                        isEnabled
                                            ? 'border-indigo-200 bg-indigo-50/40 dark:bg-indigo-950/20 dark:border-indigo-800'
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-60'
                                    }`}
                                >
                                    <div className="pr-4">
                                        <div className="flex items-center gap-2">
                                            <span className={`w-2 h-2 rounded-full ${isEnabled ? 'bg-indigo-600' : 'bg-slate-400'}`}></span>
                                            <h4 className="font-bold text-sm text-slate-800 dark:text-white">{mod.label}</h4>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 pl-4">{mod.desc}</p>
                                    </div>
                                    <div className={`w-12 h-6 flex items-center rounded-full p-1 duration-300 cursor-pointer flex-shrink-0 ${
                                        isEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'
                                    }`}>
                                        <div className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ${
                                            isEnabled ? 'translate-x-6' : ''
                                        }`}></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* TAB CONTENT 4: DATABASE CONFIG */}
            {activeTab === 'database' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">MS SQL Server Target Parameters</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Isolated database connection parameters for this college tenant.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Database Server / Host</label>
                                <p className="font-mono font-bold text-slate-800 dark:text-white mt-1">{college.dbServer || 'localhost:1433'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase">Target Database Name</label>
                                <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400 mt-1">{college.dbName || 'admission_db'}</p>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase">DB Authentication User</label>
                                <p className="font-mono font-bold text-slate-800 dark:text-white mt-1">{college.dbUser || 'sa'}</p>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-900/50 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                            <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <FiDatabase className="text-indigo-600" /> Database Diagnostic & Maintenance
                            </h4>
                            <p className="text-xs text-slate-500">
                                Super Admin can trigger point-in-time schema backups and verify database connection health.
                            </p>
                            <div className="pt-2 flex flex-col gap-2">
                                <a
                                    href={`/api/superadmin/database/backup/${college.id}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow transition-colors"
                                >
                                    <FiDownload /> Export Tenant JSON Snapshot
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 5: INVOICES & PAYMENTS */}
            {activeTab === 'payments' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Billing & AMC Payment Ledger</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Historical ledger of software licenses, AMC fees, and custom services.</p>
                        </div>
                        <button
                            onClick={() => setPaymentModal(prev => ({ ...prev, open: true }))}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow"
                        >
                            <FiDollarSign /> Record New Payment
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                                <tr>
                                    <th className="py-3 px-4">Invoice #</th>
                                    <th className="py-3 px-4">Payment Type</th>
                                    <th className="py-3 px-4">Amount</th>
                                    <th className="py-3 px-4">Method & Ref</th>
                                    <th className="py-3 px-4">Date</th>
                                    <th className="py-3 px-4">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {college.payments && college.payments.length > 0 ? (
                                    college.payments.map((p) => (
                                        <tr key={p.id}>
                                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">{p.invoiceNumber}</td>
                                            <td className="py-3 px-4 font-semibold">{p.paymentType}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">₹{Number(p.amount).toLocaleString('en-IN')}</td>
                                            <td className="py-3 px-4">
                                                <span>{p.paymentMethod}</span>
                                                {p.transactionRef && <span className="block text-[10px] text-slate-400 font-mono">Ref: {p.transactionRef}</span>}
                                            </td>
                                            <td className="py-3 px-4">{new Date(p.paymentDate || p.createdAt).toLocaleDateString('en-IN')}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                                                    {p.status || 'Paid'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-slate-400">No payment records found for this college.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 6: SUPPORT & TICKETS */}
            {activeTab === 'support' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-base font-bold text-slate-800 dark:text-white">Helpdesk Support Tickets</h3>
                            <p className="text-xs text-slate-500 mt-0.5">Issues, maintenance inquiries, and feature requests for this institution.</p>
                        </div>
                        <button
                            onClick={() => setTicketModal(prev => ({ ...prev, open: true }))}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                        >
                            <FiLifeBuoy /> Open Support Ticket
                        </button>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                                <tr>
                                    <th className="py-3 px-4">Ticket #</th>
                                    <th className="py-3 px-4">Title & Issue</th>
                                    <th className="py-3 px-4">Priority</th>
                                    <th className="py-3 px-4">Category</th>
                                    <th className="py-3 px-4">Status</th>
                                    <th className="py-3 px-4">Created Date</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {college.tickets && college.tickets.length > 0 ? (
                                    college.tickets.map((t) => (
                                        <tr key={t.id}>
                                            <td className="py-3 px-4 font-mono font-bold text-indigo-600">{t.ticketNumber}</td>
                                            <td className="py-3 px-4">
                                                <p className="font-bold text-slate-800 dark:text-white">{t.title}</p>
                                                <p className="text-slate-400 text-[11px] truncate max-w-xs">{t.description}</p>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                    t.priority === 'High' || t.priority === 'Critical' ? 'bg-rose-100 text-rose-700' :
                                                    t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {t.priority}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 font-medium text-slate-600 dark:text-slate-300">{t.category}</td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700">
                                                    {t.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">{new Date(t.createdAt).toLocaleDateString('en-IN')}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="py-8 text-center text-slate-400">No support tickets recorded for this college.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 7: BRANDING ASSETS */}
            {activeTab === 'branding' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Institution Branding & Assets</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Upload college logo, principal signature, and official seal for reports and ID cards.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* College Logo */}
                        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
                            <p className="text-xs uppercase font-bold text-slate-500">Institution Logo</p>
                            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                {college.logoUrl ? (
                                    <img src={college.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                ) : (
                                    <FiImage size={32} className="text-slate-400" />
                                )}
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer">
                                <FiUpload /> Upload Logo
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload('logo', e)} className="hidden" />
                            </label>
                        </div>

                        {/* Principal Signature */}
                        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
                            <p className="text-xs uppercase font-bold text-slate-500">Principal Signature</p>
                            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                {college.signatureUrl ? (
                                    <img src={college.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                                ) : (
                                    <FiImage size={32} className="text-slate-400" />
                                )}
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer">
                                <FiUpload /> Upload Signature
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload('signature', e)} className="hidden" />
                            </label>
                        </div>

                        {/* Seal / Stamp */}
                        <div className="p-5 border border-slate-200 dark:border-slate-700 rounded-2xl text-center space-y-3">
                            <p className="text-xs uppercase font-bold text-slate-500">Official Stamp / Seal</p>
                            <div className="w-24 h-24 mx-auto bg-slate-100 dark:bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-700">
                                {college.stampUrl ? (
                                    <img src={college.stampUrl} alt="Stamp" className="w-full h-full object-contain" />
                                ) : (
                                    <FiImage size={32} className="text-slate-400" />
                                )}
                            </div>
                            <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg cursor-pointer">
                                <FiUpload /> Upload Stamp
                                <input type="file" accept="image/*" onChange={(e) => handleFileUpload('stamp', e)} className="hidden" />
                            </label>
                        </div>
                    </div>
                </div>
            )}

            {/* TAB CONTENT 8: AUDIT LOGS */}
            {activeTab === 'audit' && (
                <div className="bg-white dark:bg-slate-800 rounded-b-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-700 -mt-6 space-y-6">
                    <div>
                        <h3 className="text-base font-bold text-slate-800 dark:text-white">Tenant Activity & Audit Logs</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Recorded operations and administrative actions performed on this tenant record.</p>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                                <tr>
                                    <th className="py-3 px-4">Timestamp</th>
                                    <th className="py-3 px-4">Action</th>
                                    <th className="py-3 px-4">Module</th>
                                    <th className="py-3 px-4">Details</th>
                                    <th className="py-3 px-4">User</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {college.auditLogs && college.auditLogs.length > 0 ? (
                                    college.auditLogs.map((log) => (
                                        <tr key={log.id}>
                                            <td className="py-3 px-4 font-mono">{new Date(log.createdAt).toLocaleString('en-IN')}</td>
                                            <td className="py-3 px-4 font-bold text-slate-800 dark:text-white">{log.action}</td>
                                            <td className="py-3 px-4 font-semibold text-indigo-600">{log.module}</td>
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{log.details}</td>
                                            <td className="py-3 px-4 font-mono">{log.username || 'superadmin'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="py-8 text-center text-slate-400">No activity logs found for this college.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Renew License Modal */}
            {renewModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FiClock className="text-indigo-600" /> Renew Institution License
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Package</label>
                                <select
                                    value={renewModal.package}
                                    onChange={(e) => setRenewModal({ ...renewModal, package: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                >
                                    <option value="Basic">Basic Edition</option>
                                    <option value="Standard">Standard Edition</option>
                                    <option value="Premium">Premium Edition</option>
                                    <option value="Enterprise">Enterprise Edition</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Extension Duration</label>
                                <select
                                    value={renewModal.months}
                                    onChange={(e) => setRenewModal({ ...renewModal, months: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                >
                                    <option value="1">1 Month (Trial/Short Extension)</option>
                                    <option value="3">3 Months (Quarterly)</option>
                                    <option value="6">6 Months (Half-Yearly)</option>
                                    <option value="12">12 Months (1 Year Standard)</option>
                                    <option value="24">24 Months (2 Years)</option>
                                    <option value="36">36 Months (3 Years)</option>
                                </select>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Staff Users</label>
                                    <input
                                        type="number"
                                        value={renewModal.maxUsers}
                                        onChange={(e) => setRenewModal({ ...renewModal, maxUsers: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Max Students</label>
                                    <input
                                        type="number"
                                        value={renewModal.maxStudents}
                                        onChange={(e) => setRenewModal({ ...renewModal, maxStudents: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                onClick={() => setRenewModal({ ...renewModal, open: false })}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRenewLicense}
                                disabled={renewModal.loading}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                            >
                                {renewModal.loading ? 'Updating...' : 'Confirm Renewal'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Record Payment Modal */}
            {paymentModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FiDollarSign className="text-emerald-600" /> Record Client Payment
                        </h3>
                        <form onSubmit={handleRecordPayment} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Amount (INR ₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g., 25000"
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
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Transaction / Cheque Ref #</label>
                                <input
                                    type="text"
                                    placeholder="e.g., UTR-202609123891"
                                    value={paymentModal.transactionRef}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, transactionRef: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-mono dark:text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Remarks</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Annual AMC for 2026-2027"
                                    value={paymentModal.remarks}
                                    onChange={(e) => setPaymentModal({ ...paymentModal, remarks: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
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
                                    {paymentModal.loading ? 'Saving...' : 'Save & Generate Invoice'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Support Ticket Modal */}
            {ticketModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FiLifeBuoy className="text-indigo-600" /> Open Helpdesk Ticket
                        </h3>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Ticket Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g., SQL Connection timeout during peak fee collection"
                                    value={ticketModal.title}
                                    onChange={(e) => setTicketModal({ ...ticketModal, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                                    <select
                                        value={ticketModal.priority}
                                        onChange={(e) => setTicketModal({ ...ticketModal, priority: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    >
                                        <option value="Low">Low</option>
                                        <option value="Medium">Medium</option>
                                        <option value="High">High</option>
                                        <option value="Critical">Critical</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                                    <select
                                        value={ticketModal.category}
                                        onChange={(e) => setTicketModal({ ...ticketModal, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    >
                                        <option value="Software Issue">Software Issue</option>
                                        <option value="Database">Database</option>
                                        <option value="License Renewal">License Renewal</option>
                                        <option value="Feature Request">Feature Request</option>
                                        <option value="Data Correction">Data Correction</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Description & Steps</label>
                                <textarea
                                    rows="3"
                                    placeholder="Detailed notes on the issue reported by the college..."
                                    value={ticketModal.description}
                                    onChange={(e) => setTicketModal({ ...ticketModal, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                                    required
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTicketModal({ ...ticketModal, open: false })}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={ticketModal.loading}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                                >
                                    {ticketModal.loading ? 'Creating...' : 'Open Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CollegeProfile;