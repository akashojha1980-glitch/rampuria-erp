import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, User, ArrowLeft, Printer, BookOpen, 
  CreditCard, Award, FileText, CheckCircle, Clock, XCircle, 
  AlertCircle, Phone, Mail, MapPin, Calendar, Shield, ExternalLink,
  ChevronRight, RefreshCw, DollarSign, Layers, Sparkles
} from 'lucide-react';
import Loading from '../components/Loading';
import Toast from '../components/Toast';
import SearchableStudentSelect from '../components/SearchableStudentSelect';

const StudentDossier = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [studentsList, setStudentsList] = useState([]);
  const [selectedId, setSelectedId] = useState(id || '');
  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Active view tab in Dossier: 'all' | 'bio' | 'academics' | 'results' | 'fees' | 'library'
  const [activeSection, setActiveSection] = useState('all');

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Load all students for the searchable selector
  useEffect(() => {
    const loadStudents = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch('/api/students?limit=1000', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok && data.students) {
          setStudentsList(data.students);
          if (!selectedId && !id && data.students.length > 0) {
            setSelectedId(data.students[0]._id);
          }
        }
      } catch (err) {
        console.error('Error fetching students list:', err);
      }
    };
    loadStudents();
  }, []);

  // Fetch complete 360 dossier for selected student
  const fetchDossier = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${studentId}/360-dossier`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setDossierData(data);
      } else {
        showToastMsg(data.message || 'Error fetching student dossier', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId) {
      fetchDossier(selectedId);
    }
  }, [selectedId]);

  const handleStudentChange = (newStudentId) => {
    setSelectedId(newStudentId);
  };

  const { student, results = [], feePayments = [], feeSummary = {}, bookIssues = [], documents = {} } = dossierData || {};

  const photoUrl = student?.documents?.photo?.filename 
    ? `/uploads/${student.documents.photo.filename}`
    : student?.gender === 'Female'
      ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&fit=crop&crop=faces'
      : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&fit=crop&crop=faces';

  const signatureUrl = student?.documents?.signature?.filename
    ? `/uploads/${student.documents.signature.filename}`
    : null;

  return (
    <div className="flex flex-col space-y-6 font-sans p-4 md:p-6 max-w-7xl mx-auto min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ─── SCREEN ONLY: TOP SEARCH & ACTIONS BAR ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkbg-surface p-4 md:p-5 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm no-print">
        
        {/* Classy Searchable Student Dropdown */}
        <div className="flex-1 max-w-xl">
          <SearchableStudentSelect
            students={studentsList}
            value={selectedId}
            onChange={handleStudentChange}
            placeholder="Search student by Name, Reg ID, Mobile or Roll No..."
            label=""
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 self-end md:self-auto">
          <button
            onClick={() => window.print()}
            disabled={!student}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Student 360 Dossier (A4)</span>
          </button>

          {student && (
            <button
              onClick={() => navigate(`/profile/${student._id}`)}
              className="px-4 py-2.5 bg-warm-100 hover:bg-warm-200 dark:bg-darkbg-base dark:text-slate-200 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5"
            >
              <User className="w-4 h-4" />
              <span>Full Profile</span>
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Loading size="lg" text="Assembling 360° student lifecycle dossier..." />
      ) : !student ? (
        <div className="classy-card text-center py-16 space-y-3 no-print">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-warm-900 dark:text-white">No Student Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the searchable dropdown above to look up any student by Name or Registration ID to view their complete dossier.
          </p>
        </div>
      ) : (
        <>
          {/* ═══════════════════════════════════════════════════════════════
              SCREEN DASHBOARD VIEW (HIDDEN ON PRINT VIA .no-print)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="space-y-6 no-print">

            {/* Top Hero Student Profile Card */}
            <div className="classy-card p-6 relative overflow-hidden bg-gradient-to-r from-warm-50/50 via-white to-warm-50/30 dark:from-darkbg-base/50 dark:via-darkbg-surface dark:to-darkbg-base/30">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                
                {/* Photo & Signature */}
                <div className="flex flex-col items-center space-y-2 shrink-0">
                  <img
                    src={photoUrl}
                    alt={student.fullName}
                    className="w-24 h-28 object-cover rounded-xl border-2 border-brand-500/30 shadow-md bg-slate-100"
                  />
                  {signatureUrl && (
                    <div className="bg-white p-1 rounded border border-warm-200 max-w-[100px]">
                      <img src={signatureUrl} alt="Sign" className="max-h-8 object-contain" />
                    </div>
                  )}
                </div>

                {/* Bio Highlights */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-xl font-bold text-warm-900 dark:text-white font-serif">{student.fullName}</h2>
                    <span className="px-2.5 py-0.5 rounded-lg text-xs font-black bg-brand-500/10 text-brand-600 dark:text-brand-300 font-mono">
                      {student.registrationId}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                      student.verificationStatus === 'Verified' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                    }`}>
                      {student.verificationStatus || 'Pending'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-1.5 text-xs">
                    <div><span className="text-slate-400 font-semibold">Father's Name:</span> <strong className="text-slate-800 dark:text-slate-200">{student.fatherName || 'N/A'}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Mother's Name:</span> <strong className="text-slate-800 dark:text-slate-200">{student.motherName || 'N/A'}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Course:</span> <strong className="text-brand-600 dark:text-brand-400">{student.courseApplied}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Session:</span> <strong className="text-slate-800 dark:text-slate-200">{student.academicSession || '2025-26'}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Current Year/Sem:</span> <strong className="text-slate-800 dark:text-slate-200">{student.academicYear || student.currentYear || '1st Year'} ({student.semester || student.currentSemester || '1st Sem'})</strong></div>
                    <div><span className="text-slate-400 font-semibold">Category / Gender:</span> <strong className="text-slate-800 dark:text-slate-200">{student.category} • {student.gender}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Mobile:</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{student.mobileNumber}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Aadhar No:</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{student.aadharNo || 'N/A'}</strong></div>
                    <div><span className="text-slate-400 font-semibold">Form No / Sr No:</span> <strong className="text-slate-800 dark:text-slate-200 font-mono">{student.formNo || 'N/A'} (SR: #{student.srNo})</strong></div>
                  </div>
                </div>

                {/* Fee Quick Status Badge */}
                <div className="bg-warm-100/60 dark:bg-darkbg-base p-4 rounded-xl border border-warm-200/50 dark:border-darkbg-border flex flex-col items-center justify-center text-center shrink-0 min-w-[140px]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Fees Status</span>
                  <span className={`text-base font-black mt-1 ${feeSummary.isCleared ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {feeSummary.isCleared ? '✓ Cleared' : `₹${(feeSummary.totalDue || 0).toLocaleString('en-IN')} Due`}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    Paid: ₹{(feeSummary.totalPaid || 0).toLocaleString('en-IN')}
                  </span>
                </div>

              </div>
            </div>

            {/* Section Navigation Tabs */}
            <div className="flex bg-warm-100/50 dark:bg-darkbg-base p-1 rounded-xl border border-warm-200/40 dark:border-darkbg-border text-xs font-bold uppercase tracking-wider gap-1 overflow-x-auto">
              <button
                onClick={() => setActiveSection('all')}
                className={`px-3.5 py-2 rounded-lg transition-all ${activeSection === 'all' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                All Sections
              </button>
              <button
                onClick={() => setActiveSection('bio')}
                className={`px-3.5 py-2 rounded-lg transition-all ${activeSection === 'bio' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Personal & Bio
              </button>
              <button
                onClick={() => setActiveSection('academics')}
                className={`px-3.5 py-2 rounded-lg transition-all ${activeSection === 'academics' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Prior Qualifications
              </button>
              <button
                onClick={() => setActiveSection('results')}
                className={`px-3.5 py-2 rounded-lg transition-all ${activeSection === 'results' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Exam Results ({results.length})
              </button>
              <button
                onClick={() => setActiveSection('fees')}
                className={`px-3.5 py-2 rounded-lg transition-all ${activeSection === 'fees' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Fees Ledger ({feePayments.length})
              </button>
              <button
                onClick={() => setActiveSection('library')}
                className={`px-3.5 py-2 rounded-lg transition-all ${activeSection === 'library' ? 'bg-white dark:bg-darkbg-surface shadow text-brand-600 font-black' : 'text-slate-500'}`}
              >
                Library Issues ({bookIssues.length})
              </button>
            </div>

            {/* ─── SECTION 1: PERSONAL & DEMOGRAPHIC BIODATA ─── */}
            {(activeSection === 'all' || activeSection === 'bio') && (
              <div className="classy-card space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2 border-b pb-2">
                  <User className="w-4 h-4" />
                  <span>1. Personal & Demographic Biodata</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Date of Birth:</span> <strong>{student.dateOfBirth || 'N/A'}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Gender:</span> <strong>{student.gender}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Social Category:</span> <strong>{student.category}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Medium of Instruction:</span> <strong>{student.medium || 'Hindi'}</strong></div>
                  
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Primary Mobile:</span> <strong className="font-mono">{student.mobileNumber}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">WhatsApp No:</span> <strong className="font-mono">{student.whatsAppNo || student.mobileNumber}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Alternate Contact:</span> <strong className="font-mono">{student.alternateMobile || 'N/A'}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Email Address:</span> <strong className="truncate block">{student.email}</strong></div>

                  <div><span className="text-slate-400 font-semibold block text-[11px]">Father's Annual Income:</span> <strong>₹{student.yearlyIncomeFather || 'N/A'}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Mother's Annual Income:</span> <strong>₹{student.yearlyIncomeMother || 'N/A'}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Admission Base:</span> <strong>{student.admissionBase || 'UG'}</strong></div>
                  <div><span className="text-slate-400 font-semibold block text-[11px]">Student Bank Acc No:</span> <strong className="font-mono">{student.studentAccNo || 'N/A'}</strong></div>

                  <div className="col-span-2"><span className="text-slate-400 font-semibold block text-[11px]">Present Communication Address:</span> <strong>{student.address}, {student.city}, {student.state} - {student.pincode}</strong></div>
                  <div className="col-span-2"><span className="text-slate-400 font-semibold block text-[11px]">Permanent Native Address:</span> <strong>{student.permanentAddress || student.address}</strong></div>
                </div>
              </div>
            )}

            {/* ─── SECTION 2: PRIOR ACADEMIC QUALIFICATIONS ─── */}
            {(activeSection === 'all' || activeSection === 'academics') && (
              <div className="classy-card space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2 border-b pb-2">
                  <Award className="w-4 h-4" />
                  <span>2. Prior Academic Qualifications History</span>
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse border border-warm-200 dark:border-darkbg-border">
                    <thead>
                      <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                        <th className="px-3 py-2 border-r border-warm-200 dark:border-darkbg-border">Examination</th>
                        <th className="px-3 py-2 border-r border-warm-200 dark:border-darkbg-border">Board / University</th>
                        <th className="px-3 py-2 border-r border-warm-200 dark:border-darkbg-border">Passing Year</th>
                        <th className="px-3 py-2 border-r border-warm-200 dark:border-darkbg-border">Subjects / Stream</th>
                        <th className="px-3 py-2 border-r border-warm-200 dark:border-darkbg-border">Max Marks</th>
                        <th className="px-3 py-2 border-r border-warm-200 dark:border-darkbg-border">Marks Obtained</th>
                        <th className="px-3 py-2 text-right">Percentage %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border font-medium">
                      <tr>
                        <td className="px-3 py-2.5 font-bold border-r border-warm-200 dark:border-darkbg-border">10th Secondary</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.board10 || 'RBSE / CBSE'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.passingYear10 || 'N/A'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">General Secondary</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.maxMarks10 || '600'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.obtainedMarks10 || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-right font-black text-brand-600">{student.marks10 ? `${student.marks10}%` : 'N/A'}</td>
                      </tr>
                      <tr>
                        <td className="px-3 py-2.5 font-bold border-r border-warm-200 dark:border-darkbg-border">12th Sr. Secondary</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.board12 || 'RBSE / CBSE'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.passingYear12 || 'N/A'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.subject12 || 'Arts / Science / Commerce'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.maxMarks12 || '500'}</td>
                        <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.obtainedMarks12 || 'N/A'}</td>
                        <td className="px-3 py-2.5 text-right font-black text-brand-600">{student.marks12 ? `${student.marks12}%` : 'N/A'}</td>
                      </tr>
                      {(student.gradUniversity || student.gradYear || student.gradPercentage) && (
                        <tr>
                          <td className="px-3 py-2.5 font-bold border-r border-warm-200 dark:border-darkbg-border">Graduation Degree</td>
                          <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.gradUniversity || 'MGSU / Rajasthan Univ'}</td>
                          <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.gradYear || 'N/A'}</td>
                          <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.gradSubject || 'B.A. / B.Com / B.Sc'}</td>
                          <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.gradMaxMarks || 'N/A'}</td>
                          <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.gradObtainedMarks || 'N/A'}</td>
                          <td className="px-3 py-2.5 text-right font-black text-brand-600">{student.gradPercentage ? `${student.gradPercentage}%` : 'N/A'}</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ─── SECTION 3: EXAM RESULTS & SEMESTER TRANSCRIPTS ─── */}
            {(activeSection === 'all' || activeSection === 'results') && (
              <div className="classy-card space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2 border-b pb-2">
                  <FileText className="w-4 h-4" />
                  <span>3. College Exam Results & Marksheet Transcripts ({results.length} Recorded)</span>
                </h3>

                {results.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No examination results recorded yet in this software for this student.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {results.map((res, idx) => (
                      <div key={res.id || idx} className="p-4 rounded-xl bg-warm-50/50 dark:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-200/40 pb-2">
                          <div>
                            <span className="text-xs font-bold text-warm-900 dark:text-white">
                              {res.examName || `${res.semester} Examination`}
                            </span>
                            <span className="text-[10px] text-slate-400 block font-mono">
                              Session: {res.academicSession} • Roll No: {res.rollNumber || 'N/A'} • Enrollment: {res.enrollmentNumber || 'N/A'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-3">
                            <span className={`px-2.5 py-0.5 rounded text-xs font-black uppercase ${
                              res.resultStatus === 'Pass' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500/10 text-rose-600'
                            }`}>
                              {res.resultStatus || 'Pass'}
                            </span>
                            <span className="text-xs font-bold text-brand-600 dark:text-brand-400">
                              {res.percentage}% ({res.division || '1st Div'})
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span>Total Marks: <strong>{res.totalObtained} / {res.totalMax}</strong></span>
                          <span>Percentage: <strong>{res.percentage}%</strong></span>
                          <span>Declared Date: <strong>{res.declaredDate || (res.createdAt ? new Date(res.createdAt).toLocaleDateString() : 'N/A')}</strong></span>
                        </div>

                        {res.subjects && res.subjects.length > 0 && (
                          <div className="overflow-x-auto pt-2">
                            <table className="w-full text-left text-[11px]">
                              <thead>
                                <tr className="text-slate-400 uppercase text-[9px] font-bold border-b">
                                  <th className="py-1">Paper Code</th>
                                  <th className="py-1">Subject Name</th>
                                  <th className="py-1">Max</th>
                                  <th className="py-1">Theory</th>
                                  <th className="py-1">Practical</th>
                                  <th className="py-1 text-right">Total Marks</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-warm-200/30 font-medium">
                                {res.subjects.map((sub, sIdx) => (
                                  <tr key={sIdx}>
                                    <td className="py-1 font-mono">{sub.code}</td>
                                    <td className="py-1 font-semibold">{sub.name}</td>
                                    <td className="py-1">{sub.maxMarks}</td>
                                    <td className="py-1">{sub.theoryMarks || '-'}</td>
                                    <td className="py-1">{sub.practicalMarks || '-'}</td>
                                    <td className="py-1 text-right font-bold text-slate-900 dark:text-white">{sub.obtainedMarks}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 4: FINANCIAL FEES LEDGER ─── */}
            {(activeSection === 'all' || activeSection === 'fees') && (
              <div className="classy-card space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2">
                    <CreditCard className="w-4 h-4" />
                    <span>4. Complete Fees Payment Ledger ({feePayments.length} Receipts)</span>
                  </h3>
                  <div className="text-xs font-bold space-x-3">
                    <span className="text-emerald-600">Total Paid: ₹{(feeSummary.totalPaid || 0).toLocaleString('en-IN')}</span>
                    <span className={feeSummary.totalDue > 0 ? 'text-rose-600' : 'text-slate-400'}>
                      Balance Due: ₹{(feeSummary.totalDue || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {feePayments.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No fees transactions recorded for this student.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                          <th className="px-3 py-2">Receipt No</th>
                          <th className="px-3 py-2">Payment Date</th>
                          <th className="px-3 py-2">Particulars / Head</th>
                          <th className="px-3 py-2">Payment Mode</th>
                          <th className="px-3 py-2">Txn / Ref ID</th>
                          <th className="px-3 py-2 text-right">Amount Paid (₹)</th>
                          <th className="px-3 py-2 text-right">Balance Due (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border font-medium">
                        {feePayments.map((p, i) => (
                          <tr key={p.id || i}>
                            <td className="px-3 py-2 font-mono font-bold text-brand-600">{p.receiptNo || `REC-${p.id}`}</td>
                            <td className="px-3 py-2">{p.paymentDate}</td>
                            <td className="px-3 py-2 font-semibold text-slate-800 dark:text-slate-200">{p.installmentType || p.feeHead || 'Tuition Fee'}</td>
                            <td className="px-3 py-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-warm-100 dark:bg-darkbg-base">
                                {p.paymentMode || 'Cash'}
                              </span>
                            </td>
                            <td className="px-3 py-2 font-mono text-[11px] text-slate-400">{p.transactionNo || '-'}</td>
                            <td className="px-3 py-2 text-right font-black text-emerald-600">₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2 text-right font-bold text-slate-500">₹{Number(p.amountDue || 0).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ─── SECTION 5: LIBRARY ACCOUNT ─── */}
            {(activeSection === 'all' || activeSection === 'library') && (
              <div className="classy-card space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400 flex items-center space-x-2 border-b pb-2">
                  <BookOpen className="w-4 h-4" />
                  <span>5. Library Books Circulation History ({bookIssues.length})</span>
                </h3>

                {bookIssues.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
                    No library books issued to this student.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-warm-200 dark:border-darkbg-border">
                          <th className="px-3 py-2">Accession #</th>
                          <th className="px-3 py-2">Book Title</th>
                          <th className="px-3 py-2">Author</th>
                          <th className="px-3 py-2">Issue Date</th>
                          <th className="px-3 py-2">Due Date</th>
                          <th className="px-3 py-2">Return Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200/40 dark:divide-darkbg-border font-medium">
                        {bookIssues.map((b, i) => (
                          <tr key={b.id || i}>
                            <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-slate-200">{b.book?.bookNo || 'N/A'}</td>
                            <td className="px-3 py-2 font-bold text-warm-900 dark:text-white">{b.book?.title || 'Book Item'}</td>
                            <td className="px-3 py-2 text-slate-500">{b.book?.author || '-'}</td>
                            <td className="px-3 py-2">{b.issueDate}</td>
                            <td className="px-3 py-2 font-mono text-amber-600">{b.dueDate}</td>
                            <td className="px-3 py-2">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                b.status === 'Returned' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                              }`}>
                                {b.status || 'Issued'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════
              DEDICATED 1-PAGE A4 OFFICIAL PRINT DOSSIER
              (STRICTLY FORMATTED FOR 1 SHEET OF A4 PAPER)
              ═══════════════════════════════════════════════════════════════ */}
          <div className="hidden print:block printable-dossier w-full text-black font-sans leading-tight">
            
            {/* Header Box */}
            <div className="border-2 border-black p-2 text-center mb-2 bg-slate-50">
              <h1 className="text-sm font-black uppercase tracking-wider font-serif">
                B.J.S. RAMPURIA JAIN LAW COLLEGE, BIKANER
              </h1>
              <p className="text-[10px] font-semibold text-slate-700">
                (Affiliated to Maharaja Ganga Singh University, Bikaner & Bar Council of India)
              </p>
              <div className="border-t border-black my-1"></div>
              <div className="flex justify-between items-center text-[10.5px] font-black uppercase tracking-wide">
                <span>OFFICIAL STUDENT 360° MASTER RECORD & DOSSIER</span>
                <span className="font-mono">ACADEMIC SESSION: {student.academicSession || '2025-2026'}</span>
              </div>
            </div>

            {/* Profile & Biodata Combined Grid */}
            <div className="border border-black mb-2 p-1.5 flex gap-2 items-start">
              
              {/* Photo & Signature Column */}
              <div className="w-24 shrink-0 flex flex-col items-center gap-1 border-r border-black pr-2">
                <img
                  src={photoUrl}
                  alt={student.fullName}
                  className="w-20 h-24 object-cover border border-black bg-slate-100"
                />
                <div className="text-[8px] uppercase font-bold text-center">Student Photo</div>
                {signatureUrl ? (
                  <img src={signatureUrl} alt="Signature" className="h-6 max-w-[80px] object-contain border border-slate-400" />
                ) : (
                  <div className="h-6 w-20 border border-dashed border-slate-400 flex items-center justify-center text-[7px] text-slate-500">
                    Sign on file
                  </div>
                )}
                <div className="text-[7.5px] uppercase font-bold text-center">Candidate Sign</div>
              </div>

              {/* Biodata Key-Value Table */}
              <div className="flex-1 text-[10px]">
                <table className="w-full border-collapse">
                  <tbody>
                    <tr className="border-b border-slate-300">
                      <td className="w-24 font-bold text-slate-600 py-0.5">Registration ID:</td>
                      <td className="font-mono font-black text-black py-0.5">{student.registrationId}</td>
                      <td className="w-24 font-bold text-slate-600 py-0.5">Enrollment No:</td>
                      <td className="font-mono font-bold text-black py-0.5">{student.enrollmentNo || student.enrollmentNumber || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="font-bold text-slate-600 py-0.5">Student Name:</td>
                      <td className="font-bold uppercase text-black py-0.5">{student.fullName}</td>
                      <td className="font-bold text-slate-600 py-0.5">Course & Year:</td>
                      <td className="font-bold text-black py-0.5">{student.courseApplied} • {student.academicYear || student.currentYear || '1st Year'}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="font-bold text-slate-600 py-0.5">Father's Name:</td>
                      <td className="font-medium text-black py-0.5">{student.fatherName || 'N/A'}</td>
                      <td className="font-bold text-slate-600 py-0.5">Mother's Name:</td>
                      <td className="font-medium text-black py-0.5">{student.motherName || 'N/A'}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="font-bold text-slate-600 py-0.5">Date of Birth:</td>
                      <td className="font-medium text-black py-0.5">{student.dateOfBirth || 'N/A'}</td>
                      <td className="font-bold text-slate-600 py-0.5">Gender / Category:</td>
                      <td className="font-medium text-black py-0.5">{student.gender} • {student.category}</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="font-bold text-slate-600 py-0.5">Mobile Number:</td>
                      <td className="font-mono font-medium text-black py-0.5">{student.mobileNumber}</td>
                      <td className="font-bold text-slate-600 py-0.5">Aadhar / Form No:</td>
                      <td className="font-mono text-black py-0.5">{student.aadharNo || 'N/A'} • Form #{student.formNo || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td className="font-bold text-slate-600 py-0.5 align-top">Permanent Addr:</td>
                      <td colSpan={3} className="text-black py-0.5">
                        {student.address}, {student.city}, {student.state} - {student.pincode}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section: Prior Educational Qualifications */}
            <div className="mb-2">
              <div className="bg-slate-200 border border-black px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider flex justify-between">
                <span>1. Prior Academic Qualifications</span>
                <span>Verified by Scrutiny Team</span>
              </div>
              <table className="w-full text-left text-[9px] border-collapse border border-black">
                <thead>
                  <tr className="bg-slate-100 border-b border-black font-bold">
                    <th className="px-1.5 py-0.5 border-r border-black">Exam Name</th>
                    <th className="px-1.5 py-0.5 border-r border-black">Board / University</th>
                    <th className="px-1.5 py-0.5 border-r border-black">Passing Year</th>
                    <th className="px-1.5 py-0.5 border-r border-black">Max Marks</th>
                    <th className="px-1.5 py-0.5 border-r border-black">Obt Marks</th>
                    <th className="px-1.5 py-0.5 text-right">Percentage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black">
                  <tr>
                    <td className="px-1.5 py-0.5 font-bold border-r border-black">10th Secondary</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.board10 || 'RBSE / CBSE'}</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.passingYear10 || 'N/A'}</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.maxMarks10 || '600'}</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.obtainedMarks10 || 'N/A'}</td>
                    <td className="px-1.5 py-0.5 text-right font-bold">{student.marks10 ? `${student.marks10}%` : 'N/A'}</td>
                  </tr>
                  <tr>
                    <td className="px-1.5 py-0.5 font-bold border-r border-black">12th Sr. Secondary</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.board12 || 'RBSE / CBSE'}</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.passingYear12 || 'N/A'}</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.maxMarks12 || '500'}</td>
                    <td className="px-1.5 py-0.5 border-r border-black">{student.obtainedMarks12 || 'N/A'}</td>
                    <td className="px-1.5 py-0.5 text-right font-bold">{student.marks12 ? `${student.marks12}%` : 'N/A'}</td>
                  </tr>
                  {(student.gradUniversity || student.gradYear || student.gradPercentage) && (
                    <tr>
                      <td className="px-1.5 py-0.5 font-bold border-r border-black">Graduation Degree</td>
                      <td className="px-1.5 py-0.5 border-r border-black">{student.gradUniversity || 'MGSU / Rajasthan Univ'}</td>
                      <td className="px-1.5 py-0.5 border-r border-black">{student.gradYear || 'N/A'}</td>
                      <td className="px-1.5 py-0.5 border-r border-black">{student.gradMaxMarks || 'N/A'}</td>
                      <td className="px-1.5 py-0.5 border-r border-black">{student.gradObtainedMarks || 'N/A'}</td>
                      <td className="px-1.5 py-0.5 text-right font-bold">{student.gradPercentage ? `${student.gradPercentage}%` : 'N/A'}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Section: College Examination Results Transcript */}
            <div className="mb-2">
              <div className="bg-slate-200 border border-black px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider flex justify-between">
                <span>2. College Exam Results & Semester Performance ({results.length} Semesters)</span>
                <span>ERP Examination Cell</span>
              </div>
              {results.length === 0 ? (
                <div className="border border-t-0 border-black p-1 text-center text-[9px] text-slate-500 italic">
                  No internal/semester examinations recorded in ERP database for this student yet.
                </div>
              ) : (
                <table className="w-full text-left text-[9px] border-collapse border border-black">
                  <thead>
                    <tr className="bg-slate-100 border-b border-black font-bold">
                      <th className="px-1.5 py-0.5 border-r border-black">Exam / Semester</th>
                      <th className="px-1.5 py-0.5 border-r border-black">Session</th>
                      <th className="px-1.5 py-0.5 border-r border-black">Roll No</th>
                      <th className="px-1.5 py-0.5 border-r border-black">Total Max</th>
                      <th className="px-1.5 py-0.5 border-r border-black">Marks Obtained</th>
                      <th className="px-1.5 py-0.5 border-r border-black">Percentage</th>
                      <th className="px-1.5 py-0.5 text-right">Result Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black">
                    {results.slice(0, 4).map((r, i) => (
                      <tr key={i}>
                        <td className="px-1.5 py-0.5 font-bold border-r border-black">{r.examName || `${r.semester} Exam`}</td>
                        <td className="px-1.5 py-0.5 border-r border-black">{r.academicSession}</td>
                        <td className="px-1.5 py-0.5 font-mono border-r border-black">{r.rollNumber || '-'}</td>
                        <td className="px-1.5 py-0.5 border-r border-black">{r.totalMax}</td>
                        <td className="px-1.5 py-0.5 font-bold border-r border-black">{r.totalObtained}</td>
                        <td className="px-1.5 py-0.5 font-bold border-r border-black">{r.percentage}%</td>
                        <td className="px-1.5 py-0.5 text-right font-black uppercase">{r.resultStatus || 'PASS'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Section: Fees Ledger & Clearance Summary */}
            <div className="mb-2">
              <div className="bg-slate-200 border border-black px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider flex justify-between">
                <span>3. Fees Accounts Ledger & Clearance Summary</span>
                <span>
                  Status: {feeSummary.isCleared ? 'VERIFIED CLEARED' : `DUE: ₹${(feeSummary.totalDue || 0).toLocaleString('en-IN')}`}
                </span>
              </div>
              <div className="border border-t-0 border-black p-1.5">
                <div className="grid grid-cols-4 gap-2 text-[9.5px] mb-1 font-bold">
                  <div>Total Fees: ₹{(feeSummary.totalFee || feeSummary.totalPaid + feeSummary.totalDue || 0).toLocaleString('en-IN')}</div>
                  <div>Total Paid: ₹{(feeSummary.totalPaid || 0).toLocaleString('en-IN')}</div>
                  <div>Outstanding: ₹{(feeSummary.totalDue || 0).toLocaleString('en-IN')}</div>
                  <div className="text-right">Receipts Count: {feePayments.length}</div>
                </div>

                {feePayments.length > 0 && (
                  <table className="w-full text-left text-[8.5px] border-collapse border-t border-slate-300">
                    <thead>
                      <tr className="text-slate-600 border-b border-slate-300 font-bold">
                        <th className="py-0.5">Receipt #</th>
                        <th className="py-0.5">Date</th>
                        <th className="py-0.5">Head / Installment</th>
                        <th className="py-0.5">Mode</th>
                        <th className="py-0.5 text-right">Amount Paid</th>
                        <th className="py-0.5 text-right">Balance Due</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {feePayments.slice(0, 3).map((p, i) => (
                        <tr key={i}>
                          <td className="py-0.5 font-mono font-bold">{p.receiptNo || `REC-${p.id}`}</td>
                          <td className="py-0.5">{p.paymentDate}</td>
                          <td className="py-0.5">{p.installmentType || p.feeHead || 'Tuition Fee'}</td>
                          <td className="py-0.5">{p.paymentMode || 'Cash'}</td>
                          <td className="py-0.5 text-right font-bold">₹{Number(p.amountPaid || 0).toLocaleString('en-IN')}</td>
                          <td className="py-0.5 text-right">₹{Number(p.amountDue || 0).toLocaleString('en-IN')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Section: Library & Verification Clearance Summary */}
            <div className="mb-4">
              <div className="bg-slate-200 border border-black px-1.5 py-0.5 text-[9.5px] font-black uppercase tracking-wider flex justify-between">
                <span>4. Library & Institutional Clearance</span>
                <span>Active Issues: {bookIssues.filter(b => b.status === 'Issued').length} Books</span>
              </div>
              <div className="border border-t-0 border-black p-1 text-[9px] flex justify-between items-center">
                <span>Total Books Issued to Date: <strong>{bookIssues.length}</strong></span>
                <span>Documents Verification: <strong>{student.verificationStatus || 'Verified'}</strong></span>
                <span>Admission Category: <strong>Regular On-Roll Student</strong></span>
                <span>Conduct / Discipline: <strong>Satisfactory / No Remarks</strong></span>
              </div>
            </div>

            {/* Official Signatures Row */}
            <div className="border-t-2 border-black pt-6 grid grid-cols-3 gap-6 text-center text-[10px] font-black text-black">
              <div>
                <div className="border-t border-slate-700 pt-1">ERP Data Clerk</div>
                <div className="text-[8px] font-normal text-slate-500">Record Entered & Checked</div>
              </div>
              <div>
                <div className="border-t border-slate-700 pt-1">Administrative Officer</div>
                <div className="text-[8px] font-normal text-slate-500">Academic & Fees Verified</div>
              </div>
              <div>
                <div className="border-t border-slate-700 pt-1">Principal Approval & Seal</div>
                <div className="text-[8px] font-normal text-slate-500">B.J.S. Rampuria Jain Law College</div>
              </div>
            </div>

            {/* Footer Watermark */}
            <div className="mt-2 text-center text-[7.5px] text-slate-400 font-mono">
              Generated automatically via B.J.S. Rampuria Jain Law College ERP System | Document Verification Code: {student._id} | Page 1 of 1
            </div>

          </div>
        </>
      )}
    </div>
  );
};

export default StudentDossier;
