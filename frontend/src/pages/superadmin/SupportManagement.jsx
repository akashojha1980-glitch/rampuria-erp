import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import {
    FiLifeBuoy, FiSearch, FiFilter, FiPlus, FiCheckCircle,
    FiClock, FiAlertCircle, FiMessageSquare, FiRefreshCw, FiEdit3
} from 'react-icons/fi';

const SupportManagement = () => {
    const { token } = useSuperAdmin();
    const [tickets, setTickets] = useState([]);
    const [colleges, setColleges] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL');
    const [priorityFilter, setPriorityFilter] = useState('ALL');

    // Create Modal
    const [createModal, setCreateModal] = useState({
        open: false,
        collegeId: '',
        title: '',
        description: '',
        priority: 'Medium',
        category: 'Software Issue',
        loading: false
    });

    // Update Status Modal
    const [statusModal, setStatusModal] = useState({
        open: false,
        ticket: null,
        status: 'Resolved',
        resolutionNotes: '',
        loading: false
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ticketsRes, collegesRes] = await Promise.all([
                axios.get('/api/superadmin/support/tickets', {
                    headers: { Authorization: `Bearer ${token}` }
                }),
                axios.get('/api/superadmin/colleges', {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ]);

            if (ticketsRes.data.success) {
                setTickets(ticketsRes.data.tickets || []);
            }
            if (collegesRes.data.success) {
                setColleges(collegesRes.data.colleges || []);
            }
        } catch (err) {
            console.error('Error fetching support tickets:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [token]);

    const filteredTickets = useMemo(() => {
        return tickets.filter(t => {
            const q = searchQuery.toLowerCase().trim();
            const matchesSearch = !q ||
                t.ticketNumber?.toLowerCase().includes(q) ||
                t.title?.toLowerCase().includes(q) ||
                t.college?.collegeName?.toLowerCase().includes(q) ||
                t.college?.collegeCode?.toLowerCase().includes(q);

            const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
            const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

            return matchesSearch && matchesStatus && matchesPriority;
        });
    }, [tickets, searchQuery, statusFilter, priorityFilter]);

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        setCreateModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.post(
                '/api/superadmin/support/tickets',
                {
                    collegeId: createModal.collegeId || colleges[0]?.id,
                    title: createModal.title,
                    description: createModal.description,
                    priority: createModal.priority,
                    category: createModal.category
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('Support ticket created successfully');
                setCreateModal({ open: false, collegeId: '', title: '', description: '', priority: 'Medium', category: 'Software Issue', loading: false });
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create ticket');
            setCreateModal(prev => ({ ...prev, loading: false }));
        }
    };

    const handleUpdateStatus = async (e) => {
        e.preventDefault();
        if (!statusModal.ticket) return;
        setStatusModal(prev => ({ ...prev, loading: true }));
        try {
            const res = await axios.put(
                `/api/superadmin/support/tickets/${statusModal.ticket.id}/status`,
                {
                    status: statusModal.status,
                    resolutionNotes: statusModal.resolutionNotes
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.data.success) {
                alert('Ticket status updated');
                setStatusModal({ open: false, ticket: null, status: 'Resolved', resolutionNotes: '', loading: false });
                fetchData();
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update ticket status');
            setStatusModal(prev => ({ ...prev, loading: false }));
        }
    };

    const openCount = tickets.filter(t => t.status === 'Open').length;
    const inProgressCount = tickets.filter(t => t.status === 'In Progress').length;
    const criticalCount = tickets.filter(t => t.priority === 'Critical' && t.status !== 'Resolved').length;
    const resolvedCount = tickets.filter(t => t.status === 'Resolved').length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FiLifeBuoy className="text-indigo-600" />
                        Helpdesk & Support Management
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Track support requests, bug reports, and maintenance tickets across all client colleges.
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
                        onClick={() => setCreateModal(prev => ({ ...prev, open: true }))}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-md text-xs transition-all"
                    >
                        <FiPlus size={16} /> Open New Support Ticket
                    </button>
                </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div
                    onClick={() => setStatusFilter('Open')}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 cursor-pointer"
                >
                    <p className="text-xs text-amber-500 uppercase font-semibold">Open Tickets</p>
                    <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{openCount}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('In Progress')}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 cursor-pointer"
                >
                    <p className="text-xs text-indigo-500 uppercase font-semibold">In Progress</p>
                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">{inProgressCount}</p>
                </div>
                <div
                    onClick={() => setPriorityFilter('Critical')}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 cursor-pointer"
                >
                    <p className="text-xs text-rose-500 uppercase font-semibold">Critical Issues</p>
                    <p className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{criticalCount}</p>
                </div>
                <div
                    onClick={() => setStatusFilter('Resolved')}
                    className="p-4 rounded-xl border bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 cursor-pointer"
                >
                    <p className="text-xs text-emerald-500 uppercase font-semibold">Resolved</p>
                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder="Search ticket #, title, or institution..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white"
                    >
                        <option value="ALL">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>

                    <select
                        value={priorityFilter}
                        onChange={(e) => setPriorityFilter(e.target.value)}
                        className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold dark:text-white"
                    >
                        <option value="ALL">All Priorities</option>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Critical">Critical</option>
                    </select>
                </div>
            </div>

            {/* Ticket List Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-700 uppercase">
                            <tr>
                                <th className="py-3.5 px-6">Ticket & Issue</th>
                                <th className="py-3.5 px-4">Institution</th>
                                <th className="py-3.5 px-4">Category</th>
                                <th className="py-3.5 px-4">Priority</th>
                                <th className="py-3.5 px-4">Status</th>
                                <th className="py-3.5 px-4">Created Date</th>
                                <th className="py-3.5 px-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">Loading support tickets...</td>
                                </tr>
                            ) : filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="py-12 text-center text-slate-400">No support tickets found.</td>
                                </tr>
                            ) : (
                                filteredTickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded">
                                                    {t.ticketNumber}
                                                </span>
                                                <span className="font-bold text-slate-800 dark:text-white text-xs">{t.title}</span>
                                            </div>
                                            <p className="text-slate-500 text-[11px] truncate max-w-sm">{t.description}</p>
                                        </td>
                                        <td className="py-4 px-4 font-semibold text-slate-700 dark:text-slate-200">
                                            {t.college?.collegeName || 'General Issue'}
                                            <span className="block text-[10px] text-slate-400 font-mono">{t.college?.collegeCode}</span>
                                        </td>
                                        <td className="py-4 px-4 text-slate-600 dark:text-slate-300">{t.category}</td>
                                        <td className="py-4 px-4">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                                t.priority === 'Critical' ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400' :
                                                t.priority === 'High' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
                                                t.priority === 'Medium' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                                'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                            }`}>
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                t.status === 'Resolved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                                                t.status === 'In Progress' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' :
                                                'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                            }`}>
                                                {t.status}
                                            </span>
                                        </td>
                                        <td className="py-4 px-4 text-slate-500 font-mono">
                                            {new Date(t.createdAt).toLocaleDateString('en-IN')}
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <button
                                                onClick={() => setStatusModal({
                                                    open: true,
                                                    ticket: t,
                                                    status: t.status === 'Resolved' ? 'Closed' : 'Resolved',
                                                    resolutionNotes: t.resolutionNotes || '',
                                                    loading: false
                                                })}
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 text-indigo-600 dark:text-indigo-300 font-semibold rounded-lg text-xs transition-colors"
                                            >
                                                <FiEdit3 size={12} /> Update Status
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Ticket Modal */}
            {createModal.open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                            <FiLifeBuoy className="text-indigo-600" /> Open New Support Ticket
                        </h3>
                        <form onSubmit={handleCreateTicket} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Select Institution</label>
                                <select
                                    value={createModal.collegeId}
                                    onChange={(e) => setCreateModal({ ...createModal, collegeId: e.target.value })}
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
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Issue Title</label>
                                <input
                                    type="text"
                                    placeholder="Brief summary of the inquiry or issue..."
                                    value={createModal.title}
                                    onChange={(e) => setCreateModal({ ...createModal, title: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    required
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Priority</label>
                                    <select
                                        value={createModal.priority}
                                        onChange={(e) => setCreateModal({ ...createModal, priority: e.target.value })}
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
                                        value={createModal.category}
                                        onChange={(e) => setCreateModal({ ...createModal, category: e.target.value })}
                                        className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    >
                                        <option value="Software Issue">Software Issue</option>
                                        <option value="Database">Database Error</option>
                                        <option value="License Renewal">License Inquiry</option>
                                        <option value="Feature Request">Feature Request</option>
                                        <option value="Data Correction">Data Correction</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Description</label>
                                <textarea
                                    rows="3"
                                    placeholder="Detailed logs or steps..."
                                    value={createModal.description}
                                    onChange={(e) => setCreateModal({ ...createModal, description: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                    required
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setCreateModal({ ...createModal, open: false })}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={createModal.loading}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                                >
                                    {createModal.loading ? 'Creating...' : 'Submit Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Update Status Modal */}
            {statusModal.open && statusModal.ticket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                            <FiCheckCircle className="text-emerald-600" /> Update Ticket {statusModal.ticket.ticketNumber}
                        </h3>
                        <p className="text-xs text-slate-500 mb-4">{statusModal.ticket.title}</p>
                        <form onSubmit={handleUpdateStatus} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Set Lifecycle Status</label>
                                <select
                                    value={statusModal.status}
                                    onChange={(e) => setStatusModal({ ...statusModal, status: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                >
                                    <option value="Open">Open</option>
                                    <option value="In Progress">In Progress</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Closed">Closed</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Resolution Summary / Notes</label>
                                <textarea
                                    rows="3"
                                    placeholder="Explain how the issue was diagnosed and resolved..."
                                    value={statusModal.resolutionNotes}
                                    onChange={(e) => setStatusModal({ ...statusModal, resolutionNotes: e.target.value })}
                                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs dark:text-white"
                                />
                            </div>
                            <div className="mt-6 flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setStatusModal({ ...statusModal, open: false })}
                                    className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={statusModal.loading}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow"
                                >
                                    {statusModal.loading ? 'Saving...' : 'Update Ticket'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportManagement;