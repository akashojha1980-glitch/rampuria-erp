import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Users, UserPlus, Shield, ShieldAlert, Key, Edit, Trash2, CheckSquare, Square, 
  LayoutDashboard, UserCheck, FileCheck, CreditCard, BookOpen, X, Loader, BarChart3
} from 'lucide-react';
import Loading from '../components/Loading';

const MODULES = [
  { key: 'dashboard', name: 'Dashboard Console', icon: <LayoutDashboard className="w-4 h-4" />, color: 'bg-indigo-500/10 text-indigo-700 dark:text-indigo-300' },
  { key: 'registration', name: 'Student Registration', icon: <UserCheck className="w-4 h-4" />, color: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' },
  { key: 'verification', name: 'Document Verification', icon: <FileCheck className="w-4 h-4" />, color: 'bg-amber-500/10 text-amber-700 dark:text-amber-300' },
  { key: 'fees', name: 'Fees Console', icon: <CreditCard className="w-4 h-4" />, color: 'bg-rose-500/10 text-rose-700 dark:text-rose-300' },
  { key: 'library', name: 'Library Console', icon: <BookOpen className="w-4 h-4" />, color: 'bg-sky-500/10 text-sky-700 dark:text-sky-300' },
  { key: 'reports', name: 'Reports Panel', icon: <BarChart3 className="w-4 h-4" />, color: 'bg-purple-500/10 text-purple-700 dark:text-purple-300' },
];

const UserManagement = () => {
  const { admin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    permissions: []
  });
  const [modalError, setModalError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to fetch user list');
      }
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      username: '',
      password: '',
      permissions: ['dashboard'] // Default permission
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      password: '', // Leave blank to keep current password
      permissions: user.permissions || []
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleTogglePermission = (key) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(key);
      const updated = isSelected 
        ? prev.permissions.filter(p => p !== key)
        : [...prev.permissions, key];
      return { ...prev, permissions: updated };
    });
  };

  const handleSelectAllPermissions = () => {
    setFormData(prev => {
      const allKeys = MODULES.map(m => m.key);
      const isAllSelected = prev.permissions.length === MODULES.length;
      return { ...prev, permissions: isAllSelected ? [] : allKeys };
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError(null);
    setSubmitting(true);

    if (!formData.name.trim()) {
      setModalError('Full Name is required');
      setSubmitting(false);
      return;
    }
    if (!formData.username.trim()) {
      setModalError('Username is required');
      setSubmitting(false);
      return;
    }
    if (!editingUser && !formData.password) {
      setModalError('Password is required for new accounts');
      setSubmitting(false);
      return;
    }

    try {
      const method = editingUser ? 'PUT' : 'POST';
      const url = editingUser ? `/api/auth/users/${editingUser.id}` : '/api/auth/users';
      
      const payload = {
        name: formData.name,
        username: formData.username,
        permissions: formData.permissions
      };
      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Operation failed');
      }

      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setModalError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete the account of ${user.name}?`)) {
      return;
    }
    try {
      const response = await fetch(`/api/auth/users/${user.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to delete user');
      }
      fetchUsers();
    } catch (err) {
      alert(err.message);
    }
  };

  if (admin?.role !== 'SuperAdmin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
        <div className="p-4 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-full mb-4">
          <ShieldAlert className="w-12 h-12" />
        </div>
        <h1 className="text-2xl font-bold text-warm-900 dark:text-slate-100 font-serif mb-2">Unauthorized Access</h1>
        <p className="text-sm text-warm-850 dark:text-slate-400 max-w-md">
          Only the primary Super Administrator account has permission to configure staff credentials and modify system access modules.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 min-h-screen">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkbg-surface p-6 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-brand-500/10 dark:bg-brand-500/20 text-brand-650 dark:text-brand-300 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-warm-900 dark:text-slate-100">Staff Access & Role Management</h1>
          </div>
          <p className="text-xs text-warm-800/60 dark:text-slate-400">
            Create secondary administrator profiles and selectively toggle checkbox access permissions for key ERP modules.
          </p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center space-x-2 px-5 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-medium text-xs shadow-md transition duration-200"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Staff Account</span>
        </button>
      </div>

      {loading ? (
        <Loading text="Loading active staff accounts..." />
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-xl text-center">
          <p className="text-rose-600 dark:text-rose-400 text-sm font-semibold">{error}</p>
          <button 
            onClick={fetchUsers}
            className="mt-4 px-4 py-2 bg-rose-600 text-white text-xs font-semibold rounded-lg hover:bg-rose-700 transition"
          >
            Retry Fetch
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {/* User management list */}
          <div className="bg-white dark:bg-darkbg-surface rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm overflow-hidden">
            <div className="px-6 py-5 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Users className="w-4 h-4 text-brand-500" />
                <span>Active Credentials Log ({users.length})</span>
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-warm-50/50 dark:bg-darkbg-base/30 text-warm-800/40 dark:text-slate-400 text-[10px] uppercase font-bold tracking-widest border-b border-warm-200/50 dark:border-darkbg-border">
                    <th className="px-6 py-4">User Identity</th>
                    <th className="px-6 py-4">Username</th>
                    <th className="px-6 py-4">Role Role</th>
                    <th className="px-6 py-4">Module Permissions</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100/50 dark:divide-darkbg-border text-sm">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-warm-50/30 dark:hover:bg-darkbg-base/20 transition-colors">
                      <td className="px-6 py-4.5">
                        <div className="flex items-center space-x-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
                            {user.name.split(' ').map(n=>n[0]).join('') || 'ST'}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-bold text-warm-900 dark:text-slate-200 leading-tight">{user.name}</span>
                            <span className="text-[10px] text-warm-800/40 dark:text-slate-500 font-medium">Secondary Administrator</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className="font-mono text-xs font-semibold text-warm-850 dark:text-slate-300 bg-warm-100/60 dark:bg-darkbg-base px-2.5 py-1.5 rounded-lg border border-warm-200/40 dark:border-darkbg-border">
                          {user.username}
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                          ${user.role === 'SuperAdmin' 
                            ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/20' 
                            : 'bg-brand-500/15 text-brand-700 dark:text-brand-300 border border-brand-500/20'}`}
                        >
                          <Shield className="w-3 h-3" />
                          <span>{user.role}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4.5">
                        <div className="flex flex-wrap gap-1.5 max-w-md">
                          {user.role === 'SuperAdmin' ? (
                            <span className="text-[10px] font-bold text-amber-600 bg-amber-500/5 border border-amber-500/10 px-2 py-1 rounded-lg">
                              ★ All Modules Active (Master Permission)
                            </span>
                          ) : user.permissions && user.permissions.length > 0 ? (
                            user.permissions.map(pKey => {
                              const module = MODULES.find(m => m.key === pKey);
                              return module ? (
                                <span 
                                  key={pKey} 
                                  className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-warm-200/40 dark:border-darkbg-border ${module.color}`}
                                >
                                  {module.icon}
                                  <span>{module.name.split(' ')[0]}</span>
                                </span>
                              ) : null;
                            })
                          ) : (
                            <span className="text-[10px] font-bold text-rose-500 bg-rose-500/5 border border-rose-500/10 px-2.5 py-1 rounded-lg">
                              ⚠ No Modules Authorized
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4.5 text-right">
                        <div className="flex items-center justify-end space-x-2.5">
                          <button
                            onClick={() => handleOpenEditModal(user)}
                            className="p-2 rounded-xl text-warm-800/50 hover:text-brand-600 hover:bg-brand-500/10 transition-colors"
                            title="Edit Permissions / Account"
                          >
                            <Edit className="w-4.5 h-4.5" />
                          </button>
                          
                          {/* Disable delete for self and primary 'admin' */}
                          {user.id !== admin.id && user.username !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(user)}
                              className="p-2 rounded-xl text-warm-800/50 hover:text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Delete Account"
                            >
                              <Trash2 className="w-4.5 h-4.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Royal Form Dialog (Add / Edit User) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-warm-900/60 dark:bg-black/70 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsModalOpen(false)}
          />
          
          <div className="relative bg-white dark:bg-darkbg-surface border border-warm-250 dark:border-darkbg-border w-full max-w-lg rounded-2xl shadow-xl overflow-hidden z-10 my-8">
            <div className="px-6 py-5 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <span className="text-xs font-bold text-warm-900 dark:text-slate-200 uppercase tracking-wider flex items-center space-x-2">
                <Key className="w-4 h-4 text-brand-500" />
                <span>{editingUser ? 'Modify Staff Permissions' : 'Register New Staff Profile'}</span>
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-warm-800/40 hover:bg-warm-50 dark:hover:bg-darkbg-base transition"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {modalError && (
                <div className="p-3.5 bg-rose-500/10 border border-rose-200 dark:border-rose-900/30 rounded-xl text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                  {modalError}
                </div>
              )}

              {/* Text fields */}
              <div className="grid grid-cols-1 gap-4">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/40 dark:text-slate-400 uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter Staff Name"
                    className="px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base/50 text-sm text-warm-900 dark:text-slate-100 placeholder-warm-800/30 dark:placeholder-slate-500 outline-none focus:border-brand-500 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/40 dark:text-slate-400 uppercase tracking-wider">Username</label>
                    <input
                      type="text"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      placeholder="e.g. operator1"
                      disabled={!!editingUser}
                      className="px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base/50 text-sm text-warm-900 dark:text-slate-100 placeholder-warm-800/30 dark:placeholder-slate-500 outline-none focus:border-brand-500 transition-colors disabled:opacity-50"
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/40 dark:text-slate-400 uppercase tracking-wider">
                      {editingUser ? 'Reset Password (Optional)' : 'Password'}
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder={editingUser ? 'Leave blank to retain' : '••••••••'}
                      className="px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base/50 text-sm text-warm-900 dark:text-slate-100 placeholder-warm-800/30 dark:placeholder-slate-500 outline-none focus:border-brand-500 transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* Module selection switches */}
              {editingUser?.username === 'admin' ? (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-700 dark:text-amber-400 font-medium">
                  Primary default Admin has permanent full access configuration to all active ERP modules.
                </div>
              ) : (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-warm-800/40 dark:text-slate-400 uppercase tracking-wider">Authorized ERP modules</label>
                    <button
                      type="button"
                      onClick={handleSelectAllPermissions}
                      className="text-[10px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-350 dark:hover:text-brand-300 uppercase tracking-wider"
                    >
                      {formData.permissions.length === MODULES.length ? 'Clear All' : 'Select All'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 max-h-[220px] overflow-y-auto pr-1">
                    {MODULES.map((module) => {
                      const isSelected = formData.permissions.includes(module.key);
                      return (
                        <button
                          key={module.key}
                          type="button"
                          onClick={() => handleTogglePermission(module.key)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border transition-all text-left
                            ${isSelected 
                              ? 'bg-brand-500/5 dark:bg-brand-500/10 border-brand-500/30 text-warm-900 dark:text-slate-200' 
                              : 'bg-warm-50/30 dark:bg-darkbg-base/30 border-warm-200 dark:border-darkbg-border hover:bg-warm-50 dark:hover:bg-darkbg-base/70 text-warm-800/60 dark:text-slate-400'}`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className={`p-1.5 rounded-lg ${module.color}`}>
                              {module.icon}
                            </div>
                            <span className="text-xs font-semibold">{module.name}</span>
                          </div>
                          <div>
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-brand-600 dark:text-brand-400" />
                            ) : (
                              <Square className="w-5 h-5 text-warm-800/20 dark:text-slate-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3.5 pt-4 border-t border-warm-200/50 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border text-xs font-bold text-warm-800/60 dark:text-slate-400 hover:bg-warm-50 dark:hover:bg-darkbg-base transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md transition disabled:opacity-50"
                >
                  {submitting && <Loader className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingUser ? 'Save Changes' : 'Create Account'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
