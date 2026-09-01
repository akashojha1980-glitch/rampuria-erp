import React, { useState, useEffect } from 'react';
import { useSession } from '../context/SessionContext';
import Toast from '../components/Toast';
import { 
  GraduationCap, ArrowRight, CheckSquare, Square, RefreshCw, 
  Search, Filter, ShieldCheck, Users, Calendar, Sparkles
} from 'lucide-react';

const Promotion = () => {
  const { activeSession, sessions } = useSession();
  
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [loading, setLoading] = useState(false);

  // Promotion Target Form State
  const [targetSession, setTargetSession] = useState('2026-27');
  const [targetYear, setTargetYear] = useState('2nd Year');
  const [targetCourse, setTargetCourse] = useState('');
  const [promoting, setPromoting] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  // Fetch Courses list
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/courses', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setCourses(data);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  // Fetch Students for current session
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      let url = `/api/students?session=${activeSession}&limit=100`;
      if (selectedCourse) {
        url += `&course=${selectedCourse}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data.students || []);
        setSelectedStudentIds([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [activeSession, selectedCourse]);

  // Handle Select All Checkbox
  const handleSelectAll = () => {
    if (selectedStudentIds.length === students.length) {
      setSelectedStudentIds([]);
    } else {
      setSelectedStudentIds(students.map(s => s._id || s.id));
    }
  };

  // Toggle single student selection
  const toggleSelectStudent = (id) => {
    if (selectedStudentIds.includes(id)) {
      setSelectedStudentIds(selectedStudentIds.filter(item => item !== id));
    } else {
      setSelectedStudentIds([...selectedStudentIds, id]);
    }
  };

  // 1-Click Bulk Promotion Action
  const handlePromote = async () => {
    if (selectedStudentIds.length === 0) {
      setToast({ type: 'warning', message: 'Please select at least one student to promote.' });
      return;
    }

    if (!targetSession) {
      setToast({ type: 'warning', message: 'Please select a target Academic Session.' });
      return;
    }

    setPromoting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/sessions/promote', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          studentIds: selectedStudentIds,
          targetSession,
          targetYear,
          targetCourse: targetCourse || undefined
        })
      });

      const data = await res.json();

      if (res.ok) {
        setToast({ 
          type: 'success', 
          message: data.message || `Successfully promoted ${selectedStudentIds.length} students to Session ${targetSession}!` 
        });
        // Refresh list
        fetchStudents();
      } else {
        setToast({ type: 'error', message: data.message || 'Promotion failed' });
      }
    } catch (err) {
      setToast({ type: 'error', message: 'Error performing student promotion' });
    } finally {
      setPromoting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {toast && (
        <Toast 
          type={toast.type} 
          message={toast.message} 
          onClose={() => setToast(null)} 
        />
      )}

      {/* Header Banner */}
      <div className="classy-card p-6 bg-gradient-to-r from-warm-100/80 via-warm-50 to-amber-50/60 dark:from-darkbg-surface dark:via-darkbg-surface/80 dark:to-darkbg-surface border border-warm-200/50 dark:border-darkbg-border flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-brand-500/10 text-brand-500 rounded-2xl">
            <GraduationCap className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-warm-900 dark:text-slate-100">
              1-Click Student Academic Promotion
            </h2>
            <p className="text-xs text-warm-855 dark:text-slate-400 mt-1">
              Bulk promote verified students from Session <span className="font-semibold text-brand-500">{activeSession}</span> to the upcoming academic year.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 bg-white/60 dark:bg-darkbg-base/60 px-4 py-2 rounded-xl border border-warm-200/50 dark:border-darkbg-border">
          <Calendar className="w-4 h-4 text-brand-500" />
          <span className="text-xs font-medium text-warm-900 dark:text-slate-200">Active Source Session:</span>
          <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-brand-500 text-white">
            {activeSession}
          </span>
        </div>
      </div>

      {/* Filter and Target Controls Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Filter Controls */}
        <div className="classy-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 flex items-center space-x-2">
            <Filter className="w-4 h-4 text-brand-500" />
            <span>Filter Source Students</span>
          </h3>

          <div>
            <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1.5">
              Course Filter
            </label>
            <select
              value={selectedCourse}
              onChange={(e) => setSelectedCourse(e.target.value)}
              className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="">All Courses</option>
              {courses.map(c => (
                <option key={c.id || c.code} value={c.code}>{c.name} ({c.code})</option>
              ))}
            </select>
          </div>

          <div className="pt-2 text-xs text-warm-855 dark:text-slate-400 border-t border-warm-100 dark:border-darkbg-border">
            Total Students Loaded: <span className="font-bold text-warm-900 dark:text-slate-200">{students.length}</span> | 
            Selected: <span className="font-bold text-brand-500">{selectedStudentIds.length}</span>
          </div>
        </div>

        {/* Right Column: Promotion Target Configuration */}
        <div className="lg:col-span-2 classy-card p-6 space-y-4 border-l-4 border-l-brand-500">
          <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>Target Session & Class Setup</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Target Session */}
            <div>
              <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1.5">
                Target Academic Session *
              </label>
              <select
                value={targetSession}
                onChange={(e) => setTargetSession(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/20"
              >
                {sessions.map(s => (
                  <option key={s} value={s}>Session {s}</option>
                ))}
                <option value="2026-27">Session 2026-27 (Upcoming)</option>
                <option value="2027-28">Session 2027-28</option>
              </select>
            </div>

            {/* Target Year */}
            <div>
              <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1.5">
                Target Academic Year
              </label>
              <select
                value={targetYear}
                onChange={(e) => setTargetYear(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 font-semibold focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="Graduated">Graduated / Alumni</option>
              </select>
            </div>

            {/* Target Course (Optional) */}
            <div>
              <label className="block text-xs font-medium text-warm-855 dark:text-slate-400 mb-1.5">
                Target Course (Optional)
              </label>
              <select
                value={targetCourse}
                onChange={(e) => setTargetCourse(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-warm-900 dark:text-slate-100 focus:ring-2 focus:ring-brand-500/20"
              >
                <option value="">Keep Same Course</option>
                {courses.map(c => (
                  <option key={c.id || c.code} value={c.code}>{c.name} ({c.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-xs text-warm-855 dark:text-slate-400">
              Selected <span className="font-bold text-brand-500">{selectedStudentIds.length}</span> student(s) will be updated to Session <span className="font-bold">{targetSession}</span>.
            </span>

            <button
              onClick={handlePromote}
              disabled={promoting || selectedStudentIds.length === 0}
              className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white flex items-center space-x-2 transition-all shadow-md ${
                promoting || selectedStudentIds.length === 0
                  ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed'
                  : 'bg-brand-500 hover:bg-brand-600 active:scale-95 shadow-brand-500/20'
              }`}
            >
              {promoting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Promoting Students...</span>
                </>
              ) : (
                <>
                  <span>Promote Selected Students</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Student Selection Table */}
      <div className="classy-card overflow-hidden">
        <div className="px-6 py-4 border-b border-warm-200/50 dark:border-darkbg-border flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 text-xs font-bold text-warm-900 dark:text-slate-200 hover:text-brand-500 transition-colors"
            >
              {selectedStudentIds.length > 0 && selectedStudentIds.length === students.length ? (
                <CheckSquare className="w-4 h-4 text-brand-500" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Select All ({students.length})</span>
            </button>
          </div>

          <span className="text-xs text-warm-855 dark:text-slate-400">
            Current Session: <span className="font-bold">{activeSession}</span>
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-warm-855 dark:text-slate-400 flex items-center justify-center space-x-2">
            <RefreshCw className="w-4 h-4 animate-spin text-brand-500" />
            <span>Loading students for session {activeSession}...</span>
          </div>
        ) : students.length === 0 ? (
          <div className="p-12 text-center text-xs text-warm-855 dark:text-slate-400">
            No students found for Session <span className="font-bold text-brand-500">{activeSession}</span> matching selected course filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-warm-100/60 dark:bg-darkbg-base text-warm-900 dark:text-slate-300 font-bold uppercase tracking-wider">
                <tr>
                  <th className="p-4 w-10">#</th>
                  <th className="p-4">Reg ID</th>
                  <th className="p-4">Student Name</th>
                  <th className="p-4">Course</th>
                  <th className="p-4">Current Year</th>
                  <th className="p-4">Session</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border">
                {students.map((st, idx) => {
                  const id = st._id || st.id;
                  const isSelected = selectedStudentIds.includes(id);

                  return (
                    <tr 
                      key={id}
                      onClick={() => toggleSelectStudent(id)}
                      className={`cursor-pointer transition-colors ${
                        isSelected 
                          ? 'bg-brand-500/10 dark:bg-brand-500/10' 
                          : 'hover:bg-warm-100/40 dark:hover:bg-darkbg-surface/60'
                      }`}
                    >
                      <td className="p-4">
                        {isSelected ? (
                          <CheckSquare className="w-4 h-4 text-brand-500" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </td>
                      <td className="p-4 font-mono font-bold text-brand-500">{st.registrationId}</td>
                      <td className="p-4 font-semibold text-warm-900 dark:text-slate-100">{st.fullName}</td>
                      <td className="p-4">{st.courseApplied}</td>
                      <td className="p-4">{st.currentYear || '1st Year'}</td>
                      <td className="p-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {st.academicSession || activeSession}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          st.verificationStatus === 'Approved'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-400'
                        }`}>
                          {st.verificationStatus}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Promotion;
