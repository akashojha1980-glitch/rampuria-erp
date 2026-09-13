import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiActivity, FiSearch, FiFilter, FiDownload,
    FiRefreshCw, FiUser, FiClock, FiShield
} from 'react-icons/fi';

const AuditLogViewer = () => {
    const { token } = useSuperAdmin();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [moduleFilter, setModuleFilter] = useState('ALL');

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/superadmin/audit-logs', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.data.success) {
                setLogs(res.data.logs || []);
            }
        } catch (err) {
            console.error('Error fetching audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [token]);

    const filteredLogs = useMemo(() => {
        return logs.filter(l => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                l.action?.toLowerCase().includes(q) ||
                l.details?.toLowerCase().includes(q) ||
                l.username?.toLowerCase().includes(q) ||
                l.ipAddress?.toLowerCase().includes(q) ||
                l.college?.collegeName?.toLowerCase().includes(q);

            const matchesModule = moduleFilter === 'ALL' || l.module === moduleFilter;
            return matchesSearch && matchesModule;
        });
    }, [logs, searchQuery, moduleFilter]);

    const exportToCSV = () => {
        if (filteredLogs.length === 0) return;
        const headers = ['Timestamp', 'Action', 'Module', 'Institution', 'Details', 'Operator', 'IP Address'];
        const rows = filteredLogs.map(l => [
            `"${new Date(l.createdAt).toLocaleString('en-IN')}"`,
            `"${l.action || ''}"`,
            `"${l.module || ''}"`,
            `"${l.college?.collegeName || 'Global System'}"`,
            `"${l.details?.replace(/"/g, '""') || ''}"`,
            `"${l.username || 'superadmin'}"`,
            `"${l.ipAddress || ''}"`
        ]);

        const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(',')).join('\n')];
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `Master_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiActivity className="text-indigo-600" />
                        Master System & Security Audit Log
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Immutable historical trail of all administrative actions, module modifications, logins, and database operations.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl"
                    >
                        <FiDownload /> Export CSV
                    </button>
                    <button
                        onClick={fetchLogs}
                        className="p-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded-xl"
                        title="Refresh"
                    >
                        <FiRefreshCw className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search actions, details, user, IP..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={moduleFilter}
                        onChange={(e) => setModuleFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white"
                    >
                        <option value="ALL">All Modules</option>
                        <option value="AUTH">AUTH</option>
                        <option value="COLLEGE_MGMT">COLLEGE_MGMT</option>
                        <option value="LICENSE">LICENSE</option>
                        <option value="MODULE_CONTROL">MODULE_CONTROL</option>
                        <option value="DATABASE">DATABASE</option>
                        <option value="PAYMENTS">PAYMENTS</option>
                        <option value="SUPPORT">SUPPORT</option>
                        <option value="BRANDING">BRANDING</option>
                    </select>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                            <tr>
                                <th className="py-3.5 px-6">Timestamp</th>
                                <th className="py-3.5 px-4">Action</th>
                                <th className="py-3.5 px-4">Module</th>
                                <th className="py-3.5 px-4">Target Institution</th>
                                <th className="py-3.5 px-4">Details & Payload</th>
                                <th className="py-3.5 px-4">Operator</th>
                                <th className="py-3.5 px-6 text-right">IP Address</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">Loading audit trail...</td>
                                </tr>
                            ) : filteredLogs.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">No audit logs recorded yet.</td>
                                </tr>
                            ) : (
                                filteredLogs.map((l) => (
                                    <tr key={l.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                        <td className="py-4 px-6 font-mono text-slate-500">
                                            {new Date(l.createdAt).toLocaleString('en-IN')}
                                        </td>
                                        <td className="py-4 px-4 font-bold text-slate-800 dark:text-white">
                                            {l.action}
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300">
                                                {l.module}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            {l.college?.collegeName || 'Global System'}
                                        </td>
                                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300 max-w-xs truncate" title={l.details}>
                                            {l.details}
                                        </td>
                                        <td className="py-4 px-4 font-mono font-medium text-slate-700 dark:text-slate-300">
                                            {l.username || 'superadmin'}
                                        </td>
                                        <td className="py-4 px-6 text-right font-mono text-slate-400">
                                            {l.ipAddress || '127.0.0.1'}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AuditLogViewer;