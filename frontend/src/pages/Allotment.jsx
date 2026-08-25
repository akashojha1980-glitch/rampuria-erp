import React, { useState, useEffect } from 'react';
import { 
  Award, Play, CheckCircle, HelpCircle, 
  UserCheck, ShieldAlert, CheckSquare, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const Allotment = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [meritList, setMeritList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meritLoading, setMeritLoading] = useState(false);
  const [allotting, setAllotting] = useState(false);
  const [summaryReport, setSummaryReport] = useState(null); // allotment summary
  const [toast, setToast] = useState(null);

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchCourses = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses/stats/summary', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setCourses(data || []);
        if (data.length > 0 && !selectedCourse) {
          setSelectedCourse(data[0].code);
        }
      }
    } catch (err) {
      showToastMsg('Failed to sync courses details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchMeritList = async (courseCode) => {
    if (!courseCode) return;
    setMeritLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/allotment/merit-list/${courseCode}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setMeritList(data.students || []);
      }
    } catch (err) {
      showToastMsg('Failed to fetch merit list', 'error');
    } finally {
      setMeritLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchMeritList(selectedCourse);
    }
  }, [selectedCourse]);

  // Execute Auto Allotment for ALL Courses
  const handleExecuteAllotment = async () => {
    if (!window.confirm('Running automated seat allotment will evaluate all VERIFIED students and allocate seats based on merit and category quotas. Previously confirmed allotments will be updated. Proceed?')) return;
    
    setAllotting(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/allotment/run-all', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        showToastMsg('Automated seat allotment complete!');
        setSummaryReport(data.report || []);
        await fetchCourses();
        if (selectedCourse) {
          fetchMeritList(selectedCourse);
        }
      } else {
        showToastMsg(data.message || 'Seat allocation execution error', 'error');
      }
    } catch (err) {
      showToastMsg('Database timeout during allotment', 'error');
    } finally {
      setAllotting(false);
    }
  };

  // Reset Allotment for Course
  const handleResetAllotment = async () => {
    if (!window.confirm(`Are you sure you want to reset all allotments for ${selectedCourse}?`)) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/allotment/reset/${selectedCourse}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        showToastMsg(`Seat allotment reset for ${selectedCourse}`);
        await fetchCourses();
        fetchMeritList(selectedCourse);
      }
    } catch (err) {
      showToastMsg('Database connection timeout', 'error');
    }
  };

  return (
    <div className="flex flex-col space-y-6">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {loading ? (
        <Loading size="lg" text="Syncing merit ledger databases..." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* LEFT/TOP: Seat Status list & Allotment Trigger */}
          <div className="flex flex-col space-y-6 lg:col-span-1">
            
            {/* GLOWING TRIGGER BOX */}
            <div className="classy-card relative overflow-hidden bg-white/70 dark:bg-darkbg-surface/75 border border-warm-200/60 dark:border-darkbg-border p-6">
              <div className="space-y-4 z-10 relative">
                <div className="p-3 bg-brand-500/10 dark:bg-brand-500/20 rounded-xl w-fit text-brand-750 dark:text-brand-300">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-warm-900 dark:text-white">Automated Seat Allotment</h3>
                  <p className="text-xs text-warm-800/80 dark:text-slate-300/90 leading-relaxed mt-1">
                    Auto-ranks verified applicants based on standard percentage merit list and allocates open or reserved seats fairly.
                  </p>
                </div>

                <div className="h-px bg-warm-200/50 dark:bg-darkbg-border w-full" />

                <div className="flex gap-2">
                  <button
                    onClick={handleExecuteAllotment}
                    disabled={allotting}
                    className="flex-1 flex items-center justify-center space-x-2 py-3 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                  >
                    <Play className="w-4 h-4 fill-white text-white" />
                    <span>{allotting ? 'Running...' : 'Run Allotment'}</span>
                  </button>
                  <button
                    onClick={handleResetAllotment}
                    title="Reset Allotments"
                    className="p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-all"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* SEATS FILL METRICS BOX */}
            <div className="classy-card flex flex-col space-y-5">
              <div>
                <h3 className="text-xs font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">Course Quota Tracking</h3>
                <span className="text-[10px] text-warm-800/40 dark:text-slate-500 font-semibold">Active seat occupancy percentages</span>
              </div>

              <div className="space-y-3">
                {courses.map(course => {
                  const percent = Math.min(Math.round((course.enrolled / course.totalSeats) * 100), 100);
                  return (
                    <button
                      key={course._id}
                      onClick={() => setSelectedCourse(course.code)}
                      className={`w-full text-left p-4 rounded-xl border transition-all flex flex-col space-y-2.5 ${
                        selectedCourse === course.code
                          ? 'border-brand-500 bg-brand-500/5 dark:bg-brand-600/10'
                          : 'border-warm-200/50 dark:border-darkbg-border hover:border-warm-200'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-bold text-xs text-warm-900 dark:text-slate-200">{course.code}</span>
                        <span className="text-[10px] text-warm-800/40 dark:text-slate-400">{course.enrolled} / {course.totalSeats} seats</span>
                      </div>
                      
                      {/* Bar indicator */}
                      <div className="w-full h-1.5 bg-warm-100 dark:bg-darkbg-base rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-brand-600 dark:bg-brand-500 rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-warm-800/40 dark:text-slate-500 font-bold uppercase">
                        <span>Cutoff: {course.cutoffMarks}%</span>
                        <span>Filled: {percent}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* RIGHT: Course Merit Ranking List table */}
          <div className="lg:col-span-2 classy-card flex flex-col space-y-4 h-[calc(100vh-12rem)] overflow-y-auto">
            <div>
              <h3 className="text-sm font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">
                Merit List: <span className="text-brand-600 dark:text-brand-300 font-serif font-bold">{selectedCourse}</span>
              </h3>
              <span className="text-xs font-medium text-warm-800/40 dark:text-slate-400">
                Verified applicants sorted in descending order of 12th percentage marks
              </span>
            </div>

            {meritLoading ? (
              <Loading size="md" text="Sorting merit rosters..." />
            ) : meritList.length === 0 ? (
              <div className="text-center py-16 text-xs text-warm-800/40 dark:text-slate-500 flex flex-col justify-center items-center h-full">
                <span>No verified candidates preferred this course.</span>
                <span className="mt-1">Candidates must be verified and meet cutoff criteria to rank.</span>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border">
                  <thead className="bg-warm-50/50 dark:bg-darkbg-base/30">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Rank</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Student Name</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">12th Marks</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border bg-transparent">
                    {meritList.map((s) => (
                      <tr key={s._id} className="hover:bg-warm-100/10 dark:hover:bg-darkbg-base/20 transition-all">
                        <td className="px-6 py-4 text-xs font-bold text-warm-800/40 dark:text-slate-500">#{s.meritRank}</td>
                        <td className="px-6 py-4 text-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-warm-900 dark:text-slate-200">{s.fullName}</span>
                            <span className="text-[10px] text-warm-800/40 dark:text-slate-555">{s.registrationId}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-warm-800/60 dark:text-slate-400">{s.category}</td>
                        <td className="px-6 py-4 text-xs font-bold text-warm-900 dark:text-slate-200">{s.marks12}%</td>
                        <td className="px-6 py-4 text-xs text-center">
                          {s.seatAllotted ? (
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center space-x-1">
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Allotted Seat</span>
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-warm-800/40 dark:text-slate-500">Waiting List</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUMMARY MODAL DIALOGUE */}
      {summaryReport && (
        <div className="fixed inset-0 bg-warm-900/80 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="classy-card max-w-md w-full text-center flex flex-col space-y-6">
            <div className="flex flex-col items-center space-y-3">
              <div className="p-3 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 rounded-2xl w-fit">
                <CheckCircle className="w-12 h-12" />
              </div>
              <h3 className="text-base font-serif font-bold text-warm-900 dark:text-emerald-400">Allotment Run Successful</h3>
              <p className="text-xs text-warm-800/40 dark:text-slate-500 font-semibold">Seat allocation statistics successfully updated</p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-warm-200 dark:border-darkbg-border text-xs">
              <table className="min-w-full divide-y divide-warm-200 dark:divide-darkbg-border text-left">
                <thead className="bg-warm-50/50 dark:bg-darkbg-base/30">
                  <tr>
                    <th className="px-4 py-2 font-bold text-warm-800/70">Course</th>
                    <th className="px-4 py-2 font-bold text-warm-800/70">Allotted Seats</th>
                    <th className="px-4 py-2 font-bold text-warm-800/70">Total Capacity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border">
                  {summaryReport.map(row => (
                    <tr key={row.course}>
                      <td className="px-4 py-2 font-bold text-warm-900 dark:text-slate-200">{row.course}</td>
                      <td className="px-4 py-2 text-warm-850 dark:text-slate-300">{row.allotted} allotted</td>
                      <td className="px-4 py-2 text-warm-800/50 dark:text-slate-500">{row.capacity} seats</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <button
              onClick={() => setSummaryReport(null)}
              className="classy-btn-primary"
            >
              Close and Review Merit Lists
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Allotment;
