import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Printer, Download, FileSpreadsheet, Filter, 
  Calendar, BookOpen, Layers, CheckCircle2, Users, 
  ArrowUpDown, RefreshCw, Eye, SlidersHorizontal, CheckSquare, Square
} from 'lucide-react';
import * as XLSX from 'xlsx';
import PrintHeader from './print/PrintHeader';
import PrintFooter from './print/PrintFooter';

const PrintStudentListModal = ({
  isOpen,
  onClose,
  initialSession = '2024-25',
  availableSessions = [],
  courses = []
}) => {
  const printRef = useRef(null);

  // Filter States
  const [session, setSession] = useState(initialSession);
  const [course, setCourse] = useState('All');
  const [academicYear, setAcademicYear] = useState('All');
  const [semester, setSemester] = useState('All');
  const [category, setCategory] = useState('All');
  const [gender, setGender] = useState('All');
  const [sortBy, setSortBy] = useState('accNo_asc');
  
  // Customization Options
  const [includeSignature, setIncludeSignature] = useState(true);
  const [includeDueDocs, setIncludeDueDocs] = useState(true);
  const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'

  // Data States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Update session if initialSession changes
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [initialSession]);

  // Fetch students based on filters
  const fetchStudentsForPrint = async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('token');
    try {
      const params = new URLSearchParams();
      if (session && session !== 'All' && session !== 'All Sessions') params.append('session', session);
      if (course && course !== 'All' && course !== 'All Courses') params.append('course', course);
      if (academicYear && academicYear !== 'All' && academicYear !== 'All Years') params.append('academicYear', academicYear);
      if (semester && semester !== 'All' && semester !== 'All Semesters') params.append('semester', semester);
      if (category && category !== 'All' && category !== 'All Categories') params.append('category', category);
      if (gender && gender !== 'All') params.append('gender', gender);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('all', 'true');
      params.append('limit', '5000');

      const res = await fetch(`/api/students?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
      } else {
        setError(data.message || 'Failed to load students');
      }
    } catch (err) {
      setError('Server connection error while fetching students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStudentsForPrint();
    }
  }, [isOpen, session, course, academicYear, semester, category, gender, sortBy]);

  if (!isOpen) return null;

  // Handle direct browser print
  const handlePrint = () => {
    window.print();
  };

  // Export exact filtered student list to Excel
  const handleExportExcel = () => {
    if (students.length === 0) return;
    const excelData = students.map((s, idx) => ({
      'S.No.': idx + 1,
      'A/C No.': s.studentAccNo || s.srNo || '',
      'Registration No.': s.registrationId || '',
      'Student Name': s.fullName || '',
      "Father's Name": s.fatherName || '',
      "Mother's Name": s.motherName || '',
      'Gender': s.gender || '',
      'Category': s.category || '',
      'Mobile / Contact': s.mobileNumber || '',
      'WhatsApp No.': s.whatsAppNo || s.mobileNumber || '',
      'Email ID': s.email || '',
      'Academic Session': s.academicSession || session,
      'Course Applied': s.courseApplied || '',
      'Academic Year': s.currentYear || s.academicYear || '',
      'Semester': s.currentSemester || s.semester || '',
      'Admission Base': s.admissionBase || '',
      'Qualifying Exam': s.qualExamName || s.gradSubject || '',
      'University': s.qualUniversity || s.gradUniversity || '',
      'Passing Year': s.qualYear || s.gradYear || '',
      'Percentage (%)': s.qualPercentage || s.gradPercentage || '',
      'Pending Documents': s.verificationRemarks || ''
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Master List');
    const safeSem = (semester === 'All' ? 'All_Semesters' : semester).replace(/[^a-zA-Z0-9]/g, '_');
    const safeSess = session.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Student_List_${safeSess}_${safeSem}.xlsx`);
  };

  // Demographic Statistics
  const totalCount = students.length;
  const maleCount = students.filter(s => String(s.gender).toLowerCase() === 'male').length;
  const femaleCount = students.filter(s => String(s.gender).toLowerCase() === 'female').length;
  const genCount = students.filter(s => String(s.category).toLowerCase().includes('gen')).length;
  const obcCount = students.filter(s => String(s.category).toLowerCase().includes('obc')).length;
  const scCount = students.filter(s => String(s.category).toLowerCase().includes('sc')).length;
  const stCount = students.filter(s => String(s.category).toLowerCase().includes('st')).length;
  const ewsCount = students.filter(s => String(s.category).toLowerCase().includes('ews')).length;

  const displaySemesterTitle = semester === 'All' || semester === 'All Semesters' 
    ? 'ALL SEMESTERS (COMPLETE BATCH)' 
    : semester.toUpperCase();

  const displayCourseTitle = course === 'All' || course === 'All Courses'
    ? 'ALL COURSES'
    : course.toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      
      {/* Dynamic Print CSS for Landscape / Portrait */}
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 8mm 8mm;
          }
          body {
            font-size: 9.5px !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .student-print-table th, .student-print-table td {
            border: 1px solid #334155 !important;
            padding: 3px 5px !important;
            font-size: 9px !important;
          }
          .student-print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
          }
        }
      `}</style>

      {/* Main Modal Shell */}
      <div className="bg-white dark:bg-darkbg-surface w-full max-w-7xl rounded-2xl shadow-2xl border border-warm-200 dark:border-darkbg-border flex flex-col max-h-[96vh] overflow-hidden">
        
        {/* ─── MODAL HEADER & CONTROLS (Hidden on Print) ─── */}
        <div className="px-5 py-3.5 border-b border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base no-print flex flex-col gap-3">
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 rounded-xl">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-warm-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Semester-wise Student List Print & Export</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300">
                    {totalCount} Students Ready
                  </span>
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  Official Institutional Master Student Roll with MGSU/ALU College Header, Signatures, and Full Details
                </p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={students.length === 0}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                title="Download this exact student list to Excel (.xlsx)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={students.length === 0}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-1.5 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document (A4)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-darkbg-border rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── FILTER BAR ─── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-2 border-t border-warm-200/60 dark:border-darkbg-border">
            
            {/* Session Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-2.5 h-2.5" />
                <span>Academic Session</span>
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-bold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="All Sessions">All Sessions</option>
                {Array.from(new Set([
                  '2024-25',
                  '2025-26',
                  '2023-24',
                  '2026-27',
                  ...(availableSessions || []).filter(s => s !== 'All Sessions')
                ])).map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Course Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <BookOpen className="w-2.5 h-2.5" />
                <span>Course</span>
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="All">All Courses</option>
                <option value="Bachelor of Laws (L.L.B.)">Bachelor of Laws (L.L.B.)</option>
                <option value="B.A. L.L.B. Integrated">B.A. L.L.B. Integrated</option>
                <option value="Master of Laws (L.L.M.)">Master of Laws (L.L.M.)</option>
                {courses.map(c => (
                  <option key={c.code} value={c.code}>{c.code}</option>
                ))}
              </select>
            </div>

            {/* Semester Filter (KEY USER REQUIREMENT) */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[9.5px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                <Layers className="w-2.5 h-2.5" />
                <span>Semester / Term *</span>
              </label>
              <select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                className="px-2 py-1.5 rounded-lg border-2 border-indigo-400 dark:border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/20 text-xs font-black text-indigo-900 dark:text-indigo-200 outline-none"
              >
                <option value="All">All Semesters (Whole Session List)</option>
                <option value="I & II Semester">I & II Semester (1st Year)</option>
                <option value="1st Sem">1st Semester / Sem I</option>
                <option value="2nd Sem">2nd Semester / Sem II</option>
                <option value="3rd Sem">3rd Semester / Sem III</option>
                <option value="4th Sem">4th Semester / Sem IV</option>
                <option value="5th Sem">5th Semester / Sem V</option>
                <option value="6th Sem">6th Semester / Sem VI</option>
                <option value="Annual">Annual Exam</option>
              </select>
            </div>

            {/* Academic Year Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">Year</label>
              <select
                value={academicYear}
                onChange={(e) => setAcademicYear(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="All">All Years</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
                <option value="5th Year">5th Year</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-medium text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="All">All Categories</option>
                <option value="General">General</option>
                <option value="OBC">OBC</option>
                <option value="SC">SC</option>
                <option value="ST">ST</option>
                <option value="EWS">EWS</option>
                <option value="MBC">MBC</option>
              </select>
            </div>

            {/* Sort By Filter */}
            <div className="flex flex-col space-y-0.5">
              <label className="text-[9.5px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpDown className="w-2.5 h-2.5" />
                <span>Sort By</span>
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-2 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none"
              >
                <option value="accNo_asc">A/C No. (1001, 1002...)</option>
                <option value="name_asc">Student Name (A-Z)</option>
                <option value="regId_asc">Registration ID</option>
                <option value="srNo_asc">S.No. (1, 2, 3...)</option>
              </select>
            </div>

            {/* Layout Options */}
            <div className="flex flex-col justify-end space-y-1">
              <div className="flex items-center gap-3">
                <label className="flex items-center space-x-1 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={includeSignature}
                    onChange={(e) => setIncludeSignature(e.target.checked)}
                    className="rounded text-indigo-600"
                  />
                  <span>Sign Box</span>
                </label>

                <label className="flex items-center space-x-1 cursor-pointer text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={orientation === 'landscape'}
                    onChange={(e) => setOrientation(e.target.checked ? 'landscape' : 'portrait')}
                    className="rounded text-indigo-600"
                  />
                  <span>Landscape</span>
                </label>
              </div>
            </div>

          </div>

        </div>

        {/* ─── PRINTABLE DOCUMENT PREVIEW AREA ─── */}
        <div 
          ref={printRef}
          className="flex-1 overflow-y-auto p-4 sm:p-6 bg-white text-slate-900 select-text"
          id="printable-student-list"
        >
          {loading ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading student registry for printing...</p>
            </div>
          ) : error ? (
            <div className="py-20 text-center text-rose-500 font-bold text-xs">
              {error}
            </div>
          ) : students.length === 0 ? (
            <div className="py-24 text-center text-slate-400 text-xs">
              No students found matching the selected session ({session}), course, and semester criteria.
            </div>
          ) : (
            <div className="w-full">
              
              {/* ─── Institutional Header ─── */}
              <PrintHeader 
                title="SEMESTER-WISE STUDENT ENROLLMENT & ROLL MASTER LIST"
                subtitle={`ACADEMIC SESSION: ${session} • COURSE: ${displayCourseTitle} • SEMESTER: ${displaySemesterTitle}`}
                collegeName="B.J.S. RAMPURIA JAIN LAW COLLEGE"
                affiliation="Affiliated to Maharaja Ganga Singh University (MGSU) & Dr. Bhimrao Ambedkar Law University (ALU) • Approved by Bar Council of India (BCI)"
                address="Near Fort, Bikaner - 334001 (Rajasthan) | Phone: 0151-2200115 | Email: info@rampurialaw.com"
                extraMeta={[
                  { label: 'Total Enrolled', value: `${totalCount} Candidates` },
                  { label: 'Semester Mode', value: semester === 'All' ? 'All Semesters Together' : semester },
                  { label: 'Category Summary', value: `GEN: ${genCount} | OBC: ${obcCount} | SC: ${scCount} | ST: ${stCount} | EWS: ${ewsCount}` },
                  { label: 'Gender Ratio', value: `Male: ${maleCount} | Female: ${femaleCount}` }
                ]}
              />

              {/* ─── Main Student Master Table ─── */}
              <div className="w-full overflow-x-auto mt-2">
                <table className="student-print-table w-full border-collapse text-[10px] font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border border-slate-900">
                      <th className="w-8 py-2 px-1 text-center font-black">#</th>
                      <th className="w-14 py-2 px-1.5 text-center font-black whitespace-nowrap">A/C No.</th>
                      <th className="w-20 py-2 px-1.5 text-left font-black whitespace-nowrap">Reg. No.</th>
                      <th className="py-2 px-2 text-left font-black">Student's Full Name</th>
                      <th className="py-2 px-2 text-left font-black">Father's Name</th>
                      <th className="py-2 px-2 text-left font-black">Mother's Name</th>
                      <th className="w-8 py-2 px-1 text-center font-black">Sex</th>
                      <th className="w-12 py-2 px-1 text-center font-black">Cat.</th>
                      <th className="w-24 py-2 px-1.5 text-left font-black whitespace-nowrap">Mobile / WhatsApp</th>
                      <th className="w-20 py-2 px-1.5 text-center font-black whitespace-nowrap">Sem / Year</th>
                      <th className="py-2 px-2 text-left font-black">Qualifying Degree / Exam</th>
                      {includeDueDocs && (
                        <th className="py-2 px-2 text-left font-black">Pending Docs / Remarks</th>
                      )}
                      {includeSignature && (
                        <th className="w-24 py-2 px-1.5 text-center font-black">Student Signature</th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {students.map((st, idx) => {
                      const accNo = st.studentAccNo || st.srNo || '-';
                      const regId = st.registrationId || '-';
                      const semText = st.currentSemester || st.semester || (st.currentYear ? `${st.currentYear}` : '1st Sem');
                      const qualInfo = [
                        st.qualExamName || st.gradSubject,
                        st.qualUniversity || st.gradUniversity ? `(${st.qualUniversity || st.gradUniversity})` : null,
                        st.qualPercentage || st.gradPercentage ? `${st.qualPercentage || st.gradPercentage}%` : null
                      ].filter(Boolean).join(' ');

                      const remarksText = st.verificationRemarks 
                        ? st.verificationRemarks.replace('Imported via Excel Batch Import', '').trim() 
                        : '';

                      return (
                        <tr 
                          key={st._id || idx} 
                          className="hover:bg-slate-50 even:bg-slate-50/60 border-b border-slate-300 print:break-inside-avoid"
                        >
                          <td className="py-1 px-1 text-center font-mono font-semibold text-slate-500">
                            {idx + 1}
                          </td>
                          <td className="py-1 px-1.5 text-center font-mono font-black text-slate-950">
                            {accNo}
                          </td>
                          <td className="py-1 px-1.5 text-left font-mono font-bold text-slate-700 whitespace-nowrap">
                            {regId}
                          </td>
                          <td className="py-1 px-2 font-black text-slate-950 uppercase tracking-tight">
                            {st.fullName}
                          </td>
                          <td className="py-1 px-2 font-medium text-slate-800">
                            {st.fatherName || '-'}
                          </td>
                          <td className="py-1 px-2 font-medium text-slate-700">
                            {st.motherName || '-'}
                          </td>
                          <td className="py-1 px-1 text-center font-bold text-slate-800">
                            {String(st.gender).toLowerCase().startsWith('f') ? 'F' : 'M'}
                          </td>
                          <td className="py-1 px-1 text-center font-bold text-slate-800">
                            <span className="px-1 py-0.5 rounded text-[9px] font-black bg-slate-200/80">
                              {st.category || 'GEN'}
                            </span>
                          </td>
                          <td className="py-1 px-1.5 font-mono text-slate-800 whitespace-nowrap">
                            {st.whatsAppNo || st.mobileNumber || '-'}
                          </td>
                          <td className="py-1 px-1.5 text-center font-semibold text-slate-700 whitespace-nowrap">
                            {semText}
                          </td>
                          <td className="py-1 px-2 text-slate-800 font-medium">
                            {qualInfo || st.admissionBase || 'UG'}
                          </td>
                          {includeDueDocs && (
                            <td className="py-1 px-2 text-[8.5px] text-slate-600 italic">
                              {remarksText || '-'}
                            </td>
                          )}
                          {includeSignature && (
                            <td className="py-1 px-1.5 text-center">
                              <div className="h-6 border-b border-dashed border-slate-400 w-full" />
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* ─── Summary Count Strip ─── */}
              <div className="mt-3 p-2 bg-slate-100 border border-slate-300 rounded flex flex-wrap items-center justify-between text-[9.5px] font-bold text-slate-800 gap-2">
                <div>
                  <strong>Total Records Printed:</strong> {totalCount} Students 
                  <span className="ml-2 font-normal text-slate-600">(Male: {maleCount}, Female: {femaleCount})</span>
                </div>
                <div>
                  <strong>Category Breakdown:</strong> GEN: {genCount} | OBC: {obcCount} | SC: {scCount} | ST: {stCount} | EWS: {ewsCount}
                </div>
              </div>

              {/* ─── Institutional 3-Tier Footer ─── */}
              <PrintFooter 
                showSignatures={true}
                signatories={[
                  { title: 'Dealing Assistant / Clerk', subtitle: 'Prepared By' },
                  { title: 'In-Charge / Accounts Officer', subtitle: 'Verified By' },
                  { title: 'Principal / Authorized Signatory', subtitle: 'Approved & Sealed' }
                ]}
                customNote="This is an official computer-generated student master roll certified from Pankh Gold College Management ERP."
              />

            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER (Hidden on Print) ─── */}
        <div className="px-5 py-3 border-t border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base/50 no-print flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Viewing {students.length} students for <strong>{session}</strong> ({semester === 'All' ? 'All Semesters' : semester})
          </span>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-warm-100 hover:bg-warm-200 dark:bg-darkbg-base dark:text-slate-200 rounded-xl text-xs font-bold"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              disabled={students.length === 0}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Student List</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default PrintStudentListModal;
