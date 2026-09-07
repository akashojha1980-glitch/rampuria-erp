import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Search, User, ArrowLeft, Printer, Download, BookOpen, 
  CreditCard, Award, FileText, CheckCircle, Clock, XCircle, 
  AlertCircle, Phone, Mail, MapPin, Calendar, Shield, ExternalLink,
  ChevronRight, RefreshCw, DollarSign, Layers
} from 'lucide-react';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const StudentDossier = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  const [selectedId, setSelectedId] = useState(id || '');
  const [dossierData, setDossierData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);

  // Active view tab in Dossier: 'all' | 'bio' | 'academics' | 'results' | 'fees' | 'documents' | 'library'
  const [activeSection, setActiveSection] = useState('all');

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  // Live student search for lookup
  useEffect(() => {
    if (!searchQuery || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`/api/students?limit=10&search=${encodeURIComponent(searchQuery.trim())}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data.students || []);
        }
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

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

  // On initial mount if no ID, fetch first student from registry to populate
  useEffect(() => {
    if (!selectedId && !id) {
      const loadInitial = async () => {
        const token = localStorage.getItem('token');
        try {
          const res = await fetch('/api/students?limit=1', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          if (res.ok && data.students?.length > 0) {
            setSelectedId(data.students[0]._id);
          }
        } catch (err) {
          console.error(err);
        }
      };
      loadInitial();
    }
  }, []);

  const handleSelectStudent = (student) => {
    setSelectedId(student._id);
    setSearchQuery('');
    setSearchResults([]);
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
    <div className="flex flex-col space-y-6 font-sans p-6 max-w-7xl mx-auto min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Top Search & Actions Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-darkbg-surface p-5 rounded-2xl border border-warm-200/50 dark:border-darkbg-border shadow-sm no-print">
        
        {/* Search Input with dropdown */}
        <div className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search student by Name, Reg ID, Mobile or Roll No..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold focus:outline-none focus:border-brand-500"
            />
          </div>

          {/* Live Search Results Dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-darkbg-surface rounded-xl shadow-2xl border border-warm-200 dark:border-darkbg-border z-50 overflow-hidden max-h-72 overflow-y-auto">
              {searchResults.map((s) => (
                <button
                  key={s._id}
                  onClick={() => handleSelectStudent(s)}
                  className="w-full text-left px-4 py-3 hover:bg-brand-50 dark:hover:bg-darkbg-base transition-colors flex items-center justify-between border-b border-warm-100 dark:border-darkbg-border last:border-0"
                >
                  <div>
                    <span className="text-xs font-bold text-warm-900 dark:text-slate-100 block">{s.fullName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {s.registrationId} • {s.courseApplied} • {s.academicSession}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2.5 self-end md:self-auto">
          <button
            onClick={() => window.print()}
            disabled={!student}
            className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-2"
          >
            <Printer className="w-4 h-4" />
            <span>Print Student 360 Dossier</span>
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
        <div className="classy-card text-center py-16 space-y-3">
          <User className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-warm-900 dark:text-white">No Student Selected</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Use the search bar above to look up any student by Name or Registration ID to view their complete dossier.
          </p>
        </div>
      ) : (
        <div className="space-y-6">

          {/* Official College Print Header */}
          <div className="hidden print:block text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold uppercase tracking-wider font-serif">
              B.J.S. Rampuria Jain Law College, Bikaner
            </h1>
            <p className="text-xs text-slate-600">Comprehensive Student Master Record & Academic Dossier</p>
            <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
              Printed on: {new Date().toLocaleString('en-IN')} | Verified Administrative File
            </p>
          </div>

          {/* Top Hero Student Profile Card */}
          <div className="classy-card p-6 relative overflow-hidden bg-gradient-to-r from-warm-50/50 via-white to-warm-50/30 dark:from-darkbg-base/50 dark:via-darkbg-surface dark:to-darkbg-base/30">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              
              {/* Photo & Signature */}
              <div className="flex flex-col items-center space-y-2 shrink-0">
                <img
                  src={photoUrl}
                  alt={student.fullName}
                  className="w-24 h-28 object-cover rounded-xl border-2 border-brand-500/30 shadow-md"
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

          {/* Section Navigation Tabs (No Print) */}
          <div className="flex bg-warm-100/50 dark:bg-darkbg-base p-1 rounded-xl border border-warm-200/40 dark:border-darkbg-border text-xs font-bold uppercase tracking-wider no-print gap-1 overflow-x-auto">
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
                    {/* 10th */}
                    <tr>
                      <td className="px-3 py-2.5 font-bold border-r border-warm-200 dark:border-darkbg-border">10th Secondary</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.board10 || 'RBSE / CBSE'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.passingYear10 || 'N/A'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">General Secondary</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.maxMarks10 || '600'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.obtainedMarks10 || 'N/A'}</td>
                      <td className="px-3 py-2.5 text-right font-black text-brand-600">{student.marks10 ? `${student.marks10}%` : 'N/A'}</td>
                    </tr>
                    {/* 12th */}
                    <tr>
                      <td className="px-3 py-2.5 font-bold border-r border-warm-200 dark:border-darkbg-border">12th Sr. Secondary</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.board12 || 'RBSE / CBSE'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.passingYear12 || 'N/A'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.subject12 || 'Arts / Science / Commerce'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.maxMarks12 || '500'}</td>
                      <td className="px-3 py-2.5 border-r border-warm-200 dark:border-darkbg-border">{student.obtainedMarks12 || 'N/A'}</td>
                      <td className="px-3 py-2.5 text-right font-black text-brand-600">{student.marks12 ? `${student.marks12}%` : 'N/A'}</td>
                    </tr>
                    {/* Graduation (if applicable) */}
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

                      {/* Marks Summary */}
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>Total Marks: <strong>{res.totalObtained} / {res.totalMax}</strong></span>
                        <span>Percentage: <strong>{res.percentage}%</strong></span>
                        <span>Declared Date: <strong>{res.declaredDate || new Date(res.createdAt).toLocaleDateString()}</strong></span>
                      </div>

                      {/* Subject-Wise breakdown if available */}
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

          {/* Official Sign Box for Printing */}
          <div className="hidden print:grid grid-cols-3 gap-6 pt-16 text-center text-xs font-bold text-slate-800">
            <div className="border-t border-slate-400 pt-2">ERP Data Clerk</div>
            <div className="border-t border-slate-400 pt-2">Administrative Officer</div>
            <div className="border-t border-slate-400 pt-2">Principal Approval & Seal</div>
          </div>

        </div>
      )}
    </div>
  );
};

export default StudentDossier;
