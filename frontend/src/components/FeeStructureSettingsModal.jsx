import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Edit3, Plus, Trash2, RotateCcw, X, 
  CheckCircle2, AlertCircle, Sparkles, BookOpen, ShieldCheck, 
  Layers, ChevronRight, HelpCircle
} from 'lucide-react';
import Toast from './Toast';

const FeeStructureSettingsModal = ({ isOpen, onClose, onFeeUpdated }) => {
  const [courses, setCourses] = useState([]);
  const [ancillary, setAncillary] = useState({ cautionMoney: 300, provisionalPromotionFee: 300 });
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Edit / Create Form state
  const [editingCourse, setEditingCourse] = useState(null); // null if not editing/creating
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    duration: '1 Year',
    totalSeats: 120,
    schemeType: 'Semester Scheme',
    academicYear: '1st Year',
    semester: 'I and II Semester',
    firstInstallment: 16000,
    firstInstallmentDesc: 'at the time of Admission',
    secondInstallment: 9000,
    secondInstallmentDesc: 'at the time of Exam Form',
    totalFee: 25000,
    cautionMoney: 300,
    provisionalPromotionFee: 300,
    isActive: true
  });

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchFeeStructures = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses/fee-structures', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(data.courses || []);
        if (data.ancillary) setAncillary(data.ancillary);
      } else {
        showToastMsg(data.message || 'Error loading fee structures', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFeeStructures();
    }
  }, [isOpen]);

  const handleOpenEdit = (c) => {
    setEditingCourse(c);
    setFormData({
      name: c.name || '',
      code: c.code || '',
      duration: c.duration || '1 Year',
      totalSeats: c.totalSeats || 120,
      schemeType: c.schemeType || 'Semester Scheme',
      academicYear: c.academicYear || '1st Year',
      semester: c.semester || 'Annual',
      firstInstallment: c.firstInstallment || 0,
      firstInstallmentDesc: c.firstInstallmentDesc || 'at the time of Admission',
      secondInstallment: c.secondInstallment || 0,
      secondInstallmentDesc: c.secondInstallmentDesc || 'at the time of Exam Form',
      totalFee: c.totalFee || (Number(c.firstInstallment || 0) + Number(c.secondInstallment || 0)),
      cautionMoney: c.cautionMoney !== undefined ? c.cautionMoney : 300,
      provisionalPromotionFee: c.provisionalPromotionFee !== undefined ? c.provisionalPromotionFee : 300,
      isActive: c.isActive !== undefined ? c.isActive : true
    });
  };

  const handleOpenAddNew = () => {
    setEditingCourse({ isNew: true });
    setFormData({
      name: '',
      code: '',
      duration: '1 Year',
      totalSeats: 120,
      schemeType: 'Semester Scheme',
      academicYear: '1st Year',
      semester: 'I and II Semester',
      firstInstallment: 15000,
      firstInstallmentDesc: 'at the time of Admission',
      secondInstallment: 8000,
      secondInstallmentDesc: 'at the time of Exam Form',
      totalFee: 23000,
      cautionMoney: 300,
      provisionalPromotionFee: 300,
      isActive: true
    });
  };

  // Auto-update totalFee when 1st or 2nd installment changes
  const handleInstallmentChange = (field, value) => {
    const numVal = Number(value) || 0;
    const updated = { ...formData, [field]: numVal };
    updated.totalFee = (Number(updated.firstInstallment) || 0) + (Number(updated.secondInstallment) || 0);
    setFormData(updated);
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    try {
      let url = '/api/courses';
      let method = 'POST';

      if (editingCourse && !editingCourse.isNew && editingCourse.id) {
        url = `/api/courses/${editingCourse.id}`;
        method = 'PUT';
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        showToastMsg(data.message || 'Fee structure saved successfully!', 'success');
        setEditingCourse(null);
        fetchFeeStructures();
        if (onFeeUpdated) onFeeUpdated();
      } else {
        showToastMsg(data.message || 'Error saving fee structure', 'error');
      }
    } catch (err) {
      showToastMsg('Server communication failed', 'error');
    }
  };

  const handleDeleteCourse = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to delete class/fee structure "${courseName}"?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/courses/${courseId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(data.message || 'Deleted successfully', 'success');
        fetchFeeStructures();
        if (onFeeUpdated) onFeeUpdated();
      } else {
        showToastMsg(data.message || 'Error deleting course', 'error');
      }
    } catch (err) {
      showToastMsg('Failed to delete course', 'error');
    }
  };

  const handleResetToDefaults = async () => {
    if (!window.confirm('Reset all course fees & installments to official College Prospectus rates?')) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses/reset-defaults', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(data.message || 'Reset to official prospectus rates completed!', 'success');
        fetchFeeStructures();
        if (onFeeUpdated) onFeeUpdated();
      } else {
        showToastMsg(data.message || 'Error resetting rates', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <div className="bg-white dark:bg-darkbg-surface w-full max-w-5xl rounded-3xl shadow-2xl border border-warm-200/80 dark:border-darkbg-border overflow-hidden my-6 flex flex-col max-h-[92vh]">
        
        {/* Top Header */}
        <div className="p-5 md:p-6 bg-gradient-to-r from-brand-500/10 via-warm-50 to-amber-500/10 dark:from-darkbg-base dark:via-darkbg-surface dark:to-darkbg-base border-b border-warm-200/60 dark:border-darkbg-border flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="p-3 bg-brand-500 text-white rounded-2xl shadow-sm">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base md:text-lg font-black text-warm-900 dark:text-slate-100 font-serif">
                  Classes & Fee Structure Master Settings
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-brand-500/15 text-brand-600 dark:text-brand-300">
                  Official Prospectus
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Configure class-wise installment rules, tuition fees, admission charges, and caution money.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetToDefaults}
              className="px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base hover:bg-warm-100/50 text-[11px] font-bold text-warm-900 dark:text-slate-200 flex items-center space-x-1.5 transition-all shadow-sm"
              title="Reset all courses to official Prospectus rates"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Reset to Prospectus</span>
            </button>

            <button 
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-warm-900 dark:hover:text-slate-100 hover:bg-warm-100 dark:hover:bg-darkbg-base transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body Container */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 custom-scrollbar">

          {/* Quick Ancillary Notes Bar (Caution Money & Promotion Fee) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-warm-50/70 dark:bg-darkbg-base p-4 rounded-2xl border border-warm-200/60 dark:border-darkbg-border">
            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-warm-900 dark:text-slate-100 block">
                  Caution Money: <strong className="text-brand-600 dark:text-brand-400">₹300/-</strong>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Applicable only for Fresh Students at initial admission.
                </span>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-600 shrink-0 mt-0.5">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-warm-900 dark:text-slate-100 block">
                  Provisional Promotion Fee: <strong className="text-brand-600 dark:text-brand-400">₹300/-</strong>
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  For Semesters II, IV, VI at the time of filling Exam form of Sem I, III, V.
                </span>
              </div>
            </div>
          </div>

          {/* Editing / Creating Form Card */}
          {editingCourse && (
            <form onSubmit={handleSaveCourse} className="classy-card p-5 bg-warm-50 dark:bg-darkbg-base border-2 border-brand-500/40 rounded-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-warm-200 dark:border-darkbg-border pb-3">
                <div className="flex items-center space-x-2">
                  <Edit3 className="w-4 h-4 text-brand-500" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-warm-900 dark:text-slate-100">
                    {editingCourse.isNew ? 'Add New Class & Fee Structure' : `Edit Fee Structure: ${formData.name}`}
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="text-xs text-slate-400 hover:text-rose-500 font-bold"
                >
                  Cancel
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Class / Programme Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. LL.B. I & II Semester"
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-bold outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Course Code *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g. LLB-SEM1-2"
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-mono font-bold uppercase outline-none focus:border-brand-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Scheme Type / Academic Year
                  </label>
                  <select
                    value={formData.schemeType}
                    onChange={(e) => setFormData({ ...formData, schemeType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-semibold"
                  >
                    <option value="Semester Scheme">Semester Scheme</option>
                    <option value="Annual Scheme">Annual Scheme</option>
                    <option value="Diploma Scheme">Diploma Scheme</option>
                    <option value="Post Graduate (Part - I)">Post Graduate (Part - I)</option>
                    <option value="Post Graduate (Part - II)">Post Graduate (Part - II)</option>
                  </select>
                </div>

                {/* 1st Installment */}
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    First Installment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.firstInstallment}
                    onChange={(e) => handleInstallmentChange('firstInstallment', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-500 bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400 font-mono font-bold text-sm outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    First Installment Stage / Description
                  </label>
                  <input
                    type="text"
                    value={formData.firstInstallmentDesc}
                    onChange={(e) => setFormData({ ...formData, firstInstallmentDesc: e.target.value })}
                    placeholder="e.g. at the time of Admission"
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-medium outline-none"
                  />
                </div>

                {/* 2nd Installment */}
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Second Installment Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.secondInstallment}
                    onChange={(e) => handleInstallmentChange('secondInstallment', e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-brand-500 bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400 font-mono font-bold text-sm outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Second Installment Stage / Description
                  </label>
                  <input
                    type="text"
                    value={formData.secondInstallmentDesc}
                    onChange={(e) => setFormData({ ...formData, secondInstallmentDesc: e.target.value })}
                    placeholder="e.g. at the time of Exam Form of I Semester"
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-medium outline-none"
                  />
                </div>

                {/* Computed Total & Caution Money */}
                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Total Annual Course Fee (₹)
                  </label>
                  <div className="w-full px-3 py-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black text-sm flex items-center justify-between">
                    <span>₹{Number(formData.totalFee).toLocaleString('en-IN')}/-</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Auto Sum</span>
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Caution Money (Fresh Student)
                  </label>
                  <input
                    type="number"
                    value={formData.cautionMoney}
                    onChange={(e) => setFormData({ ...formData, cautionMoney: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-mono font-bold outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-500 dark:text-slate-400 uppercase text-[10px] mb-1">
                    Provisional Promotion Fee
                  </label>
                  <input
                    type="number"
                    value={formData.provisionalPromotionFee}
                    onChange={(e) => setFormData({ ...formData, provisionalPromotionFee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-mono font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-warm-200 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setEditingCourse(null)}
                  className="px-4 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-warm-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  Save Fee Structure
                </button>
              </div>
            </form>
          )}

          {/* Classes & Fee Structure Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-warm-900 dark:text-slate-100 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-brand-500" />
                <span>Active College Classes & Fee Rates ({courses.length})</span>
              </h4>

              {!editingCourse && (
                <button
                  onClick={handleOpenAddNew}
                  className="px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Class / Course</span>
                </button>
              )}
            </div>

            <div className="border border-warm-200 dark:border-darkbg-border rounded-2xl overflow-hidden bg-white dark:bg-darkbg-surface shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-warm-200 dark:border-darkbg-border">
                      <th className="px-4 py-3">Class / Programme</th>
                      <th className="px-4 py-3">Scheme & Year</th>
                      <th className="px-4 py-3">First Installment</th>
                      <th className="px-4 py-3">Second Installment</th>
                      <th className="px-4 py-3 text-right">Total Annual Fee</th>
                      <th className="px-4 py-3 text-center">Caution</th>
                      <th className="px-4 py-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border font-medium">
                    {courses.map((c) => (
                      <tr key={c.id || c._id} className="hover:bg-warm-50/60 dark:hover:bg-darkbg-base/60 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-warm-900 dark:text-slate-100 text-xs">
                            {c.name}
                          </div>
                          <span className="font-mono text-[10px] text-slate-400 uppercase font-semibold">
                            {c.code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-600 dark:text-slate-300">
                          <span className="px-2 py-0.5 rounded-md bg-warm-100 dark:bg-darkbg-base text-[10px] font-bold block w-fit">
                            {c.schemeType || c.duration}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {c.semester || c.academicYear}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <strong className="text-brand-600 dark:text-brand-400 font-mono font-bold text-xs block">
                            ₹{Number(c.firstInstallment || 0).toLocaleString('en-IN')}/-
                          </strong>
                          <span className="text-[10px] text-slate-400 block">
                            {c.firstInstallmentDesc || 'Admission stage'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <strong className="text-brand-600 dark:text-brand-400 font-mono font-bold text-xs block">
                            ₹{Number(c.secondInstallment || 0).toLocaleString('en-IN')}/-
                          </strong>
                          <span className="text-[10px] text-slate-400 block">
                            {c.secondInstallmentDesc || 'Exam form stage'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right font-black font-mono text-emerald-600 dark:text-emerald-400 text-xs">
                          ₹{Number(c.totalFee || (Number(c.firstInstallment || 0) + Number(c.secondInstallment || 0))).toLocaleString('en-IN')}/-
                        </td>
                        <td className="px-4 py-3.5 text-center font-mono font-bold text-slate-500">
                          {c.cautionMoney > 0 ? `₹${c.cautionMoney}` : '-'}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button
                              onClick={() => handleOpenEdit(c)}
                              className="p-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base hover:bg-brand-500 hover:text-white text-slate-600 dark:text-slate-300 transition-colors shadow-sm"
                              title="Edit fee amounts & stages"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id || c._id, c.name)}
                              className="p-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base hover:bg-rose-500 hover:text-white text-slate-400 hover:text-white transition-colors shadow-sm"
                              title="Delete course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 md:p-5 bg-warm-50 dark:bg-darkbg-base border-t border-warm-200/50 dark:border-darkbg-border flex items-center justify-between text-xs">
          <span className="text-slate-400">
            Changes saved here take effect immediately in student registration, fee receipts, and promotion rules.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-warm-200 dark:bg-darkbg-border font-bold text-warm-900 dark:text-slate-200 hover:bg-warm-300 transition-colors"
          >
            Close Settings
          </button>
        </div>

      </div>
    </div>
  );
};

export default FeeStructureSettingsModal;
