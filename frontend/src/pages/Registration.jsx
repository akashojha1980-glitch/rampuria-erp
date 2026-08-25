import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Filter, Download, ArrowLeft,
  ChevronLeft, ChevronRight, Edit2, Trash2, Eye, Calendar, TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const Registration = () => {
  const navigate = useNavigate();
  
  // Tabs: 'list' or 'form'
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [toast, setToast] = useState(null);

  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  // Bulk Promotion States
  const [selectedIds, setSelectedIds] = useState([]);
  const [showBulkPromoteModal, setShowBulkPromoteModal] = useState(false);
  const [bulkPromoteForm, setBulkPromoteForm] = useState({
    academicYear: '1st Year',
    semester: 'Annual'
  });
  const [submittingBulkPromotion, setSubmittingBulkPromotion] = useState(false);

  // Form States (for registering/editing)
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    fatherName: '',
    motherName: '',
    mobileNumber: '',
    alternateMobile: '',
    email: '',
    gender: 'Male',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    category: 'General',
    marks10: '',
    board10: '',
    passingYear10: '',
    marks12: '',
    board12: '',
    passingYear12: '',
    subject12: '',
    courseApplied: '',
    
    // New physical form fields
    admissionBase: 'UG',
    formNo: '',
    studentAccNo: '',
    medium: 'English',
    permanentAddress: '',
    parentsContact: '',
    whatsAppNo: '',
    aadharNo: '',
    yearlyIncomeFather: '',
    yearlyIncomeMother: '',
    
    // Qualifying Exam
    qualExamName: '',
    qualUniversity: '',
    qualType: 'Regular',
    qualYear: '',
    qualMaxMarks: '',
    qualObtainedMarks: '',
    qualPercentage: '',
    
    // Academic details extra
    maxMarks10: '',
    obtainedMarks10: '',
    maxMarks12: '',
    obtainedMarks12: '',
    
    gradUniversity: '',
    gradYear: '',
    gradSubject: '',
    gradMaxMarks: '',
    gradObtainedMarks: '',
    gradPercentage: '',
    
    pgUniversity: '',
    pgYear: '',
    pgSubject: '',
    pgMaxMarks: '',
    pgObtainedMarks: '',
    pgPercentage: '',
    
    otherExamName: '',
    otherUniversity: '',
    otherYear: '',
    otherSubject: '',
    otherMaxMarks: '',
    otherObtainedMarks: '',
    otherPercentage: ''
  });

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Fetch Students & Courses
  const fetchStudents = async () => {
    setLoading(true);
    setSelectedIds([]);
    const token = localStorage.getItem('token');
    try {
      const queryParams = new URLSearchParams({
        page,
        limit: 8,
        search,
        course: courseFilter,
        status: statusFilter,
        category: categoryFilter
      });

      const res = await fetch(`/api/students?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setStudents(data.students || []);
        setPages(data.pages || 1);
        setTotalStudents(data.total || 0);
      }
    } catch (err) {
      console.error('[Registration Fetch] Local API error:', err.message);
      showToastMsg('Failed to sync student registry from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkPromoteSubmit = async (e) => {
    e.preventDefault();
    if (selectedIds.length === 0) return;
    setSubmittingBulkPromotion(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/students/bulk-promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentIds: selectedIds,
          currentYear: bulkPromoteForm.academicYear,
          currentSemester: bulkPromoteForm.semester
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(`Successfully promoted ${selectedIds.length} students!`);
        setSelectedIds([]);
        setShowBulkPromoteModal(false);
        fetchStudents();
      } else {
        showToastMsg(data.message || 'Error executing bulk promotion', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection error', 'error');
    } finally {
      setSubmittingBulkPromotion(false);
    }
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(data || []);
      }
    } catch (err) {
      console.error('[Courses Fetch] API Error:', err.message);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (activeTab === 'list') {
      fetchStudents();
    }
  }, [activeTab, page, courseFilter, statusFilter, categoryFilter]);

  // Handle Search Submit
  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchStudents();
  };

  // Handle Student Delete
  const handleDelete = async (id) => {
    if (!window.confirm('Are you absolutely sure you want to permanently delete this student record and all uploaded files?')) return;
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToastMsg('Student record removed from system');
        fetchStudents();
      } else {
        const errData = await res.json();
        showToastMsg(errData.message || 'Failed to delete record', 'error');
      }
    } catch (err) {
      showToastMsg('Database connection timeout', 'error');
    }
  };

  // Switch to Form Tab to register new
  const handleOpenRegister = () => {
    setIsEditing(false);
    setEditingId('');
    setFormData({
      fullName: '',
      fatherName: '',
      motherName: '',
      mobileNumber: '',
      alternateMobile: '',
      email: '',
      gender: 'Male',
      dateOfBirth: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      category: 'General',
      marks10: '',
      board10: '',
      passingYear10: '',
      marks12: '',
      board12: '',
      passingYear12: '',
      subject12: '',
      courseApplied: courses[0]?.code || '',

      admissionBase: 'UG',
      formNo: '',
      studentAccNo: '',
      medium: 'English',
      permanentAddress: '',
      parentsContact: '',
      whatsAppNo: '',
      aadharNo: '',
      yearlyIncomeFather: '',
      yearlyIncomeMother: '',

      qualExamName: '',
      qualUniversity: '',
      qualType: 'Regular',
      qualYear: '',
      qualMaxMarks: '',
      qualObtainedMarks: '',
      qualPercentage: '',

      maxMarks10: '',
      obtainedMarks10: '',
      maxMarks12: '',
      obtainedMarks12: '',

      gradUniversity: '',
      gradYear: '',
      gradSubject: '',
      gradMaxMarks: '',
      gradObtainedMarks: '',
      gradPercentage: '',

      pgUniversity: '',
      pgYear: '',
      pgSubject: '',
      pgMaxMarks: '',
      pgObtainedMarks: '',
      pgPercentage: '',

      otherExamName: '',
      otherUniversity: '',
      otherYear: '',
      otherSubject: '',
      otherMaxMarks: '',
      otherObtainedMarks: '',
      otherPercentage: ''
    });
    setActiveTab('form');
  };

  // Switch to Form Tab to Edit
  const handleOpenEdit = (student) => {
    setIsEditing(true);
    setEditingId(student._id);
    setFormData({
      fullName: student.fullName,
      fatherName: student.fatherName,
      motherName: student.motherName,
      mobileNumber: student.mobileNumber,
      alternateMobile: student.alternateMobile || '',
      email: student.email || '',
      gender: student.gender,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.split('T')[0] : '',
      address: student.address,
      city: student.city || '',
      state: student.state || '',
      pincode: student.pincode || '',
      category: student.category,
      marks10: student.marks10 || '',
      board10: student.board10 || '',
      passingYear10: student.passingYear10 || '',
      marks12: student.marks12 || '',
      board12: student.board12 || '',
      passingYear12: student.passingYear12 || '',
      subject12: student.subject12 || '',
      courseApplied: student.courseApplied,

      admissionBase: student.admissionBase || 'UG',
      formNo: student.formNo || '',
      studentAccNo: student.studentAccNo || '',
      medium: student.medium || 'English',
      permanentAddress: student.permanentAddress || '',
      parentsContact: student.parentsContact || '',
      whatsAppNo: student.whatsAppNo || '',
      aadharNo: student.aadharNo || '',
      yearlyIncomeFather: student.yearlyIncomeFather || '',
      yearlyIncomeMother: student.yearlyIncomeMother || '',

      qualExamName: student.qualExamName || '',
      qualUniversity: student.qualUniversity || '',
      qualType: student.qualType || 'Regular',
      qualYear: student.qualYear || '',
      qualMaxMarks: student.qualMaxMarks || '',
      qualObtainedMarks: student.qualObtainedMarks || '',
      qualPercentage: student.qualPercentage || '',

      maxMarks10: student.maxMarks10 || '',
      obtainedMarks10: student.obtainedMarks10 || '',
      maxMarks12: student.maxMarks12 || '',
      obtainedMarks12: student.obtainedMarks12 || '',

      gradUniversity: student.gradUniversity || '',
      gradYear: student.gradYear || '',
      gradSubject: student.gradSubject || '',
      gradMaxMarks: student.gradMaxMarks || '',
      gradObtainedMarks: student.gradObtainedMarks || '',
      gradPercentage: student.gradPercentage || '',

      pgUniversity: student.pgUniversity || '',
      pgYear: student.pgYear || '',
      pgSubject: student.pgSubject || '',
      pgMaxMarks: student.pgMaxMarks || '',
      pgObtainedMarks: student.pgObtainedMarks || '',
      pgPercentage: student.pgPercentage || '',

      otherExamName: student.otherExamName || '',
      otherUniversity: student.otherUniversity || '',
      otherYear: student.otherYear || '',
      otherSubject: student.otherSubject || '',
      otherMaxMarks: student.otherMaxMarks || '',
      otherObtainedMarks: student.otherObtainedMarks || '',
      otherPercentage: student.otherPercentage || ''
    });
    setActiveTab('form');
  };

  // Intercept Enter key press to move focus Left-to-Right / Row-by-Row
  const handleFormKeyDown = (e) => {
    if (e.key === 'Enter') {
      const target = e.target;
      // Allow standard Enter key inside textareas
      if (target.tagName === 'TEXTAREA') {
        return;
      }
      // Allow standard buttons or submit buttons to trigger click
      if (target.tagName === 'BUTTON' || target.type === 'submit') {
        return;
      }
      
      e.preventDefault();
      const form = target.form;
      if (!form) return;
      
      const selector = 'input:not([disabled]):not([readonly]), select:not([disabled]), textarea:not([disabled]):not([readonly]), button[type="submit"]';
      const elements = Array.from(form.querySelectorAll(selector));
      
      const index = elements.indexOf(target);
      if (index > -1 && index < elements.length - 1) {
        elements[index + 1].focus();
      }
    }
  };

  // Form Submit (Register or Edit)
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    
    const url = isEditing ? `/api/students/${editingId}` : '/api/students';
    const method = isEditing ? 'PUT' : 'POST';

    try {
      const res = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });
      
      const data = await res.json();

      if (res.ok) {
        showToastMsg(isEditing ? 'Student profile updated successfully' : 'Student registered successfully in SQL Server database');
        setActiveTab('list');
        setPage(1);
      } else {
        showToastMsg(data.message || 'Validation error in submission', 'error');
      }
    } catch (err) {
      showToastMsg('Database Connection Error', 'error');
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };
      
      // Auto-compute percentages
      if (name === 'obtainedMarks10' || name === 'maxMarks10') {
        const obt = parseFloat(name === 'obtainedMarks10' ? value : prev.obtainedMarks10);
        const max = parseFloat(name === 'maxMarks10' ? value : prev.maxMarks10);
        updated.marks10 = obt && max ? ((obt / max) * 100).toFixed(2) : '';
      }
      if (name === 'obtainedMarks12' || name === 'maxMarks12') {
        const obt = parseFloat(name === 'obtainedMarks12' ? value : prev.obtainedMarks12);
        const max = parseFloat(name === 'maxMarks12' ? value : prev.maxMarks12);
        updated.marks12 = obt && max ? ((obt / max) * 100).toFixed(2) : '';
      }
      if (name === 'gradObtainedMarks' || name === 'gradMaxMarks') {
        const obt = parseFloat(name === 'gradObtainedMarks' ? value : prev.gradObtainedMarks);
        const max = parseFloat(name === 'gradMaxMarks' ? value : prev.gradMaxMarks);
        updated.gradPercentage = obt && max ? ((obt / max) * 100).toFixed(2) : '';
      }
      if (name === 'pgObtainedMarks' || name === 'pgMaxMarks') {
        const obt = parseFloat(name === 'pgObtainedMarks' ? value : prev.pgObtainedMarks);
        const max = parseFloat(name === 'pgMaxMarks' ? value : prev.pgMaxMarks);
        updated.pgPercentage = obt && max ? ((obt / max) * 100).toFixed(2) : '';
      }
      if (name === 'otherObtainedMarks' || name === 'otherMaxMarks') {
        const obt = parseFloat(name === 'otherObtainedMarks' ? value : prev.otherObtainedMarks);
        const max = parseFloat(name === 'otherMaxMarks' ? value : prev.otherMaxMarks);
        updated.otherPercentage = obt && max ? ((obt / max) * 100).toFixed(2) : '';
      }
      if (name === 'qualObtainedMarks' || name === 'qualMaxMarks') {
        const obt = parseFloat(name === 'qualObtainedMarks' ? value : prev.qualObtainedMarks);
        const max = parseFloat(name === 'qualMaxMarks' ? value : prev.qualMaxMarks);
        updated.qualPercentage = obt && max ? ((obt / max) * 100).toFixed(2) : '';
      }

      return updated;
    });
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Toast Alert */}
      {toast && (
        <Toast 
          message={toast.message} 
          type={toast.type} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Main Tabs Container */}
      <AnimatePresence mode="wait">
        
        {/* TAB 1: Student Registry Table View */}
        {activeTab === 'list' && (
          <motion.div
            key="list-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col space-y-6"
          >
            {/* Filter Controls Toolbar */}
            <div className="classy-card flex flex-col space-y-4">
              
              {/* Toolbar Headers */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Search input */}
                <form onSubmit={handleSearch} className="flex-1 max-w-md relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-warm-800/40 dark:text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by student name, email, mobile..."
                    className="w-full pl-11 pr-4 py-3 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  />
                </form>

                {/* Operations */}
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={handleOpenRegister}
                    className="classy-btn-primary py-3"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Register Student</span>
                  </button>
                </div>
              </div>

              <div className="h-px bg-warm-200/50 dark:bg-darkbg-border w-full" />

              {/* Multi-Filters Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                
                {/* Course Filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Applied Course</label>
                  <select
                    value={courseFilter}
                    onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
                    className="px-3.5 py-2.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-medium outline-none text-warm-800 dark:text-slate-300"
                  >
                    <option value="">All Courses</option>
                    {courses.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
                  </select>
                </div>

                {/* Status Filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Verification Status</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                    className="px-3.5 py-2.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-medium outline-none text-warm-800 dark:text-slate-300"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="verified">Verified</option>
                    <option value="allotted">Seat Allotted</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Category</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                    className="px-3.5 py-2.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-medium outline-none text-warm-800 dark:text-slate-300"
                  >
                    <option value="">All Categories</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Table Container */}
            <div className="classy-card">
              {loading ? (
                <Loading size="md" text="Syncing student registry..." />
              ) : students.length === 0 ? (
                <div className="text-center py-16 text-xs text-warm-800/40 dark:text-slate-500 flex flex-col space-y-2 justify-center items-center">
                  <span>No student records match the active criteria.</span>
                  <button onClick={handleOpenRegister} className="text-xs font-bold text-brand-600 dark:text-brand-300 hover:underline">Register your first student</button>
                </div>
              ) : (
                <div className="flex flex-col space-y-4">
                  {selectedIds.length > 0 && (
                    <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl animate-fade-in no-print">
                      <div className="text-xs font-bold text-indigo-850 dark:text-indigo-300">
                        {selectedIds.length} student(s) selected for batch operations
                      </div>
                      <button
                        onClick={() => setShowBulkPromoteModal(true)}
                        className="flex items-center space-x-2 py-2 px-4 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs transition-colors shadow-md shadow-indigo-600/10"
                      >
                        <TrendingUp className="w-4 h-4" />
                        <span>Promote Selected</span>
                      </button>
                    </div>
                  )}
                  <div className="overflow-x-auto w-full rounded-2xl border border-warm-200/50 dark:border-darkbg-border">
                    <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border">
                      <thead className="bg-warm-50/50 dark:bg-darkbg-base/30">
                        <tr>
                          <th className="w-12 px-6 py-4 text-center">
                            <input
                              type="checkbox"
                              checked={students.length > 0 && selectedIds.length === students.length}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(students.map(st => st._id));
                                } else {
                                  setSelectedIds([]);
                                }
                              }}
                              className="rounded border-warm-300 dark:border-darkbg-border text-brand-600 focus:ring-brand-500"
                            />
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">SR No.</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Mobile</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Year/Sem</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">12th Marks</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Course Applied</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Verification</th>
                          <th className="px-6 py-4 text-center text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border bg-transparent">
                        {students.map((s) => (
                          <tr key={s._id} className={`hover:bg-warm-100/10 dark:hover:bg-darkbg-base/20 transition-all ${selectedIds.includes(s._id) ? 'bg-indigo-50/10 dark:bg-indigo-500/5' : ''}`}>
                            <td className="px-6 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={selectedIds.includes(s._id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedIds(prev => [...prev, s._id]);
                                  } else {
                                    setSelectedIds(prev => prev.filter(id => id !== s._id));
                                  }
                                }}
                                className="rounded border-warm-300 dark:border-darkbg-border text-brand-600 focus:ring-brand-500"
                              />
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-warm-900 dark:text-slate-200">
                              #{s.srNo || '-'}
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <div className="flex flex-col">
                                <span className="font-bold text-warm-900 dark:text-slate-200">{s.fullName}</span>
                                <span className="text-[10px] text-warm-800/40 dark:text-slate-500 font-semibold mt-0.5 uppercase tracking-wider">{s.registrationId}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs text-warm-800/60 dark:text-slate-400">{s.mobileNumber}</td>
                            <td className="px-6 py-4 text-xs text-warm-800/60 dark:text-slate-400 font-semibold">{s.currentYear || '1st Year'} - {s.currentSemester || 'Annual'}</td>
                            <td className="px-6 py-4 text-xs font-bold text-warm-900 dark:text-slate-200">{s.marks12}%</td>
                            <td className="px-6 py-4 text-xs font-bold text-brand-600 dark:text-brand-300">{s.courseApplied}</td>
                            <td className="px-6 py-4 text-xs">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                s.verificationStatus === 'Verified' 
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                  : s.verificationStatus === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              }`}>
                                {s.verificationStatus}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs">
                              <div className="flex items-center justify-center space-x-2.5">
                                <button 
                                  onClick={() => navigate(`/profile/${s._id}`)}
                                  title="View Profile & Fees"
                                  className="p-1.5 rounded-lg text-indigo-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleOpenEdit(s)}
                                  title="Edit Profile"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => handleDelete(s._id)}
                                  title="Delete Permanently"
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination row */}
                  <div className="flex items-center justify-between px-2 pt-2 text-xs font-semibold text-warm-800/60 dark:text-slate-400">
                    <span>Total registry matches: {totalStudents}</span>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => setPage(p => Math.max(p - 1, 1))}
                        disabled={page === 1}
                        className="p-2.5 rounded-lg bg-warm-100/50 hover:bg-warm-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors border border-warm-200/40"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <span>Page {page} of {pages}</span>
                      <button
                        onClick={() => setPage(p => Math.min(p + 1, pages))}
                        disabled={page === pages}
                        className="p-2.5 rounded-lg bg-warm-100/50 hover:bg-warm-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors border border-warm-200/40"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* TAB 2: Entry form to Register or Edit details */}
        {activeTab === 'form' && (
          <motion.div
            key="form-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="classy-card max-w-4xl mx-auto flex flex-col space-y-6"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-warm-200/40 dark:border-darkbg-border pb-4">
              <div className="flex items-center space-x-3">
                <button 
                  onClick={() => setActiveTab('list')}
                  className="p-2 rounded-lg bg-warm-50 hover:bg-warm-100 dark:bg-darkbg-base dark:hover:bg-darkbg-border text-warm-800/50 dark:text-slate-400 transition-colors border border-warm-200/30"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h3 className="text-base font-serif font-semibold text-warm-900 dark:text-white uppercase tracking-wider">
                    {isEditing ? 'Modify Student Profile Details' : 'New Admission Registration'}
                  </h3>
                  <span className="text-xs font-medium text-warm-800/40 dark:text-slate-400">Please populate all required fields correctly</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} onKeyDown={handleFormKeyDown} className="space-y-8">
              
              {/* SECTION 1: Admission & Course Preference */}
              <div className="space-y-4">
                <div className="border-b border-warm-200/40 dark:border-darkbg-border pb-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">1. Course & Admission Information</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  {/* Form No */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Form No *</label>
                    <input
                      type="text"
                      name="formNo"
                      value={formData.formNo}
                      onChange={handleFormChange}
                      placeholder="e.g. 8177"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Student Account No */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Student A/C No</label>
                    <input
                      type="text"
                      name="studentAccNo"
                      value={formData.studentAccNo}
                      onChange={handleFormChange}
                      placeholder="e.g. AC-9812"
                      className="classy-input"
                    />
                  </div>

                  {/* Admission Base */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Admission Base *</label>
                    <select
                      name="admissionBase"
                      value={formData.admissionBase}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    >
                      <option value="UG">Under Graduate (UG)</option>
                      <option value="PG">Post Graduate (PG)</option>
                    </select>
                  </div>

                  {/* Medium */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Medium *</label>
                    <select
                      name="medium"
                      value={formData.medium}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    >
                      <option value="English">English</option>
                      <option value="Hindi">Hindi</option>
                    </select>
                  </div>

                  {/* Applied Course */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Applied Course *</label>
                    <select
                      name="courseApplied"
                      value={formData.courseApplied}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    >
                      <option value="" disabled>Select Course</option>
                      {courses.map(c => (
                        <option key={c.code} value={c.code}>
                          {c.code} - {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* SECTION 2: Personal Profile */}
              <div className="space-y-4">
                <div className="border-b border-warm-200/40 dark:border-darkbg-border pb-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">2. Student Personal Profile</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Full Name */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Student Full Name *</label>
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleFormChange}
                      placeholder="Name in Block Letters"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Father Name */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Father's Full Name *</label>
                    <input
                      type="text"
                      name="fatherName"
                      value={formData.fatherName}
                      onChange={handleFormChange}
                      placeholder="Father's Name"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Mother Name */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Mother's Full Name *</label>
                    <input
                      type="text"
                      name="motherName"
                      value={formData.motherName}
                      onChange={handleFormChange}
                      placeholder="Mother's Name"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Gender */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Gender *</label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* DOB */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Date of Birth *</label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Category */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Category quota *</label>
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    >
                      <option value="General">General</option>
                      <option value="OBC">OBC</option>
                      <option value="SC">SC</option>
                      <option value="ST">ST</option>
                    </select>
                  </div>

                  {/* Aadhar Number */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Aadhar Number *</label>
                    <input
                      type="text"
                      name="aadharNo"
                      value={formData.aadharNo}
                      onChange={handleFormChange}
                      placeholder="12 digit Aadhar No"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Yearly Income Father */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Father's Yearly Income (INR)</label>
                    <input
                      type="number"
                      name="yearlyIncomeFather"
                      value={formData.yearlyIncomeFather}
                      onChange={handleFormChange}
                      placeholder="Father's Annual Income"
                      className="classy-input"
                    />
                  </div>

                  {/* Yearly Income Mother */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Mother's Yearly Income (INR)</label>
                    <input
                      type="number"
                      name="yearlyIncomeMother"
                      value={formData.yearlyIncomeMother}
                      onChange={handleFormChange}
                      placeholder="Mother's Annual Income"
                      className="classy-input"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Address & Contact Details */}
              <div className="space-y-4">
                <div className="border-b border-warm-200/40 dark:border-darkbg-border pb-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">3. Address & Contact Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Mobile Number */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Mobile Number *</label>
                    <input
                      type="tel"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleFormChange}
                      placeholder="Student Mobile"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* WhatsApp Number */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">WhatsApp Number *</label>
                    <input
                      type="tel"
                      name="whatsAppNo"
                      value={formData.whatsAppNo}
                      onChange={handleFormChange}
                      placeholder="WhatsApp Contact"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Alternate Mobile */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Alternate Mobile</label>
                    <input
                      type="tel"
                      name="alternateMobile"
                      value={formData.alternateMobile}
                      onChange={handleFormChange}
                      placeholder="Alternative Phone"
                      className="classy-input"
                    />
                  </div>

                  {/* Parents Contact */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Parents Contact *</label>
                    <input
                      type="tel"
                      name="parentsContact"
                      value={formData.parentsContact}
                      onChange={handleFormChange}
                      placeholder="Guardian Contact"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Email */}
                  <div className="md:col-span-2 flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      placeholder="e.g. student@college.com"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Present Address */}
                  <div className="md:col-span-3 flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Present Address *</label>
                    <textarea
                      name="address"
                      value={formData.address}
                      onChange={handleFormChange}
                      placeholder="Full Present Address"
                      className="classy-input h-20 resize-none"
                      required
                    />
                  </div>

                  {/* City, State, Pincode */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">City *</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleFormChange}
                      placeholder="City"
                      className="classy-input"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">State *</label>
                    <input
                      type="text"
                      name="state"
                      value={formData.state}
                      onChange={handleFormChange}
                      placeholder="State"
                      className="classy-input"
                      required
                    />
                  </div>

                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Pincode *</label>
                    <input
                      type="text"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleFormChange}
                      placeholder="Pincode"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Permanent Address */}
                  <div className="md:col-span-3 flex flex-col space-y-1">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Permanent Address *</label>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            permanentAddress: `${prev.address}, ${prev.city}, ${prev.state} - ${prev.pincode}`
                          }));
                        }}
                        className="text-[10px] font-bold text-brand-600 hover:text-brand-700 dark:text-brand-350 dark:hover:text-brand-400 transition-colors uppercase tracking-wider"
                      >
                        Copy Present Address
                      </button>
                    </div>
                    <textarea
                      name="permanentAddress"
                      value={formData.permanentAddress}
                      onChange={handleFormChange}
                      placeholder="Full Permanent Address"
                      className="classy-input h-20 resize-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: Academic Performance Records */}
              <div className="space-y-4">
                <div className="border-b border-warm-200/40 dark:border-darkbg-border pb-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">4. Details of Examinations Passed</span>
                </div>
                
                <div className="overflow-x-auto rounded-xl border border-warm-200/40 dark:border-darkbg-border bg-warm-50/20 dark:bg-darkbg-base/20">
                  <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border text-xs text-left">
                    <thead className="bg-warm-100/30 dark:bg-darkbg-base/50 text-[10px] font-bold uppercase tracking-wider text-warm-800/70 dark:text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Examination Passed</th>
                        <th className="px-4 py-3">Board / University</th>
                        <th className="px-4 py-3 w-24">Passing Year</th>
                        <th className="px-4 py-3">Main Subjects</th>
                        <th className="px-4 py-3 w-24">Max Marks</th>
                        <th className="px-4 py-3 w-24">Obtained Marks</th>
                        <th className="px-4 py-3 w-24">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border font-medium">
                      
                      {/* 10th Row */}
                      <tr>
                        <td className="px-4 py-3 font-bold text-warm-900 dark:text-slate-200">Secondary (10th) *</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="board10"
                            value={formData.board10}
                            onChange={handleFormChange}
                            placeholder="Board Name"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="passingYear10"
                            value={formData.passingYear10}
                            onChange={handleFormChange}
                            placeholder="Year"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <span className="text-warm-800/40 dark:text-slate-500 pl-2">All General Subjects</span>
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="maxMarks10"
                            value={formData.maxMarks10}
                            onChange={handleFormChange}
                            placeholder="Max"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="obtainedMarks10"
                            value={formData.obtainedMarks10}
                            onChange={handleFormChange}
                            placeholder="Obt"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-warm-900 dark:text-slate-200">{formData.marks10 ? `${formData.marks10}%` : '-'}</span>
                        </td>
                      </tr>

                      {/* 12th Row */}
                      <tr>
                        <td className="px-4 py-3 font-bold text-warm-900 dark:text-slate-200">Sr. Secondary (12th) *</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="board12"
                            value={formData.board12}
                            onChange={handleFormChange}
                            placeholder="Board Name"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="passingYear12"
                            value={formData.passingYear12}
                            onChange={handleFormChange}
                            placeholder="Year"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="subject12"
                            value={formData.subject12}
                            onChange={handleFormChange}
                            placeholder="e.g. Science / Arts"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="maxMarks12"
                            value={formData.maxMarks12}
                            onChange={handleFormChange}
                            placeholder="Max"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                            required
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="obtainedMarks12"
                            value={formData.obtainedMarks12}
                            onChange={handleFormChange}
                            placeholder="Obt"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                            required
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-warm-900 dark:text-slate-200">{formData.marks12 ? `${formData.marks12}%` : '-'}</span>
                        </td>
                      </tr>

                      {/* Graduation Row */}
                      <tr>
                        <td className="px-4 py-3 font-bold text-warm-800/70 dark:text-slate-400">Graduation</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="gradUniversity"
                            value={formData.gradUniversity}
                            onChange={handleFormChange}
                            placeholder="University"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="gradYear"
                            value={formData.gradYear}
                            onChange={handleFormChange}
                            placeholder="Year"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="gradSubject"
                            value={formData.gradSubject}
                            onChange={handleFormChange}
                            placeholder="e.g. B.A. / B.Sc."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="gradMaxMarks"
                            value={formData.gradMaxMarks}
                            onChange={handleFormChange}
                            placeholder="Max"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="gradObtainedMarks"
                            value={formData.gradObtainedMarks}
                            onChange={handleFormChange}
                            placeholder="Obt"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-warm-900 dark:text-slate-200">{formData.gradPercentage ? `${formData.gradPercentage}%` : '-'}</span>
                        </td>
                      </tr>

                      {/* Post Graduation Row */}
                      <tr>
                        <td className="px-4 py-3 font-bold text-warm-800/70 dark:text-slate-400">Post Graduation</td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="pgUniversity"
                            value={formData.pgUniversity}
                            onChange={handleFormChange}
                            placeholder="University"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="pgYear"
                            value={formData.pgYear}
                            onChange={handleFormChange}
                            placeholder="Year"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="pgSubject"
                            value={formData.pgSubject}
                            onChange={handleFormChange}
                            placeholder="e.g. M.A. / M.Sc."
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="pgMaxMarks"
                            value={formData.pgMaxMarks}
                            onChange={handleFormChange}
                            placeholder="Max"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="pgObtainedMarks"
                            value={formData.pgObtainedMarks}
                            onChange={handleFormChange}
                            placeholder="Obt"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-warm-900 dark:text-slate-200">{formData.pgPercentage ? `${formData.pgPercentage}%` : '-'}</span>
                        </td>
                      </tr>

                      {/* Other Examination Row */}
                      <tr>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="otherExamName"
                            value={formData.otherExamName}
                            onChange={handleFormChange}
                            placeholder="Other Exam Name (e.g. Diploma)"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none font-bold text-warm-850 dark:text-slate-400"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="otherUniversity"
                            value={formData.otherUniversity}
                            onChange={handleFormChange}
                            placeholder="Board / University"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="otherYear"
                            value={formData.otherYear}
                            onChange={handleFormChange}
                            placeholder="Year"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="text"
                            name="otherSubject"
                            value={formData.otherSubject}
                            onChange={handleFormChange}
                            placeholder="Subjects"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="otherMaxMarks"
                            value={formData.otherMaxMarks}
                            onChange={handleFormChange}
                            placeholder="Max"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-2 py-2">
                          <input
                            type="number"
                            name="otherObtainedMarks"
                            value={formData.otherObtainedMarks}
                            onChange={handleFormChange}
                            placeholder="Obt"
                            className="w-full px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs outline-none text-center"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-bold text-warm-900 dark:text-slate-200">{formData.otherPercentage ? `${formData.otherPercentage}%` : '-'}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* SECTION 5: Qualifying Examination Details */}
              <div className="space-y-4">
                <div className="border-b border-warm-200/40 dark:border-darkbg-border pb-2">
                  <span className="text-xs font-bold text-brand-600 dark:text-brand-300 uppercase tracking-wider">5. Qualifying Examination Details</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {/* Qualifying Exam Name */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Exam Name *</label>
                    <input
                      type="text"
                      name="qualExamName"
                      value={formData.qualExamName}
                      onChange={handleFormChange}
                      placeholder="e.g. LL.B / Graduation"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Board / University */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">University / Board *</label>
                    <input
                      type="text"
                      name="qualUniversity"
                      value={formData.qualUniversity}
                      onChange={handleFormChange}
                      placeholder="e.g. MGSU Bikaner"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Type */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Type *</label>
                    <select
                      name="qualType"
                      value={formData.qualType}
                      onChange={handleFormChange}
                      className="classy-input"
                      required
                    >
                      <option value="Regular">Regular</option>
                      <option value="Private">Private</option>
                    </select>
                  </div>

                  {/* Passing Year */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Passing Year *</label>
                    <input
                      type="text"
                      name="qualYear"
                      value={formData.qualYear}
                      onChange={handleFormChange}
                      placeholder="e.g. 2025"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Max Marks */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Max Marks *</label>
                    <input
                      type="number"
                      name="qualMaxMarks"
                      value={formData.qualMaxMarks}
                      onChange={handleFormChange}
                      placeholder="Max Marks"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Obtained Marks */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Obtained Marks *</label>
                    <input
                      type="number"
                      name="qualObtainedMarks"
                      value={formData.qualObtainedMarks}
                      onChange={handleFormChange}
                      placeholder="Obtained Marks"
                      className="classy-input"
                      required
                    />
                  </div>

                  {/* Percentage */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Percentage *</label>
                    <input
                      type="text"
                      name="qualPercentage"
                      value={formData.qualPercentage ? `${formData.qualPercentage}%` : ''}
                      className="classy-input bg-warm-100/50 dark:bg-darkbg-base/50 text-warm-600 dark:text-slate-400 font-bold"
                      disabled
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-3.5 border-t border-warm-200/40 dark:border-darkbg-border pt-6 mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="classy-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="classy-btn-primary py-3 px-6 shadow-sm"
                >
                  {isEditing ? 'Save Changes' : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* BATCH PROMOTION POPUP MODAL */}
      {showBulkPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col space-y-5">
            
            <div className="flex justify-between items-center border-b border-warm-100 dark:border-darkbg-border pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-warm-900 dark:text-white">
                Batch Promote Selected Students
              </h3>
              <button 
                onClick={() => setShowBulkPromoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-border"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBulkPromoteSubmit} className="space-y-4">
              <div className="text-xs text-warm-800/60 dark:text-slate-400 font-bold mb-2">
                You are promoting <span className="text-indigo-650 font-black">{selectedIds.length}</span> selected student profiles.
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Academic Year *</label>
                <select
                  value={bulkPromoteForm.academicYear}
                  onChange={(e) => setBulkPromoteForm(prev => ({ ...prev, academicYear: e.target.value }))}
                  className="classy-input"
                  required
                >
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="5th Year">5th Year</option>
                </select>
              </div>

              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Target Semester *</label>
                <select
                  value={bulkPromoteForm.semester}
                  onChange={(e) => setBulkPromoteForm(prev => ({ ...prev, semester: e.target.value }))}
                  className="classy-input"
                  required
                >
                  <option value="Annual">Annual</option>
                  <option value="1st Sem">1st Sem</option>
                  <option value="2nd Sem">2nd Sem</option>
                  <option value="3rd Sem">3rd Sem</option>
                  <option value="4th Sem">4th Sem</option>
                  <option value="5th Sem">5th Sem</option>
                  <option value="6th Sem">6th Sem</option>
                  <option value="7th Sem">7th Sem</option>
                  <option value="8th Sem">8th Sem</option>
                  <option value="9th Sem">9th Sem</option>
                  <option value="10th Sem">10th Sem</option>
                </select>
              </div>

              <div className="flex justify-end items-center space-x-3 pt-3 border-t border-warm-100 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setShowBulkPromoteModal(false)}
                  className="px-4 py-2 bg-warm-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-warm-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingBulkPromotion}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 transition-colors shadow-lg shadow-indigo-500/20"
                >
                  {submittingBulkPromotion ? 'Promoting...' : 'Promote Group'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Registration;
