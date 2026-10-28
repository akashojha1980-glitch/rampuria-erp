import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Printer, Download, FileSpreadsheet, Filter, 
  Calendar, BookOpen, Layers, CheckCircle2, Users, 
  ArrowUpDown, RefreshCw, SlidersHorizontal, CheckSquare, Square,
  Settings, Check, Eye, ChevronRight, FileText, Sparkles,
  Search, Shield, CheckCheck, RotateCcw, GraduationCap
} from 'lucide-react';
import * as XLSX from 'xlsx';
import PrintHeader from './print/PrintHeader';
import PrintFooter from './print/PrintFooter';

// ─── MASTER COLUMN DEFINITIONS (ALL STUDENT DETAILS) ───
const ALL_COLUMNS = [
  { 
    id: 'sNo', 
    label: 'S.No.', 
    hindi: 'क्र.सं.', 
    width: 'w-8', 
    align: 'text-center',
    headerClass: 'text-center',
    cellClass: 'text-center font-mono font-semibold text-slate-500',
    render: (s, idx) => idx + 1,
    exportHeader: 'S.No.',
    exportVal: (s, idx) => idx + 1
  },
  { 
    id: 'accNo', 
    label: 'A/C No.', 
    hindi: 'खाता संख्या / Roll No.', 
    width: 'w-14', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-mono font-black text-slate-950',
    render: (s) => s.studentAccNo || s.srNo || '-',
    exportHeader: 'A/C No.',
    exportVal: (s) => s.studentAccNo || s.srNo || ''
  },
  { 
    id: 'regNo', 
    label: 'Reg. No.', 
    hindi: 'पंजीकरण क्रमांक', 
    width: 'w-24', 
    align: 'text-left',
    headerClass: 'text-left whitespace-nowrap',
    cellClass: 'text-left font-mono font-bold text-slate-700 whitespace-nowrap',
    render: (s) => s.registrationId || '-',
    exportHeader: 'Registration No.',
    exportVal: (s) => s.registrationId || ''
  },
  { 
    id: 'formNo', 
    label: 'Form No.', 
    hindi: 'आवेदन फार्म सं.', 
    width: 'w-16', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-mono text-slate-700',
    render: (s) => s.formNo || '-',
    exportHeader: 'Form No.',
    exportVal: (s) => s.formNo || ''
  },
  { 
    id: 'fullName', 
    label: "Student's Full Name", 
    hindi: 'विद्यार्थी का नाम', 
    width: 'min-w-[130px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left font-black text-slate-950 uppercase tracking-tight',
    render: (s) => s.fullName || '-',
    exportHeader: "Student's Full Name",
    exportVal: (s) => s.fullName || ''
  },
  { 
    id: 'fatherName', 
    label: "Father's Name", 
    hindi: 'पिता का नाम', 
    width: 'min-w-[120px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left font-medium text-slate-800',
    render: (s) => s.fatherName || '-',
    exportHeader: "Father's Name",
    exportVal: (s) => s.fatherName || ''
  },
  { 
    id: 'motherName', 
    label: "Mother's Name", 
    hindi: 'माता का नाम', 
    width: 'min-w-[110px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left font-medium text-slate-700',
    render: (s) => s.motherName || '-',
    exportHeader: "Mother's Name",
    exportVal: (s) => s.motherName || ''
  },
  { 
    id: 'gender', 
    label: 'Sex', 
    hindi: 'लिंग (M/F)', 
    width: 'w-8', 
    align: 'text-center',
    headerClass: 'text-center',
    cellClass: 'text-center font-bold text-slate-800',
    render: (s) => (String(s.gender || '').toLowerCase().startsWith('f') ? 'F' : 'M'),
    exportHeader: 'Gender',
    exportVal: (s) => s.gender || ''
  },
  { 
    id: 'category', 
    label: 'Cat.', 
    hindi: 'वर्ग (GEN/OBC/SC/ST/EWS)', 
    width: 'w-12', 
    align: 'text-center',
    headerClass: 'text-center',
    cellClass: 'text-center font-bold text-slate-800',
    render: (s) => (
      <span className="px-1 py-0.5 rounded text-[9px] font-black bg-slate-200/80">
        {s.category || 'GEN'}
      </span>
    ),
    exportHeader: 'Category',
    exportVal: (s) => s.category || 'GEN'
  },
  { 
    id: 'dob', 
    label: 'D.O.B.', 
    hindi: 'जन्म तिथि', 
    width: 'w-20', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-mono text-slate-700 whitespace-nowrap',
    render: (s) => (s.dateOfBirth ? (s.dateOfBirth.split('T')[0] || s.dateOfBirth) : '-'),
    exportHeader: 'Date of Birth',
    exportVal: (s) => (s.dateOfBirth ? (s.dateOfBirth.split('T')[0] || s.dateOfBirth) : '')
  },
  { 
    id: 'mobile', 
    label: 'Mobile No.', 
    hindi: 'मोबाइल नंबर', 
    width: 'w-24', 
    align: 'text-left',
    headerClass: 'text-left whitespace-nowrap',
    cellClass: 'text-left font-mono text-slate-800 whitespace-nowrap',
    render: (s) => s.mobileNumber || '-',
    exportHeader: 'Mobile No.',
    exportVal: (s) => s.mobileNumber || ''
  },
  { 
    id: 'whatsApp', 
    label: 'WhatsApp No.', 
    hindi: 'व्हाट्सएप नंबर', 
    width: 'w-24', 
    align: 'text-left',
    headerClass: 'text-left whitespace-nowrap',
    cellClass: 'text-left font-mono text-slate-800 whitespace-nowrap',
    render: (s) => s.whatsAppNo || s.mobileNumber || '-',
    exportHeader: 'WhatsApp No.',
    exportVal: (s) => s.whatsAppNo || s.mobileNumber || ''
  },
  { 
    id: 'email', 
    label: 'Email ID', 
    hindi: 'ईमेल पता', 
    width: 'min-w-[140px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left font-mono text-slate-700 truncate max-w-[150px]',
    render: (s) => s.email || '-',
    exportHeader: 'Email ID',
    exportVal: (s) => s.email || ''
  },
  { 
    id: 'session', 
    label: 'Session', 
    hindi: 'सत्र / बैच', 
    width: 'w-16', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-semibold text-slate-700 whitespace-nowrap',
    render: (s) => s.academicSession || '-',
    exportHeader: 'Session',
    exportVal: (s) => s.academicSession || ''
  },
  { 
    id: 'course', 
    label: 'Course', 
    hindi: 'पाठ्यक्रम', 
    width: 'min-w-[110px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left font-semibold text-slate-800',
    render: (s) => s.courseApplied || '-',
    exportHeader: 'Course',
    exportVal: (s) => s.courseApplied || ''
  },
  { 
    id: 'year', 
    label: 'Year', 
    hindi: 'अकादमिक वर्ष (1st/2nd/3rd)', 
    width: 'w-16', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-semibold text-slate-700 whitespace-nowrap',
    render: (s) => s.currentYear || s.academicYear || '-',
    exportHeader: 'Year',
    exportVal: (s) => s.currentYear || s.academicYear || ''
  },
  { 
    id: 'semester', 
    label: 'Sem / Term', 
    hindi: 'सेमेस्टर / टर्म', 
    width: 'w-20', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-semibold text-slate-700 whitespace-nowrap',
    render: (s) => s.currentSemester || s.semester || (s.currentYear ? `${s.currentYear}` : '1st Sem'),
    exportHeader: 'Semester',
    exportVal: (s) => s.currentSemester || s.semester || ''
  },
  { 
    id: 'admissionBase', 
    label: 'Adm. Base', 
    hindi: 'प्रवेश आधार (UG/PG)', 
    width: 'w-16', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-bold text-slate-800 uppercase',
    render: (s) => s.admissionBase || 'UG',
    exportHeader: 'Admission Base',
    exportVal: (s) => s.admissionBase || 'UG'
  },
  { 
    id: 'qualExam', 
    label: 'Qualifying Degree / Exam', 
    hindi: 'योग्यता परीक्षा / बोर्ड', 
    width: 'min-w-[130px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left text-slate-800 font-medium',
    render: (s) => {
      const parts = [
        s.qualExamName || s.gradSubject,
        s.qualUniversity || s.gradUniversity ? `(${s.qualUniversity || s.gradUniversity})` : null
      ].filter(Boolean);
      return parts.length ? parts.join(' ') : (s.admissionBase || 'UG');
    },
    exportHeader: 'Qualifying Degree / Exam',
    exportVal: (s) => `${s.qualExamName || s.gradSubject || ''} ${s.qualUniversity || s.gradUniversity || ''}`.trim()
  },
  { 
    id: 'percentage', 
    label: 'Qual. %', 
    hindi: 'प्राप्तांक प्रतिशत (%)', 
    width: 'w-14', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-mono font-bold text-slate-800',
    render: (s) => {
      const p = s.qualPercentage || s.gradPercentage;
      return p ? `${p}%` : '-';
    },
    exportHeader: 'Qualifying %',
    exportVal: (s) => s.qualPercentage || s.gradPercentage || ''
  },
  { 
    id: 'address', 
    label: 'Permanent Address', 
    hindi: 'स्थाई पता व शहर', 
    width: 'min-w-[140px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left text-slate-700 text-[8.5px]',
    render: (s) => s.permanentAddress || s.address || s.city || '-',
    exportHeader: 'Address',
    exportVal: (s) => s.permanentAddress || s.address || s.city || ''
  },
  { 
    id: 'aadharNo', 
    label: 'Aadhar No.', 
    hindi: 'आधार संख्या', 
    width: 'w-24', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-mono text-slate-800 whitespace-nowrap',
    render: (s) => s.aadharNo || '-',
    exportHeader: 'Aadhar No.',
    exportVal: (s) => s.aadharNo || ''
  },
  { 
    id: 'feeStatus', 
    label: 'Fee Status', 
    hindi: 'फीस व बकाया स्थिति', 
    width: 'w-20', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center font-semibold text-slate-800 whitespace-nowrap',
    render: (s) => {
      if (!s.feeSummary) return 'Pending';
      return s.feeSummary.isCleared 
        ? <span className="text-emerald-700 font-bold">Cleared</span>
        : (s.feeSummary.totalDue > 0 ? <span className="text-rose-600 font-bold">Due ₹{s.feeSummary.totalDue}</span> : 'Pending');
    },
    exportHeader: 'Fee Status',
    exportVal: (s) => (s.feeSummary?.isCleared ? 'Cleared' : `Due: ₹${s.feeSummary?.totalDue || 0}`)
  },
  { 
    id: 'remarks', 
    label: 'Pending Docs / Remarks', 
    hindi: 'बाकी दस्तावेज़ / टिप्पणी', 
    width: 'min-w-[120px]', 
    align: 'text-left',
    headerClass: 'text-left',
    cellClass: 'text-left text-[8.5px] text-slate-600 italic',
    render: (s) => {
      const r = s.verificationRemarks ? s.verificationRemarks.replace('Imported via Excel Batch Import', '').trim() : '';
      return r || '-';
    },
    exportHeader: 'Pending Docs / Remarks',
    exportVal: (s) => s.verificationRemarks || ''
  },
  { 
    id: 'signature', 
    label: 'Student Signature', 
    hindi: 'विद्यार्थी हस्ताक्षर बॉक्स', 
    width: 'w-24', 
    align: 'text-center',
    headerClass: 'text-center whitespace-nowrap',
    cellClass: 'text-center px-1',
    render: () => <div className="h-6 border-b border-dashed border-slate-400 w-full" />,
    exportHeader: 'Signature Box',
    exportVal: () => ''
  }
];

// ─── POPULAR QUICK PRESETS ───
const PRESETS = [
  {
    id: 'standard',
    title: 'Standard Master Roll',
    hindi: 'मानक मास्टर रोल (12 कॉलम)',
    columns: ['sNo', 'accNo', 'regNo', 'fullName', 'fatherName', 'motherName', 'gender', 'category', 'mobile', 'semester', 'qualExam', 'remarks', 'signature']
  },
  {
    id: 'attendance',
    title: 'Exam & Attendance Sheet',
    hindi: 'परीक्षा / उपस्थिति रोल',
    columns: ['sNo', 'accNo', 'fullName', 'fatherName', 'gender', 'category', 'mobile', 'semester', 'signature']
  },
  {
    id: 'academic',
    title: 'Academic & Qualifying Exam',
    hindi: 'शैक्षणिक योग्यता विस्तृत सूची',
    columns: ['sNo', 'accNo', 'fullName', 'fatherName', 'gender', 'category', 'course', 'year', 'semester', 'admissionBase', 'qualExam', 'percentage', 'remarks']
  },
  {
    id: 'contact',
    title: 'Contact & ID Directory',
    hindi: 'संपर्क व आधार सूची',
    columns: ['sNo', 'accNo', 'regNo', 'fullName', 'fatherName', 'mobile', 'whatsApp', 'email', 'address', 'aadharNo']
  },
  {
    id: 'fee',
    title: 'Fee Status & Dues Audit',
    hindi: 'शुल्क व बकाया सूची',
    columns: ['sNo', 'accNo', 'regNo', 'fullName', 'fatherName', 'mobile', 'course', 'semester', 'feeStatus', 'remarks']
  }
];

const DEFAULT_COLUMN_KEYS = PRESETS[0].columns;

const PrintStudentListModal = ({
  isOpen,
  onClose,
  initialSession = '2024-25',
  availableSessions = [],
  courses = []
}) => {
  const printRef = useRef(null);

  // Active Tab: 'filters' | 'columns'
  const [activeTab, setActiveTab] = useState('filters');
  const [columnSearch, setColumnSearch] = useState('');

  // Filter States
  const [session, setSession] = useState(initialSession);
  const [course, setCourse] = useState('All');
  const [academicYear, setAcademicYear] = useState('All');
  const [semester, setSemester] = useState('All');
  const [admissionBase, setAdmissionBase] = useState('All');
  const [category, setCategory] = useState('All');
  const [gender, setGender] = useState('All');
  const [sortBy, setSortBy] = useState('accNo_asc');
  
  // Customization & Column Selection States
  const [selectedColumnKeys, setSelectedColumnKeys] = useState(DEFAULT_COLUMN_KEYS);
  const [orientation, setOrientation] = useState('landscape'); // 'landscape' | 'portrait'
  const [fontSize, setFontSize] = useState('standard'); // 'compact' (8.5px) | 'standard' (9.5px) | 'large' (10.5px)
  const [showHeader, setShowHeader] = useState(true);
  const [showFooter, setShowFooter] = useState(true);
  const [showDemographics, setShowDemographics] = useState(true);

  // Data States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Prevent background scrolling while modal is open
  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Sync initialSession
  useEffect(() => {
    if (initialSession) {
      setSession(initialSession);
    }
  }, [initialSession]);

  // Fetch students based on filters with de-duplication
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
        const rawList = data.students || [];

        // ─── STRICT CLIENT-SIDE DEDUPLICATION ───
        const seen = new Set();
        const deduplicated = [];
        for (const st of rawList) {
          const uniqueKey = st.id || st._id || st.registrationId || `${st.fullName}_${st.studentAccNo}`;
          if (!seen.has(uniqueKey)) {
            seen.add(uniqueKey);
            if (admissionBase === 'All' || !admissionBase || String(st.admissionBase).toUpperCase() === admissionBase.toUpperCase()) {
              deduplicated.push(st);
            }
          }
        }

        setStudents(deduplicated);
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
  }, [isOpen, session, course, academicYear, semester, admissionBase, category, gender, sortBy]);

  if (!isOpen) return null;

  // Toggle individual column selection
  const handleToggleColumn = (colId) => {
    setSelectedColumnKeys(prev => {
      if (prev.includes(colId)) {
        if (prev.length === 1) return prev; // Keep at least one column
        return prev.filter(k => k !== colId);
      } else {
        return [...prev, colId];
      }
    });
  };

  // Quick preset apply
  const handleApplyPreset = (presetCols) => {
    setSelectedColumnKeys(presetCols);
  };

  // Select All Columns
  const handleSelectAllColumns = () => {
    setSelectedColumnKeys(ALL_COLUMNS.map(c => c.id));
  };

  // Reset to default
  const handleResetColumns = () => {
    setSelectedColumnKeys(DEFAULT_COLUMN_KEYS);
  };

  // Filtered active columns list
  const activeColumns = ALL_COLUMNS.filter(c => selectedColumnKeys.includes(c.id));

  // Search filtered column list for checklist
  const visibleCheckboxColumns = ALL_COLUMNS.filter(c => {
    if (!columnSearch.trim()) return true;
    const q = columnSearch.toLowerCase();
    return c.label.toLowerCase().includes(q) || c.hindi.toLowerCase().includes(q) || c.id.toLowerCase().includes(q);
  });

  // Handle direct browser print
  const handlePrint = () => {
    window.print();
  };

  // Export dynamically selected columns to Excel (.xlsx)
  const handleExportExcel = () => {
    if (students.length === 0) return;
    const excelData = students.map((s, idx) => {
      const row = {};
      activeColumns.forEach(col => {
        row[col.exportHeader] = col.exportVal(s, idx);
      });
      return row;
    });

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Roll List');
    const safeSem = (semester === 'All' ? 'All_Semesters' : semester).replace(/[^a-zA-Z0-9]/g, '_');
    const safeSess = session.replace(/[^a-zA-Z0-9]/g, '_');
    XLSX.writeFile(wb, `Student_Roll_${safeSess}_${safeSem}.xlsx`);
  };

  // Demographic Statistics
  const totalCount = students.length;
  const maleCount = students.filter(s => String(s.gender || '').toLowerCase().startsWith('m')).length;
  const femaleCount = students.filter(s => String(s.gender || '').toLowerCase().startsWith('f')).length;
  const genCount = students.filter(s => String(s.category || '').toUpperCase().includes('GEN')).length;
  const obcCount = students.filter(s => String(s.category || '').toUpperCase().includes('OBC')).length;
  const scCount = students.filter(s => String(s.category || '').toUpperCase().includes('SC')).length;
  const stCount = students.filter(s => String(s.category || '').toUpperCase().includes('ST')).length;
  const ewsCount = students.filter(s => String(s.category || '').toUpperCase().includes('EWS')).length;

  const displaySemesterTitle = semester === 'All' || semester === 'All Semesters' 
    ? 'ALL SEMESTERS (COMPLETE BATCH)' 
    : semester.toUpperCase();

  const displayCourseTitle = course === 'All' || course === 'All Courses'
    ? 'ALL COURSES'
    : course.toUpperCase();

  const printFontSizeClass = 
    fontSize === 'compact' ? 'text-[8px]' : fontSize === 'large' ? 'text-[10px]' : 'text-[9px]';

  // ─── MODAL DOM PORTAL (Mounts directly onto document.body above Sidebar & Header) ───
  const modalContent = (
    <div 
      id="print-modal-portal"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 md:p-6 bg-slate-950/85 backdrop-blur-md overflow-hidden animate-fade-in"
      onClick={(e) => {
        // Close if clicked directly on outer backdrop
        if (e.target.id === 'print-modal-portal') {
          onClose();
        }
      }}
    >
      
      {/* ─── DYNAMIC PRINT CSS FOR ZERO LEAKAGE & PERFECT A4 LAYOUT ─── */}
      <style>{`
        @media print {
          @page {
            size: A4 ${orientation};
            margin: 6mm 6mm;
          }
          #root {
            display: none !important;
          }
          html, body {
            background: #ffffff !important;
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: ${fontSize === 'compact' ? '8.5px' : fontSize === 'large' ? '10.5px' : '9.5px'} !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: visible !important;
          }
          #print-modal-portal {
            position: static !important;
            display: block !important;
            width: 100% !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            overflow: visible !important;
            z-index: auto !important;
          }
          #print-modal-container {
            box-shadow: none !important;
            border: none !important;
            width: 100% !important;
            max-width: 100% !important;
            height: auto !important;
            max-height: none !important;
            overflow: visible !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
          #printable-student-list {
            overflow: visible !important;
            padding: 0 !important;
            margin: 0 !important;
            background: #ffffff !important;
          }
          #printable-sheet {
            box-shadow: none !important;
            border: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .student-print-table th, .student-print-table td {
            border: 1px solid #334155 !important;
            padding: ${fontSize === 'compact' ? '2px 3px' : fontSize === 'large' ? '4px 6px' : '3px 4px'} !important;
            font-size: ${fontSize === 'compact' ? '8px' : fontSize === 'large' ? '10px' : '9px'} !important;
            line-height: 1.2 !important;
          }
          .student-print-table th {
            background-color: #f1f5f9 !important;
            color: #0f172a !important;
            font-weight: 800 !important;
            text-transform: uppercase !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          tr {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Main Modal Shell (Full Width & Clear Separation from Sidebar) */}
      <div 
        id="print-modal-container"
        className="bg-white dark:bg-[#121620] w-[98vw] max-w-7xl h-[94vh] max-h-[94vh] rounded-2xl shadow-2xl border border-slate-700/30 dark:border-darkbg-border flex flex-col overflow-hidden relative"
      >
        
        {/* ─── MODAL HEADER & CONTROLS (Hidden on Print) ─── */}
        <div className="px-5 py-3 border-b border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base no-print flex flex-col gap-2 shrink-0">
          
          {/* Top Row: Title, Badges, Action Buttons */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-warm-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <span>Student List Print & Customization Hub</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/60 dark:text-indigo-300">
                    {totalCount} Students Ready
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                    {activeColumns.length} / {ALL_COLUMNS.length} Columns
                  </span>
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Official Institutional Master Student Roll with MGSU-104 Header, Filters & Column Customization
                </p>
              </div>
            </div>

            {/* Quick Actions (Export Excel, Direct Print, Close) */}
            <div className="flex items-center space-x-2.5">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={students.length === 0}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5 active:scale-95"
                title="Download selected columns to Excel (.xlsx)"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Export Excel</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                disabled={students.length === 0}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center space-x-2 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Document (A4)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-warm-100 dark:hover:bg-darkbg-border rounded-xl transition-all"
                title="Close (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ─── TAB SWITCHER (Filters vs Columns) ─── */}
          <div className="flex items-center justify-between border-b border-warm-200/80 dark:border-darkbg-border pt-1">
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setActiveTab('filters')}
                className={`px-4 py-1.5 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-b-2 ${
                  activeTab === 'filters'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-darkbg-surface shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>1. Filters (सत्र, वर्ष, सेमेस्टर व अन्य फ़िल्टर)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('columns')}
                className={`px-4 py-1.5 text-xs font-bold rounded-t-lg transition-all flex items-center space-x-1.5 border-b-2 ${
                  activeTab === 'columns'
                    ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 bg-white dark:bg-darkbg-surface shadow-xs'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>2. Included Details & Print Options (कॉलम चुनें एवं प्रिंट विकल्प)</span>
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-indigo-100 text-indigo-800 font-bold">
                  {activeColumns.length}
                </span>
              </button>
            </div>

            {/* Live Indicator */}
            <div className="hidden md:flex items-center space-x-3 text-[11px] text-slate-500 font-bold">
              <span>Layout: <strong className="text-indigo-600 uppercase">{orientation}</strong></span>
              <span>•</span>
              <span>Font: <strong className="text-indigo-600 uppercase">{fontSize}</strong></span>
            </div>
          </div>

          {/* ─── TAB 1: SPACIOUS 2-ROW FILTERS VIEW (Full Readability, No Truncation) ─── */}
          {activeTab === 'filters' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2 animate-fade-in">
              
              {/* 1. Session Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  <span>Academic Session / Batch</span>
                </label>
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-bold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All Sessions">All Sessions (सभी सत्र)</option>
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

              {/* 2. Course Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <BookOpen className="w-3 h-3 text-indigo-500" />
                  <span>Course Applied</span>
                </label>
                <select
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Courses (सभी पाठ्यक्रम)</option>
                  <option value="Bachelor of Laws (L.L.B.)">Bachelor of Laws (L.L.B.)</option>
                  <option value="B.A. L.L.B. Integrated">B.A. L.L.B. Integrated</option>
                  <option value="Master of Laws (L.L.M.)">Master of Laws (L.L.M.)</option>
                  {courses.map(c => (
                    <option key={c.code} value={c.code}>{c.code}</option>
                  ))}
                </select>
              </div>

              {/* 3. Semester Filter (KEY USER REQUIREMENT) */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Layers className="w-3 h-3 text-indigo-600" />
                  <span>Semester / Term *</span>
                </label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border-2 border-indigo-400 dark:border-indigo-500 bg-indigo-50/70 dark:bg-indigo-950/30 text-xs font-black text-indigo-950 dark:text-indigo-200 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="All">All Semesters (सम्पूर्ण सत्र सूची)</option>
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

              {/* 4. Academic Year Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-indigo-500" />
                  <span>Academic Year</span>
                </label>
                <select
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Years (सभी वर्ष)</option>
                  <option value="1st Year">1st Year (प्रथम वर्ष)</option>
                  <option value="2nd Year">2nd Year (द्वितीय वर्ष)</option>
                  <option value="3rd Year">3rd Year (तृतीय वर्ष)</option>
                  <option value="4th Year">4th Year (चतुर्थ वर्ष)</option>
                  <option value="5th Year">5th Year (पंचम वर्ष)</option>
                </select>
              </div>

              {/* 5. Admission Base Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Admission Base</label>
                <select
                  value={admissionBase}
                  onChange={(e) => setAdmissionBase(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Bases (UG / PG / Direct)</option>
                  <option value="UG">UG Merit (स्नातक आधार)</option>
                  <option value="PG">PG Merit (स्नातकोत्तर)</option>
                  <option value="Entrance">Entrance Exam</option>
                  <option value="Direct">Direct / Management</option>
                </select>
              </div>

              {/* 6. Category Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Categories (सभी वर्ग)</option>
                  <option value="General">General</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                  <option value="EWS">EWS</option>
                  <option value="MBC">MBC</option>
                </select>
              </div>

              {/* 7. Gender Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Gender</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="All">All Genders (सभी)</option>
                  <option value="Male">Male (पुरुष)</option>
                  <option value="Female">Female (महिला)</option>
                </select>
              </div>

              {/* 8. Sort By Filter */}
              <div className="flex flex-col space-y-0.5">
                <label className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ArrowUpDown className="w-3 h-3 text-indigo-500" />
                  <span>Sort Order</span>
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface text-xs font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <option value="accNo_asc">A/C No. (1001, 1002...)</option>
                  <option value="name_asc">Student Name (A-Z)</option>
                  <option value="regId_asc">Registration ID</option>
                  <option value="srNo_asc">S.No. (1, 2, 3...)</option>
                </select>
              </div>

            </div>
          )}

          {/* ─── TAB 2: INCLUDED DETAILS & PRINT OPTIONS VIEW ─── */}
          {activeTab === 'columns' && (
            <div className="flex flex-col space-y-2.5 pt-1 animate-fade-in">
              
              {/* Presets and Quick Toggles */}
              <div className="flex flex-wrap items-center justify-between gap-2 bg-white dark:bg-darkbg-surface p-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border shadow-xs">
                
                {/* Left: Presets */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider mr-1">Presets:</span>
                  {PRESETS.map(p => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handleApplyPreset(p.columns)}
                      className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 transition-all active:scale-95 flex items-center gap-1"
                      title={p.hindi}
                    >
                      <Sparkles className="w-3 h-3 text-indigo-500" />
                      <span>{p.title}</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={handleSelectAllColumns}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-darkbg-base text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all"
                  >
                    Select All ({ALL_COLUMNS.length})
                  </button>
                  <button
                    type="button"
                    onClick={handleResetColumns}
                    className="px-2.5 py-1 text-[10px] font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-darkbg-base text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-all flex items-center gap-1"
                  >
                    <RotateCcw className="w-2.5 h-2.5" />
                    <span>Reset Default</span>
                  </button>
                </div>

                {/* Right: Print Formatting Toggles */}
                <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-slate-700 dark:text-slate-300">
                  
                  {/* Orientation */}
                  <div className="flex items-center space-x-1">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Orientation:</span>
                    <button
                      type="button"
                      onClick={() => setOrientation('landscape')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                        orientation === 'landscape' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Landscape
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('portrait')}
                      className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all ${
                        orientation === 'portrait' ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      Portrait
                    </button>
                  </div>

                  {/* Font Size */}
                  <div className="flex items-center space-x-1 border-l border-slate-300 dark:border-slate-700 pl-3">
                    <span className="text-[10px] text-slate-500 uppercase font-black">Font:</span>
                    <select
                      value={fontSize}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="px-2 py-0.5 rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkbg-surface text-[10px] font-bold outline-none"
                    >
                      <option value="compact">Compact (8.5px)</option>
                      <option value="standard">Standard (9.5px)</option>
                      <option value="large">Large (10.5px)</option>
                    </select>
                  </div>

                  {/* Header & Signatures */}
                  <div className="flex items-center space-x-2.5 border-l border-slate-300 dark:border-slate-700 pl-3">
                    <label className="flex items-center space-x-1 cursor-pointer text-[10px]">
                      <input 
                        type="checkbox" 
                        checked={showHeader} 
                        onChange={(e) => setShowHeader(e.target.checked)} 
                        className="rounded text-indigo-600"
                      />
                      <span>College Header</span>
                    </label>

                    <label className="flex items-center space-x-1 cursor-pointer text-[10px]">
                      <input 
                        type="checkbox" 
                        checked={showFooter} 
                        onChange={(e) => setShowFooter(e.target.checked)} 
                        className="rounded text-indigo-600"
                      />
                      <span>Signatures</span>
                    </label>
                  </div>

                </div>

              </div>

              {/* Column Search Filter */}
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-600 dark:text-slate-400">
                  Check/uncheck columns to include or exclude from print:
                </span>
                <div className="relative w-56">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-400" />
                  <input
                    type="text"
                    value={columnSearch}
                    onChange={(e) => setColumnSearch(e.target.value)}
                    placeholder="Search column name..."
                    className="w-full pl-8 pr-2 py-1 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-darkbg-surface outline-none"
                  />
                </div>
              </div>

              {/* Column Checkboxes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-44 overflow-y-auto p-1.5 bg-slate-50 dark:bg-darkbg-base/40 rounded-xl border border-warm-200/60 dark:border-darkbg-border">
                {visibleCheckboxColumns.map(col => {
                  const isChecked = selectedColumnKeys.includes(col.id);
                  return (
                    <div
                      key={col.id}
                      onClick={() => handleToggleColumn(col.id)}
                      className={`flex items-start space-x-2 p-1.5 rounded-lg border cursor-pointer select-none transition-all ${
                        isChecked 
                          ? 'bg-indigo-50/90 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-xs' 
                          : 'bg-white dark:bg-darkbg-surface border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="mt-0.5 text-indigo-600">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 fill-indigo-100" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-[11px] font-black truncate leading-tight ${isChecked ? 'text-indigo-950 dark:text-indigo-200' : 'text-slate-600 dark:text-slate-400'}`}>
                          {col.label}
                        </span>
                        <span className="text-[9px] text-slate-500 font-medium truncate leading-none mt-0.5">
                          {col.hindi}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

        </div>

        {/* ─── PRINTABLE DOCUMENT PREVIEW AREA (Canvas Sheet View) ─── */}
        <div 
          ref={printRef}
          className="flex-1 overflow-auto p-3 sm:p-5 bg-slate-100 dark:bg-slate-950/60 select-text print:p-0 print:m-0 print:bg-white"
          id="printable-student-list"
        >
          {loading ? (
            <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading verified student master roll...</p>
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
            <div 
              id="printable-sheet"
              className="mx-auto bg-white text-slate-900 shadow-xl border border-slate-300 rounded-xl p-5 sm:p-7 w-full max-w-full transition-all print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none"
            >
              
              {/* ─── Institutional Header ─── */}
              {showHeader && (
                <PrintHeader 
                  title="SEMESTER-WISE STUDENT ENROLLMENT & MASTER ROLL"
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
              )}

              {/* ─── Main Dynamic Student Master Table ─── */}
              <div className="w-full overflow-x-auto mt-2">
                <table className={`student-print-table w-full border-collapse font-sans ${printFontSizeClass}`}>
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 border border-slate-900">
                      {activeColumns.map(col => (
                        <th 
                          key={col.id} 
                          className={`py-2 px-1 font-black ${col.width} ${col.headerClass || ''}`}
                        >
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300">
                    {students.map((st, idx) => (
                      <tr 
                        key={st.id || st._id || idx} 
                        className="hover:bg-slate-50 even:bg-slate-50/60 border-b border-slate-300 print:break-inside-avoid"
                      >
                        {activeColumns.map(col => (
                          <td 
                            key={col.id} 
                            className={`py-1 px-1.5 ${col.cellClass || ''}`}
                          >
                            {col.render(st, idx)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ─── Summary Count Strip ─── */}
              {showDemographics && (
                <div className="mt-3 p-2 bg-slate-100 border border-slate-300 rounded flex flex-wrap items-center justify-between text-[9.5px] font-bold text-slate-800 gap-2">
                  <div>
                    <strong>Total Candidates Printed:</strong> {totalCount} Students 
                    <span className="ml-2 font-normal text-slate-600">(Male: {maleCount}, Female: {femaleCount})</span>
                  </div>
                  <div>
                    <strong>Category Breakdown:</strong> GEN: {genCount} | OBC: {obcCount} | SC: {scCount} | ST: {stCount} | EWS: {ewsCount}
                  </div>
                  <div>
                    <strong>Columns Rendered:</strong> {activeColumns.length} of {ALL_COLUMNS.length}
                  </div>
                </div>
              )}

              {/* ─── Institutional 3-Tier Footer ─── */}
              {showFooter && (
                <PrintFooter 
                  showSignatures={true}
                  signatories={[
                    { title: 'Dealing Assistant / Clerk', subtitle: 'Prepared By' },
                    { title: 'In-Charge / Accounts Officer', subtitle: 'Verified By' },
                    { title: 'Principal / Authorized Signatory', subtitle: 'Approved & Sealed' }
                  ]}
                  customNote="This is an official computer-generated student master roll certified from Pankh Gold College Management ERP."
                />
              )}

            </div>
          )}
        </div>

        {/* ─── MODAL FOOTER (Hidden on Print) ─── */}
        <div className="px-5 py-2.5 border-t border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base no-print flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500 font-medium">
            <span>Viewing <strong>{students.length}</strong> students for <strong>{session}</strong> ({semester === 'All' ? 'All Semesters' : semester})</span>
            <span>•</span>
            <span className="text-indigo-600 font-bold">{activeColumns.length} Columns Active</span>
          </div>
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center space-x-2"
            >
              <Printer className="w-4 h-4" />
              <span>Print Student List</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default PrintStudentListModal;
