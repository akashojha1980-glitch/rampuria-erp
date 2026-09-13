import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiShield, FiSearch, FiCheck, FiX, FiRefreshCw,
    FiSliders, FiCheckSquare, FiSquare, FiLayers
} from 'react-icons/fi';

const MODULES = [
    { key: 'admissions', label: 'Admissions' },
    { key: 'feeManagement', label: 'Fee Mgmt' },
    { key: 'idCards', label: 'ID Cards' },
    { key: 'reports', label: 'Reports' },
    { key: 'attendance', label: 'Attendance' },
    { key: 'library', label: 'Library' },
    { key: 'hostel', label: 'Hostel' },
    { key: 'transport', label: 'Transport' },
    { key: 'examinations', label: 'Exams' },
    { key: 'smsAlerts', label: 'SMS/WhatsApp' },
    { key: 'auditTrail', label: 'Audit Trail' },
    { key: 'backupRestore', label: 'Backup/Restore' }
];

const FeatureControl = () => {
    const { token } = useSuperAdmin();
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [updatingId, setUpdatingId] = useState(null);

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
            console.error('Error fetching colleges for feature control:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchColleges();
    }, [token]);

    const handleToggle = async (collegeId, moduleKey) => {
        const targetCollege = colleges.find(c => c.id === collegeId);
        if (!targetCollege) return;

        const currentModules = targetCollege.enabledModules || {};
        const updatedModules = {
            ...currentModules,
            [moduleKey]: !currentModules[moduleKey]
        };

        // Optimistic update
        setColleges(prev => prev.map(c => c.id === collegeId ? { ...c, enabledModules: updatedModules } : c));
        setUpdatingId(`${collegeId}-${moduleKey}`);

        try {
            await axios.put(
                `/api/superadmin/colleges/${collegeId}/modules`,
                { modules: updatedModules },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            alert('Failed to update module state');
            // Revert
            setColleges(prev => prev.map(c => c.id === collegeId ? { ...c, enabledModules: currentModules } : c));
        } finally {
            setUpdatingId(null);
        }
    };

    const handleBatchToggle = async (collegeId, enableAll) => {
        const newModules = {};
        MODULES.forEach(m => {
            newModules[m.key] = enableAll;
        });

        // Optimistic update
        setColleges(prev => prev.map(c => c.id === collegeId ? { ...c, enabledModules: newModules } : c));
        setUpdatingId(`${collegeId}-batch`);

        try {
            await axios.put(
                `/api/superadmin/colleges/${collegeId}/modules`,
                { modules: newModules },
                { headers: { Authorization: `Bearer ${token}` } }
            );
        } catch (err) {
            alert('Failed to batch update modules');
            fetchColleges();
        } finally {
            setUpdatingId(null);
        }
    };

    const filteredColleges = colleges.filter(c => {
        const q = searchQuery.toLowerCase().trim();
        return !q || c.collegeName?.toLowerCase().includes(q) || c.collegeCode?.toLowerCase().includes(q);
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiSliders className="text-indigo-600" />
                        1-Click Feature & Module Control Matrix
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Instantly enable or disable specific software capabilities across all deployed college instances in real time.
                    </p>
                </div>
                <button
                    onClick={fetchColleges}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                >
                    <FiRefreshCw className={loading ? 'animate-spin' : ''} /> Reload Matrix
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search institution name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                </div>
                <span className="text-xs text-slate-500 font-semibold">
                    {colleges.length} Total Client Instances
                </span>
            </div>

            {/* Interactive Feature Matrix Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                            <tr>
                                <th className="py-3.5 px-6 sticky left-0 bg-slate-50 dark:bg-slate-900 z-10 min-w-[220px]">
                                    Institution
                                </th>
                                {MODULES.map(m => (
                                    <th key={m.key} className="py-3.5 px-3 text-center whitespace-nowrap">
                                        {m.label}
                                    </th>
                                ))}
                                <th className="py-3.5 px-4 text-center">Batch Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan={MODULES.length + 2} className="py-12 text-center text-slate-400">Loading module matrix...</td>
                                </tr>
                            ) : filteredColleges.length === 0 ? (
                                <tr>
                                    <td colSpan={MODULES.length + 2} className="py-12 text-center text-slate-400">No institutions found.</td>
                                </tr>
                            ) : (
                                filteredColleges.map((c) => {
                                    const mods = c.enabledModules || {};
                                    return (
                                        <tr key={c.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                            {/* Institution Column Sticky */}
                                            <td className="py-4 px-6 sticky left-0 bg-white dark:bg-slate-800 z-10 border-r border-slate-100 dark:border-slate-700">
                                                <p className="font-bold text-slate-800 dark:text-white text-xs">{c.collegeName}</p>
                                                <p className="text-[11px] text-slate-400 font-mono">{c.collegeCode} • {c.licensePackage}</p>
                                            </td>

                                            {/* Module Checkbox / Toggle Cells */}
                                            {MODULES.map(m => {
                                                const isEnabled = !!mods[m.key];
                                                const isUpdating = updatingId === `${c.id}-${m.key}`;

                                                return (
                                                    <td key={m.key} className="py-4 px-3 text-center">
                                                        <button
                                                            onClick={() => handleToggle(c.id, m.key)}
                                                            disabled={isUpdating}
                                                            title={`Click to ${isEnabled ? 'Disable' : 'Enable'} ${m.label}`}
                                                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                                                                isEnabled
                                                                    ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300'
                                                                    : 'bg-slate-100 text-slate-300 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-500'
                                                            } ${isUpdating ? 'animate-spin' : ''}`}
                                                        >
                                                            {isEnabled ? <FiCheck size={14} className="stroke-[3]" /> : <FiX size={14} />}
                                                        </button>
                                                    </td>
                                                );
                                            })}

                                            {/* Batch Actions */}
                                            <td className="py-4 px-4 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => handleBatchToggle(c.id, true)}
                                                        className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 font-bold rounded text-[10px] hover:bg-emerald-100"
                                                        title="Enable all modules"
                                                    >
                                                        All On
                                                    </button>
                                                    <button
                                                        onClick={() => handleBatchToggle(c.id, false)}
                                                        className="px-2 py-1 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 font-bold rounded text-[10px] hover:bg-rose-100"
                                                        title="Disable all modules"
                                                    >
                                                        All Off
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
            </div>
        </div>
    );
};

export default FeatureControl;