import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import Toast from '../components/Toast';
import { 
  Award, Search, Filter, Plus, Printer, Trash2, 
  CheckCircle2, XCircle, AlertCircle, RefreshCw, 
  GraduationCap, BookOpen, FileText, Sparkles, X, ChevronRight, Download
} from 'lucide-react';
import SearchableStudentSelect from '../components/SearchableStudentSelect';

const Results = () => {
  const { activeSession, sessions } = useSession();
  
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState({
    totalDeclared: 0,
    passed: 0,
    failed: 0,
    supplementary: 0,
    firstDivision: 0,
    passPercentage: 0
  });

  const [courses, setCourses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('all');
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Modal States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedMarksheet, setSelectedMarksheet] = useState(null);
  const [toast, setToast] = useState(null);

  // Mode: 'quick' | 'subject'
  const [entryMode, setEntryMode] = useState('quick');

  // Batch Marks Entry State
  const [batchSession, setBatchSession] = useState(activeSession || '2025-26');
  const [batchCourse, setBatchCourse] = useState('LLB');
  const [batchYear, setBatchYear] = useState('1st Year');
  const [batchSemester, setBatchSemester] = useState('Annual');
  const [batchExamType, setBatchExamType] = useState('Main Annual Exam');
  const [batchExamMonth, setBatchExamMonth] = useState('May 2026');
  const [batchStudents, setBatchStudents] = useState([]);
  const [batchLoading, setBatchLoading] = useState(false);

  // New Marksheet Form State
  const [formData, setFormData] = useState({
    studentId: '',
    registrationId: '',
    rollNo: '',
    studentName: '',
    fatherName: '',
    course: 'LLB',
    academicSession: '2025-26',
    year: '1st Year',
    semester: 'Annual',
    examType: 'Main Annual Exam',
    examMonthYear: 'May 2026',
    totalMaxMarks: 500,
    totalObtainedMarks: 350,
    remarks: '',
    subjects: [
      { code: 'LLB-101', name: 'Jurisprudence (Legal Theory)', maxMarks: 100, minMarks: 36, theoryMarks: 65, practicalMarks: 0 },
      { code: 'LLB-102', name: 'Law of Contract - I', maxMarks: 100, minMarks: 36, theoryMarks: 70, practicalMarks: 0 },
      { code: 'LLB-103', name: 'Constitutional Law of India - I', maxMarks: 100, minMarks: 36, theoryMarks: 62, practicalMarks: 0 },
      { code: 'LLB-104', name: 'Law of Torts & Consumer Protection', maxMarks: 100, minMarks: 36, theoryMarks: 58, practicalMarks: 0 },
      { code: 'LLB-105', name: 'Family Law - I (Hindu Law)', maxMarks: 100, minMarks: 36, theoryMarks: 66, practicalMarks: 0 }
    ]
  });

  // Fetch Courses & Students for entry dropdown
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const token = localStorage.getItem('token');
        const [courseRes, studentRes] = await Promise.all([
          fetch('/api/courses', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/students?limit=100', { headers: { Authorization: `Bearer ${token}` } })
        ]);
        if (courseRes.ok) {
          const cData = await courseRes.json();
          setCourses(cData);
        }
        if (studentRes.ok) {
          const sData = await studentRes.json();
          setStudents(sData.students || []);
        }
      } catch (e) {
        console.error(e);
      }
    };
    fetchMetadata();
  }, []);

  // Fetch Results List & Stats
  const fetchResults = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (activeSession && activeSession !== 'All Sessions') params.append('session', activeSession);
      if (selectedCourse !== 'all') params.append('course', selectedCourse);
      if (selectedYear !== 'all') params.append('year', selectedYear);
      if (selectedStatus !== 'all') params.append('resultStatus', selectedStatus);
      if (search) params.append('search', search);

      const res = await fetch(`/api/results?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
        if (data.stats) setStats(data.stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [activeSession, selectedCourse, selectedYear, selectedStatus, search]);

  // When course changes in Modal form, load relevant subjects template
  const handleCourseChangeInForm = async (courseCode) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/results/template/subjects?course=${courseCode}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const template = await res.json();
        setFormData(prev => ({
          ...prev,
          course: courseCode,
          subjects: template.map(t => ({ ...t, theoryMarks: 60, practicalMarks: 0 }))
        }));
      } else {
        setFormData(prev => ({ ...prev, course: courseCode }));
      }
    } catch (e) {
      setFormData(prev => ({ ...prev, course: courseCode }));
    }
  };

  // When selecting a registered student in Modal
  const handleSelectStudentInForm = (studentId) => {
    const st = students.find(s => (s._id || s.id) === studentId);
    if (st) {
      setFormData(prev => ({
        ...prev,
        studentId: st._id || st.id,
        registrationId: st.registrationId || '',
        studentName: st.fullName || '',
        fatherName: st.fatherName || '',
        course: st.courseApplied || prev.course,
        academicSession: st.academicSession || activeSession,
        rollNo: prev.rollNo || String(Math.floor(10000 + Math.random() * 90000))
      }));
      handleCourseChangeInForm(st.courseApplied || 'LLB');
    }
  };

  // Update a single subject marks in form
  const handleSubjectMarkChange = (index, field, value) => {
    const updated = [...formData.subjects];
    updated[index][field] = Number(value) || 0;
    setFormData(prev => ({ ...prev, subjects: updated }));
  };

  // Add new blank subject row in form
  const handleAddSubjectRow = () => {
    setFormData(prev => ({
      ...prev,
      subjects: [
        ...prev.subjects,
        { code: `SUB-0${prev.subjects.length + 1}`, name: 'New Subject / Paper', maxMarks: 100, minMarks: 36, theoryMarks: 50, practicalMarks: 0 }
      ]
    }));
  };

  // Remove subject row
  const handleRemoveSubjectRow = (index) => {
    if (formData.subjects.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter((_, i) => i !== index)
    }));
  };

  // Save new result
  const handleSubmitNewResult = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          entryMode,
          academicSession: formData.academicSession || activeSession
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: 'Marksheet declared & saved successfully!' });
        setShowAddModal(false);
        fetchResults();
      } else {
        setToast({ type: 'error', message: data.message || 'Error saving result' });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Server communication error' });
    }
  };

  // Load Students for Batch Entry
  const handleLoadBatchStudents = async () => {
    setBatchLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/results/class-students?session=${batchSession}&course=${batchCourse}&year=${batchYear}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        const studentRows = data.map((st, index) => {
          const prev = st.existingResult || {};
          return {
            studentId: st._id || st.id,
            registrationId: st.registrationId,
            rollNo: prev.rollNo || String(10100 + index + 1),
            studentName: st.fullName,
            fatherName: st.fatherName || '',
            totalMaxMarks: prev.totalMaxMarks || 500,
            totalObtainedMarks: prev.totalObtainedMarks || 350,
            resultStatus: prev.resultStatus || 'Pass',
            division: prev.division || 'First Division'
          };
        });
        setBatchStudents(studentRows);
        if (studentRows.length === 0) {
          setToast({ type: 'info', message: 'No registered students found matching this class filter.' });
        }
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to load class students' });
    } finally {
      setBatchLoading(false);
    }
  };

  // Update a student's marks in batch table
  const handleBatchMarkChange = (index, field, value) => {
    const updated = [...batchStudents];
    updated[index][field] = value;
    
    // Auto calculate row % and division
    const max = Number(updated[index].totalMaxMarks) || 500;
    const obt = Number(updated[index].totalObtainedMarks) || 0;
    const pct = max > 0 ? (obt / max) * 100 : 0;
    
    if (pct < 36) {
      updated[index].resultStatus = 'Fail';
      updated[index].division = 'Fail';
    } else if (pct >= 60) {
      updated[index].resultStatus = 'Pass';
      updated[index].division = 'First Division';
    } else if (pct >= 48) {
      updated[index].resultStatus = 'Pass';
      updated[index].division = 'Second Division';
    } else {
      updated[index].resultStatus = 'Pass';
      updated[index].division = 'Pass Class';
    }

    setBatchStudents(updated);
  };

  // Submit all class batch marks
  const handleSaveBatchMarks = async (e) => {
    e.preventDefault();
    if (batchStudents.length === 0) {
      setToast({ type: 'warning', message: 'No students loaded to save marks' });
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/results/batch-save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          session: batchSession,
          course: batchCourse,
          year: batchYear,
          semester: batchSemester,
          examType: batchExamType,
          examMonthYear: batchExamMonth,
          records: batchStudents
        })
      });

      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        setShowBatchModal(false);
        fetchResults();
      } else {
        setToast({ type: 'error', message: data.message || 'Error saving batch results' });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Server communication error' });
    }
  };

  // Delete Result
  const handleDeleteResult = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete result for ${name}?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/results/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Result record deleted successfully' });
        fetchResults();
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Error deleting result' });
    }
  };

  // Seed sample results if database is empty
  const handleSeedDemoResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/results/seed-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ type: 'success', message: data.message });
        fetchResults();
      } else {
        setToast({ type: 'info', message: data.message });
      }
    } catch (e) {
      setToast({ type: 'error', message: 'Failed to populate sample results' });
    }
  };

  return (
    <div className="space-y-8 pb-12">
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Top Header Banner */}
      <div className="classy-card p-6 bg-gradient-to-r from-warm-100/90 via-warm-50 to-amber-50/70 dark:from-darkbg-surface dark:via-darkbg-surface/80 dark:to-darkbg-surface border border-warm-200/50 dark:border-darkbg-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-2xl">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest leading-none">Examination & Marks Desk</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-500 text-white">
                Session {activeSession}
              </span>
            </div>
            <h2 className="text-xl font-serif font-bold text-warm-900 dark:text-slate-100 mt-1">
              Annual Examination & Marksheet Console
            </h2>
            <p className="text-xs text-warm-855 dark:text-slate-400 mt-0.5">
              Publish official college marksheets, review division rankings, and print university-format grade cards.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {results.length === 0 && (
            <button
              onClick={handleSeedDemoResults}
              className="px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface hover:bg-warm-100/50 text-warm-900 dark:text-slate-200 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Generate Demo Results</span>
            </button>
          )}

          <button
            onClick={() => {
              setBatchSession(activeSession || '2025-26');
              setShowBatchModal(true);
            }}
            className="px-4 py-2.5 rounded-xl border border-brand-500/40 bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-300 text-xs font-bold flex items-center space-x-2 transition-all shadow-sm active:scale-95"
          >
            <BookOpen className="w-4 h-4" />
            <span>Class Batch Entry</span>
          </button>

          <button
            onClick={() => {
              setFormData(prev => ({
                ...prev,
                academicSession: activeSession || '2025-26',
                rollNo: String(Math.floor(10000 + Math.random() * 90000))
              }));
              setShowAddModal(true);
            }}
            className="px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold flex items-center space-x-2 transition-all shadow-md shadow-brand-500/20 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>+ Enter Marksheet</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="classy-card p-5 flex items-center space-x-4 border-l-4 border-l-brand-500">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-xl">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-warm-800/60 dark:text-slate-400 block tracking-wider">Total Declared</span>
            <span className="text-xl font-bold text-warm-900 dark:text-slate-100">{stats.totalDeclared}</span>
          </div>
        </div>

        <div className="classy-card p-5 flex items-center space-x-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-warm-800/60 dark:text-slate-400 block tracking-wider">Passed Count</span>
            <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{stats.passed}</span>
          </div>
        </div>

        <div className="classy-card p-5 flex items-center space-x-4 border-l-4 border-l-purple-500">
          <div className="p-3 bg-purple-500/10 text-purple-600 rounded-xl">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-warm-800/60 dark:text-slate-400 block tracking-wider">1st Division</span>
            <span className="text-xl font-bold text-purple-600 dark:text-purple-400">{stats.firstDivision}</span>
          </div>
        </div>

        <div className="classy-card p-5 flex items-center space-x-4 border-l-4 border-l-amber-500">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-xl">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-warm-800/60 dark:text-slate-400 block tracking-wider">Supplementary</span>
            <span className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.supplementary}</span>
          </div>
        </div>

        <div className="classy-card p-5 flex items-center space-x-4 border-l-4 border-l-rose-500 col-span-2 md:col-span-1">
          <div className="p-3 bg-rose-500/10 text-rose-600 rounded-xl">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase text-warm-800/60 dark:text-slate-400 block tracking-wider">Pass Rate</span>
            <span className="text-xl font-bold text-rose-600 dark:text-rose-400">{stats.passPercentage}%</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="classy-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-warm-855 dark:text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Roll No, Reg ID or Student Name..."
            className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 focus:outline-none focus:border-brand-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Course filter */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Courses</option>
            {courses.map(c => (
              <option key={c.id || c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
            <option value="LLB">Bachelor of Laws (LL.B)</option>
            <option value="BALLB">B.A. LL.B (5 Year Integrated)</option>
          </select>

          {/* Year filter */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Years</option>
            <option value="1st Year">1st Year</option>
            <option value="2nd Year">2nd Year</option>
            <option value="3rd Year">3rd Year</option>
            <option value="Final Year">Final Year</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="Pass">Passed</option>
            <option value="Supplementary">Supplementary</option>
            <option value="Fail">Failed</option>
          </select>

          <button
            onClick={fetchResults}
            className="p-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-855 hover:text-brand-500 transition-colors"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Results Table */}
      <div className="classy-card overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-warm-855 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
            <span>Loading examination marksheet records...</span>
          </div>
        ) : results.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-brand-500/10 text-brand-500 mx-auto flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100">No Marksheets Found</h3>
            <p className="text-xs text-warm-855 dark:text-slate-400 max-w-md mx-auto">
              No exam results have been declared for the selected filters in Session <span className="font-bold text-brand-500">{activeSession}</span>. Click below to enter a marksheet or auto-generate sample results.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={handleSeedDemoResults}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
              >
                Generate Demo Results
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-sm"
              >
                + Enter Marksheet
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100/60 dark:bg-darkbg-base text-warm-900 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4">Roll No</th>
                  <th className="p-4">Reg ID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Course & Class</th>
                  <th className="p-4 text-center">Marks (Max / Obt)</th>
                  <th className="p-4 text-center">Percentage</th>
                  <th className="p-4">Division / Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                {results.map((r) => {
                  const id = r._id || r.id;
                  const isPass = r.resultStatus === 'Pass';
                  const isSupp = r.resultStatus === 'Supplementary';

                  return (
                    <tr key={id} className="hover:bg-warm-100/30 dark:hover:bg-darkbg-surface/50 transition-colors">
                      <td className="p-4 font-mono font-bold text-brand-600 dark:text-brand-400">
                        {r.rollNo}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-warm-855 dark:text-slate-400">
                        {r.registrationId}
                      </td>
                      <td className="p-4">
                        <span className="font-semibold text-warm-900 dark:text-slate-100 block">{r.studentName}</span>
                        {r.fatherName && (
                          <span className="text-[10px] text-warm-855 dark:text-slate-400 block">S/o {r.fatherName}</span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-warm-900 dark:text-slate-200 block">{r.course}</span>
                        <span className="text-[10px] text-warm-855 dark:text-slate-400 block">{r.year} ({r.academicSession})</span>
                      </td>
                      <td className="p-4 text-center font-mono">
                        <span className="font-bold text-warm-900 dark:text-slate-100">{r.totalObtainedMarks}</span>
                        <span className="text-slate-400"> / {r.totalMaxMarks}</span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-bold text-warm-900 dark:text-slate-100">{r.percentage}%</span>
                          <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${isPass ? 'bg-emerald-500' : isSupp ? 'bg-amber-500' : 'bg-rose-500'}`}
                              style={{ width: `${Math.min(r.percentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold block w-max ${
                          isPass 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' 
                            : isSupp 
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400' 
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400'
                        }`}>
                          {r.resultStatus} • {r.division}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => setSelectedMarksheet(r)}
                            className="px-3 py-1.5 rounded-lg border border-brand-500/30 bg-brand-500/10 hover:bg-brand-500 text-brand-600 dark:text-brand-400 hover:text-white transition-all text-xs font-bold flex items-center space-x-1.5"
                            title="View & Print Official Marksheet"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Marksheet</span>
                          </button>
                          <button
                            onClick={() => handleDeleteResult(id, r.studentName)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── MODAL: ENTER NEW MARKSHEET ─── */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-darkbg-surface w-full max-w-3xl rounded-2xl shadow-2xl border border-warm-200 dark:border-darkbg-border overflow-hidden my-8">
            <div className="p-6 bg-gradient-to-r from-warm-100 to-warm-50 dark:from-darkbg-base dark:to-darkbg-surface border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-500 text-white rounded-xl">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-warm-900 dark:text-slate-100">Enter Student Examination Marksheet</h3>
                  <p className="text-xs text-warm-855 dark:text-slate-400">Add subject-wise scorecards and compute division grades.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-warm-900 dark:hover:text-slate-100 hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewResult} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
              {/* Mode Selector Toggle: Quick Total vs Subject Wise */}
              <div className="flex items-center justify-between bg-warm-100/70 dark:bg-darkbg-base p-1.5 rounded-xl border border-warm-200 dark:border-darkbg-border">
                <span className="text-xs font-bold text-warm-900 dark:text-slate-200 px-2">Marks Entry Mode:</span>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEntryMode('quick')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      entryMode === 'quick'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-warm-855 dark:text-slate-400 hover:text-warm-900'
                    }`}
                  >
                    ⚡ Quick Total Marks
                  </button>
                  <button
                    type="button"
                    onClick={() => setEntryMode('subject')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      entryMode === 'subject'
                        ? 'bg-brand-500 text-white shadow-sm'
                        : 'text-warm-855 dark:text-slate-400 hover:text-warm-900'
                    }`}
                  >
                    📋 Subject-Wise Matrix
                  </button>
                </div>
              </div>

              {/* Modern Searchable Registered Student Selector */}
              <div className="bg-brand-500/5 border border-brand-500/20 p-4 rounded-xl">
                <SearchableStudentSelect
                  students={students}
                  value={formData.studentId}
                  onChange={handleSelectStudentInForm}
                  label="Select Registered Student (Auto-fills Profile Details)"
                  placeholder="-- Search Student by Name, Reg ID, Mobile or Course --"
                />
              </div>

              {/* Student Metadata Form Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">Roll Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.rollNo}
                    onChange={(e) => setFormData({ ...formData, rollNo: e.target.value })}
                    placeholder="e.g. 10425"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">Student Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.studentName}
                    onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                    placeholder="Student Name"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={formData.fatherName}
                    onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                    placeholder="Father's Name"
                    className="w-full text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">Course / Programme *</label>
                  <select
                    value={formData.course}
                    onChange={(e) => handleCourseChangeInForm(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 font-bold"
                  >
                    <option value="LLB">Bachelor of Laws (LL.B)</option>
                    <option value="BALLB">B.A. LL.B (5 Year)</option>
                    <option value="BCA">BCA</option>
                    <option value="BBA">BBA</option>
                    <option value="BSC_CS">B.Sc. CS</option>
                    <option value="BCOM">B.Com</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">Academic Session *</label>
                  <select
                    value={formData.academicSession}
                    onChange={(e) => setFormData({ ...formData, academicSession: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 font-bold"
                  >
                    {sessions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">Academic Year / Sem</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100"
                  >
                    <option value="1st Year">1st Year / 1st Sem</option>
                    <option value="2nd Year">2nd Year / 3rd Sem</option>
                    <option value="3rd Year">3rd Year / 5th Sem</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>
              </div>

              {/* MODE 1: QUICK TOTAL MARKS ENTRY */}
              {entryMode === 'quick' ? (
                <div className="bg-warm-50 dark:bg-darkbg-base p-5 rounded-2xl border border-warm-200/70 dark:border-darkbg-border space-y-4">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-brand-500" />
                    <h4 className="text-xs font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">
                      Quick Aggregate Marks Entry
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">
                        Total Maximum Marks *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.totalMaxMarks}
                        onChange={(e) => setFormData({ ...formData, totalMaxMarks: Number(e.target.value) || 0 })}
                        className="w-full text-sm font-mono font-bold px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1">
                        Total Obtained Marks *
                      </label>
                      <input
                        type="number"
                        required
                        value={formData.totalObtainedMarks}
                        onChange={(e) => setFormData({ ...formData, totalObtainedMarks: Number(e.target.value) || 0 })}
                        className="w-full text-sm font-mono font-bold px-3.5 py-2.5 rounded-xl border border-brand-500 bg-white dark:bg-darkbg-surface text-brand-600 dark:text-brand-400"
                      />
                    </div>
                  </div>

                  {/* Auto-Calculation Preview Pill */}
                  {formData.totalMaxMarks > 0 && (
                    <div className="p-3 bg-white dark:bg-darkbg-surface rounded-xl border border-warm-200 dark:border-darkbg-border flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-bold">Auto Percentage:</span>
                        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">
                          {((formData.totalObtainedMarks / formData.totalMaxMarks) * 100).toFixed(2)}%
                        </span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <span className="text-slate-400 font-bold">Division:</span>
                        <span className="font-bold text-slate-800 dark:text-slate-200">
                          {((formData.totalObtainedMarks / formData.totalMaxMarks) * 100) >= 60 
                            ? 'First Division' 
                            : ((formData.totalObtainedMarks / formData.totalMaxMarks) * 100) >= 48 
                              ? 'Second Division' 
                              : 'Pass Class'}
                        </span>
                      </div>

                      <div>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold ${
                          ((formData.totalObtainedMarks / formData.totalMaxMarks) * 100) >= 36 
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400' 
                            : 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-400'
                        }`}>
                          {((formData.totalObtainedMarks / formData.totalMaxMarks) * 100) >= 36 ? 'Status: PASS' : 'Status: FAIL'}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* MODE 2: SUBJECT-WISE MARKS TABLE */
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">
                      Subject Marks Breakdown
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddSubjectRow}
                      className="text-xs font-bold text-brand-500 hover:text-brand-600 flex items-center space-x-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Subject Paper</span>
                    </button>
                  </div>

                  <div className="border border-warm-200 dark:border-darkbg-border rounded-xl overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-warm-100/60 dark:bg-darkbg-base text-warm-900 dark:text-slate-300 font-bold">
                        <tr>
                          <th className="p-3 w-28">Paper Code</th>
                          <th className="p-3">Paper / Subject Name</th>
                          <th className="p-3 w-20 text-center">Max Marks</th>
                          <th className="p-3 w-20 text-center">Min Pass</th>
                          <th className="p-3 w-24 text-center">Theory Obt</th>
                          <th className="p-3 w-20 text-center">Pass/Fail</th>
                          <th className="p-3 w-10 text-center"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                        {formData.subjects.map((sub, idx) => {
                          const total = (Number(sub.theoryMarks) || 0) + (Number(sub.practicalMarks) || 0);
                          const isPass = total >= (Number(sub.minMarks) || 36);

                          return (
                            <tr key={idx} className="bg-white dark:bg-darkbg-surface">
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={sub.code}
                                  onChange={(e) => {
                                    const updated = [...formData.subjects];
                                    updated[idx].code = e.target.value;
                                    setFormData({ ...formData, subjects: updated });
                                  }}
                                  className="w-full px-2 py-1 rounded-lg border border-warm-200 dark:border-darkbg-border font-mono text-xs"
                                />
                              </td>
                              <td className="p-2.5">
                                <input
                                  type="text"
                                  value={sub.name}
                                  onChange={(e) => {
                                    const updated = [...formData.subjects];
                                    updated[idx].name = e.target.value;
                                    setFormData({ ...formData, subjects: updated });
                                  }}
                                  className="w-full px-2 py-1 rounded-lg border border-warm-200 dark:border-darkbg-border text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  value={sub.maxMarks}
                                  onChange={(e) => handleSubjectMarkChange(idx, 'maxMarks', e.target.value)}
                                  className="w-16 px-2 py-1 rounded-lg border border-warm-200 dark:border-darkbg-border text-center font-mono text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  value={sub.minMarks}
                                  onChange={(e) => handleSubjectMarkChange(idx, 'minMarks', e.target.value)}
                                  className="w-16 px-2 py-1 rounded-lg border border-warm-200 dark:border-darkbg-border text-center font-mono text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <input
                                  type="number"
                                  value={sub.theoryMarks}
                                  onChange={(e) => handleSubjectMarkChange(idx, 'theoryMarks', e.target.value)}
                                  className="w-20 px-2 py-1 rounded-lg border border-brand-500 font-bold text-brand-600 dark:text-brand-400 text-center font-mono text-xs"
                                />
                              </td>
                              <td className="p-2.5 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                  {isPass ? 'Pass' : 'Fail'}
                                </span>
                              </td>
                              <td className="p-2.5 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveSubjectRow(idx)}
                                  className="text-slate-400 hover:text-rose-500 p-1"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Modal Action Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-200/50 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border text-xs font-bold text-warm-855 hover:bg-warm-100/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95"
                >
                  Save & Publish Marksheet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: CLASS-WISE BATCH MARKS ENTRY ─── */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-darkbg-surface w-full max-w-4xl rounded-2xl shadow-2xl border border-warm-200 dark:border-darkbg-border overflow-hidden my-6">
            <div className="p-6 bg-gradient-to-r from-warm-100 to-warm-50 dark:from-darkbg-base dark:to-darkbg-surface border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-brand-500 text-white rounded-xl">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-warm-900 dark:text-slate-100">Class-Wise Batch Marks Entry</h3>
                  <p className="text-xs text-warm-855 dark:text-slate-400">Select session and semester, load enrolled class list, and enter marks in bulk.</p>
                </div>
              </div>
              <button 
                onClick={() => setShowBatchModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-warm-900 dark:hover:text-slate-100 hover:bg-white/50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveBatchMarks} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
              
              {/* Filter Row: Session, Course, Year/Sem */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-warm-50 dark:bg-darkbg-base p-4 rounded-xl border border-warm-200 dark:border-darkbg-border">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Session</label>
                  <select
                    value={batchSession}
                    onChange={(e) => setBatchSession(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-bold"
                  >
                    {sessions.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Course</label>
                  <select
                    value={batchCourse}
                    onChange={(e) => setBatchCourse(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100 font-bold"
                  >
                    <option value="LLB">Bachelor of Laws (LL.B)</option>
                    <option value="BALLB">B.A. LL.B (5 Year)</option>
                    <option value="BA-LLB">BA-LLB</option>
                    <option value="BCA">BCA</option>
                    <option value="BBA">BBA</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Year / Semester</label>
                  <select
                    value={batchYear}
                    onChange={(e) => setBatchYear(e.target.value)}
                    className="w-full text-xs px-2.5 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-900 dark:text-slate-100"
                  >
                    <option value="1st Year">1st Year / 1st Sem</option>
                    <option value="2nd Year">2nd Year / 3rd Sem</option>
                    <option value="3rd Year">3rd Year / 5th Sem</option>
                    <option value="Final Year">Final Year</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleLoadBatchStudents}
                    disabled={batchLoading}
                    className="w-full py-2 bg-brand-500 hover:bg-brand-600 text-white rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${batchLoading ? 'animate-spin' : ''}`} />
                    <span>Load Class Roster</span>
                  </button>
                </div>
              </div>

              {/* Class Students Table */}
              {batchStudents.length > 0 ? (
                <div className="border border-warm-200 dark:border-darkbg-border rounded-xl overflow-hidden">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-warm-100/60 dark:bg-darkbg-base text-warm-900 dark:text-slate-300 font-bold">
                      <tr>
                        <th className="p-3 w-16">#</th>
                        <th className="p-3 w-28">Roll No</th>
                        <th className="p-3">Student Name</th>
                        <th className="p-3 w-24 text-center">Max Marks</th>
                        <th className="p-3 w-28 text-center">Obtained Marks</th>
                        <th className="p-3 w-20 text-center">Percentage</th>
                        <th className="p-3 w-28 text-center">Division</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                      {batchStudents.map((st, idx) => {
                        const pct = st.totalMaxMarks > 0 ? ((st.totalObtainedMarks / st.totalMaxMarks) * 100).toFixed(1) : 0;
                        const isPass = Number(pct) >= 36;

                        return (
                          <tr key={st.studentId || idx} className="bg-white dark:bg-darkbg-surface hover:bg-warm-50/50">
                            <td className="p-3 font-mono text-slate-400">{idx + 1}</td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                required
                                value={st.rollNo}
                                onChange={(e) => handleBatchMarkChange(idx, 'rollNo', e.target.value)}
                                className="w-full px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border font-mono font-bold text-xs"
                              />
                            </td>
                            <td className="p-3 font-semibold text-warm-900 dark:text-slate-100">
                              <div>{st.studentName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{st.registrationId}</div>
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                required
                                value={st.totalMaxMarks}
                                onChange={(e) => handleBatchMarkChange(idx, 'totalMaxMarks', e.target.value)}
                                className="w-20 px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border font-mono text-center text-xs"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <input
                                type="number"
                                required
                                value={st.totalObtainedMarks}
                                onChange={(e) => handleBatchMarkChange(idx, 'totalObtainedMarks', e.target.value)}
                                className="w-24 px-2 py-1.5 rounded-lg border border-brand-500 font-bold text-brand-600 dark:text-brand-400 font-mono text-center text-xs"
                              />
                            </td>
                            <td className="p-3 text-center font-bold">
                              <span className={isPass ? 'text-emerald-600' : 'text-rose-600'}>
                                {pct}%
                              </span>
                            </td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {st.division}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-12 text-center text-xs text-slate-400 italic bg-warm-50 dark:bg-darkbg-base rounded-xl border border-dashed border-warm-200">
                  Select Session, Course, and Year above, then click "Load Class Roster" to display enrolled students for quick batch mark entry.
                </div>
              )}

              {/* Modal Footer */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-200/50 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border text-xs font-bold text-warm-855 hover:bg-warm-100/50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchStudents.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95"
                >
                  Save All Class Results ({batchStudents.length})
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: OFFICIAL PRINTABLE MARKSHEET / GRADE CARD ─── */}
      {selectedMarksheet && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedMarksheet(null);
          }}
        >
          <div className="bg-white dark:bg-darkbg-surface w-full max-w-4xl rounded-2xl shadow-2xl border border-warm-200 dark:border-darkbg-border overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
            
            {/* Top Action Bar (Always visible on screen, hidden on print) */}
            <div className="p-4 bg-warm-100/80 dark:bg-darkbg-base border-b border-warm-200/60 dark:border-darkbg-border flex items-center justify-between no-print sticky top-0 z-10">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-brand-500 text-white rounded-xl shadow-sm">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-warm-900 dark:text-slate-100">
                    Official College Marksheet & Grade Card
                  </h3>
                  <p className="text-[10px] text-warm-800/60 dark:text-slate-400">
                    Roll No: {selectedMarksheet.rollNo} • {selectedMarksheet.studentName}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center space-x-2 shadow-md hover:shadow-lg transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Marksheet (A4)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMarksheet(null)}
                  className="px-3.5 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-warm-855 dark:text-slate-200 hover:bg-warm-100/50 text-xs font-bold flex items-center space-x-1.5 transition-colors"
                >
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </button>
              </div>
            </div>

            {/* Printable Marksheet Container */}
            <div id="printable-marksheet-card" className="p-8 bg-white text-slate-900 printable-marksheet font-serif space-y-6">
              
              {/* College Header */}
              <div className="text-center border-b-2 border-brand-500 pb-4">
                <div className="w-14 h-14 rounded-full bg-brand-600 text-white mx-auto flex items-center justify-center font-bold text-xl shadow-md mb-2">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold tracking-tight uppercase text-brand-600">
                  B.J.S. Rampuria Jain Law College
                </h1>
                <p className="text-xs font-sans text-slate-600 uppercase tracking-widest font-semibold mt-0.5">
                  Affiliated to Dr. Bhimrao Ambedkar Law University, Jaipur (Raj.)
                </p>
                <p className="text-[11px] font-sans text-slate-500">
                  Sector-5, J.N.V. Colony, Bikaner - 334001 | Phone: 0151-2230132
                </p>
                <div className="inline-block mt-3 px-6 py-1 bg-brand-500/10 border border-brand-500/30 rounded-full">
                  <span className="text-xs font-bold font-sans text-brand-600 uppercase tracking-wider">
                    STATEMENT OF MARKS / GRADE CARD • {selectedMarksheet.examMonthYear || 'MAY 2026'}
                  </span>
                </div>
              </div>

              {/* Student Info Card */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-3 gap-x-6 text-xs font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Student Name:</span>
                  <span className="font-bold text-slate-900 text-sm">{selectedMarksheet.studentName}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Father's Name:</span>
                  <span className="font-bold text-slate-900">{selectedMarksheet.fatherName || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">University Roll No:</span>
                  <span className="font-mono font-bold text-brand-600 text-sm">{selectedMarksheet.rollNo}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">College Reg ID:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedMarksheet.registrationId}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Course & Year:</span>
                  <span className="font-bold text-slate-900">{selectedMarksheet.course} - {selectedMarksheet.year}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold uppercase block">Academic Session:</span>
                  <span className="font-bold text-brand-600">{selectedMarksheet.academicSession}</span>
                </div>
              </div>

              {/* Marks Table */}
              <div className="border border-slate-300 rounded-lg overflow-hidden font-sans">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-800 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-3 w-28">Paper Code</th>
                      <th className="p-3">Paper Title / Subject</th>
                      <th className="p-3 text-center w-24">Max Marks</th>
                      <th className="p-3 text-center w-24">Min Pass</th>
                      <th className="p-3 text-center w-28">Marks Obtained</th>
                      <th className="p-3 text-center w-20">Result</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(selectedMarksheet.subjects || []).map((sub, i) => (
                      <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                        <td className="p-3 font-mono font-bold text-slate-700">{sub.code}</td>
                        <td className="p-3 font-medium text-slate-800">{sub.name}</td>
                        <td className="p-3 text-center font-mono">{sub.maxMarks}</td>
                        <td className="p-3 text-center font-mono">{sub.minMarks}</td>
                        <td className="p-3 text-center font-mono font-bold text-slate-900">{sub.totalMarks || sub.obtainedMarks || (Number(sub.theoryMarks || 0) + Number(sub.practicalMarks || 0))}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            (sub.status === 'Pass' || Number(sub.obtainedMarks || sub.totalMarks || 0) >= 36) ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {sub.status || (Number(sub.obtainedMarks || sub.totalMarks || 0) >= 36 ? 'Pass' : 'Fail')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-100 font-bold border-t-2 border-slate-300">
                    <tr>
                      <td colSpan="2" className="p-3 text-right uppercase tracking-wider text-slate-700">Grand Total:</td>
                      <td className="p-3 text-center font-mono">{selectedMarksheet.totalMaxMarks}</td>
                      <td className="p-3 text-center">--</td>
                      <td className="p-3 text-center font-mono text-brand-600 text-sm">{selectedMarksheet.totalObtainedMarks}</td>
                      <td className="p-3 text-center">
                        <span className="text-emerald-700 font-bold">{selectedMarksheet.resultStatus}</span>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Result Summary & Division Block */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-sans bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="text-center p-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Percentage:</span>
                  <span className="text-lg font-bold text-brand-600">{selectedMarksheet.percentage}%</span>
                </div>
                <div className="text-center p-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Final Result:</span>
                  <span className="text-lg font-bold text-emerald-600">{selectedMarksheet.resultStatus}</span>
                </div>
                <div className="text-center p-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Division Awarded:</span>
                  <span className="text-sm font-bold text-slate-800">{selectedMarksheet.division}</span>
                </div>
                <div className="text-center p-2">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Declaration Date:</span>
                  <span className="text-sm font-bold text-slate-800">{selectedMarksheet.declaredDate || new Date().toLocaleDateString('en-GB')}</span>
                </div>
              </div>

              {/* Signatures & Seal Box */}
              <div className="pt-12 grid grid-cols-3 gap-8 text-center text-xs font-sans border-t border-slate-200 mt-8">
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2"></div>
                  <span className="font-bold text-slate-700 block">Checked By (Verifier)</span>
                  <span className="text-[10px] text-slate-400">Exam Cell Assistant</span>
                </div>
                <div>
                  <div className="w-16 h-16 border border-slate-300 rounded-full mx-auto flex items-center justify-center text-[9px] text-slate-400 uppercase tracking-tighter">
                    COLLEGE SEAL
                  </div>
                </div>
                <div>
                  <div className="h-10 border-b border-dashed border-slate-400 mx-6 mb-2"></div>
                  <span className="font-bold text-slate-900 block">Principal / Dean</span>
                  <span className="text-[10px] text-slate-500">B.J.S. Rampuria Jain Law College</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Results;
