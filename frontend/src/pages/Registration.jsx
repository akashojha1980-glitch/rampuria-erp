import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Plus, Filter, Download, ArrowLeft,
  ChevronLeft, ChevronRight, Edit2, Trash2, Eye, Calendar, TrendingUp,
  FileSpreadsheet, Settings, Upload, CheckCircle2, AlertTriangle, X, RefreshCw,
  DollarSign, ArrowUpDown, Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from '../context/SessionContext';
import Loading from '../components/Loading';
import Toast from '../components/Toast';
import FeeStructureSettingsModal from '../components/FeeStructureSettingsModal';

const Registration = () => {
  const navigate = useNavigate();
  const { activeSession, sessions } = useSession();
  
  // Tabs: 'list' or 'form'
  const [activeTab, setActiveTab] = useState('list');
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [toast, setToast] = useState(null);
  const [showFeeSettingsModal, setShowFeeSettingsModal] = useState(false);

  // Pagination & Filter States
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('accNo_asc');
  const [sessionFilter, setSessionFilter] = useState('All Sessions');
  const [courseFilter, setCourseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
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

  // Bulk Excel Import States
  const [showBulkImportModal, setShowBulkImportModal] = useState(false);
  const [excelRows, setExcelRows] = useState([]);
  const [excelFileName, setExcelFileName] = useState('');
  const [importingExcel, setImportingExcel] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [importSession, setImportSession] = useState('2025-26');
  const [customImportSession, setCustomImportSession] = useState('');
  const [importCourse, setImportCourse] = useState('Bachelor of Laws (L.L.B.)');
  const [importYear, setImportYear] = useState('1st Year');
  const [importSemester, setImportSemester] = useState('I & II Semester');
  const [importAutoFee, setImportAutoFee] = useState(true);
  const fileInputRef = useRef(null);

  // Registration Number Format Settings States
  const [showRegSettingsModal, setShowRegSettingsModal] = useState(false);
  const [regConfig, setRegConfig] = useState({
    prefix: 'BJS/',
    suffix: '',
    startNumber: 1001,
    currentNumber: 1001,
    padding: 4,
    includeYear: false,
    includeSession: false
  });
  const [regPreview, setRegPreview] = useState('');
  const [savingRegConfig, setSavingRegConfig] = useState(false);
  const [renumbering, setRenumbering] = useState(false);

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
        limit: pageSize,
        search,
        sortBy,
        course: courseFilter,
        status: statusFilter,
        category: categoryFilter
      });

      if (sessionFilter && sessionFilter !== 'All Sessions') {
        queryParams.append('session', sessionFilter);
      }

      const res = await fetch(`/api/students?${queryParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (res.ok) {
        setStudents(data.students || []);
        setPages(data.pages || 1);
        setTotalStudents(data.total || data.count || 0);
      }
    } catch (err) {
      console.error('[Registration Fetch] Local API error:', err.message);
      showToastMsg('Failed to sync student registry from database', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setPage(1);
    fetchStudents();
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
    fetchRegSettings();
  }, []);

  // Sync activeSession from top header when it changes
  useEffect(() => {
    if (activeSession && activeSession !== 'All Sessions') {
      setSessionFilter(activeSession);
    }
  }, [activeSession]);

  // Instant Debounced Live Search and Filter sync
  useEffect(() => {
    if (activeTab === 'list') {
      const debounceTimer = setTimeout(() => {
        fetchStudents();
      }, 200);
      return () => clearTimeout(debounceTimer);
    }
  }, [activeTab, page, pageSize, search, sortBy, sessionFilter, courseFilter, statusFilter, categoryFilter]);

  // Download Sample Excel Template for Students
  const handleDownloadSampleExcel = () => {
    const sampleData = [
      {
        'Full Name': 'Aakash Sharma',
        "Father's Name": 'Rajesh Sharma',
        "Mother's Name": 'Sunita Sharma',
        'Mobile Number': '9876543210',
        'Email': 'aakash.sharma@example.com',
        'Gender': 'Male',
        'Date of Birth': '2002-05-15',
        'Category': 'General',
        'Address': '123 Sadul Colony, Bikaner',
        'City': 'Bikaner',
        'State': 'Rajasthan',
        'Pincode': '334001',
        'Course Applied': 'LL.B. (3 Year)',
        'Academic Session': '2025-26',
        'Academic Year': '1st Year',
        'Semester': '1st Semester',
        '10th %': '82.5',
        '10th Board': 'RBSE',
        '10th Year': '2018',
        '12th %': '79.0',
        '12th Board': 'RBSE',
        '12th Year': '2020',
        '12th Subject': 'Arts',
        'Graduation University': 'MGSU Bikaner',
        'Graduation Year': '2023',
        'Grad %': '68.5',
        'Aadhar No': '123456789012',
        'Form No': 'F-2025-001',
        'Registration ID (Optional)': ''
      },
      {
        'Full Name': 'Priya Choudhary',
        "Father's Name": 'Ramesh Choudhary',
        "Mother's Name": 'Kamla Devi',
        'Mobile Number': '9123456780',
        'Email': 'priya.choudhary@example.com',
        'Gender': 'Female',
        'Date of Birth': '2003-08-20',
        'Category': 'OBC',
        'Address': '45 Kanta Khaturia Colony, Bikaner',
        'City': 'Bikaner',
        'State': 'Rajasthan',
        'Pincode': '334003',
        'Course Applied': 'B.A. LL.B. (5 Year)',
        'Academic Session': '2025-26',
        'Academic Year': '1st Year',
        'Semester': '1st Semester',
        '10th %': '88.0',
        '10th Board': 'CBSE',
        '10th Year': '2019',
        '12th %': '85.4',
        '12th Board': 'CBSE',
        '12th Year': '2021',
        '12th Subject': 'Humanities',
        'Graduation University': '',
        'Graduation Year': '',
        'Grad %': '',
        'Aadhar No': '987654321098',
        'Form No': 'F-2025-002',
        'Registration ID (Optional)': ''
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    XLSX.writeFile(workbook, 'Student_Bulk_Import_Sample_Template.xlsx');
    showToastMsg('Downloaded Student Bulk Import Template (.xlsx)');
  };

  // Read Excel File
  const handleExcelFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setExcelFileName(file.name);
    setImportResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsName = wb.SheetNames[0];
        const ws = wb.Sheets[wsName];
        const data = XLSX.utils.sheet_to_json(ws);
        
        if (!data || data.length === 0) {
          showToastMsg('The uploaded Excel sheet contains no data rows', 'error');
          setExcelRows([]);
          return;
        }

        setExcelRows(data);
        showToastMsg(`Parsed ${data.length} student rows from ${file.name}`);
      } catch (err) {
        console.error('Excel parse error:', err);
        showToastMsg('Failed to parse Excel file. Please ensure it is a valid .xlsx or .csv file.', 'error');
      }
    };
    reader.readAsBinaryString(file);
  };

  // Execute Bulk Import API
  const handleExecuteBulkImport = async () => {
    if (excelRows.length === 0) {
      showToastMsg('No student records to import', 'error');
      return;
    }

    const selectedSession = importSession === 'custom' ? customImportSession.trim() : importSession;
    if (!selectedSession) {
      showToastMsg('Please select or specify the Target Academic Session', 'error');
      return;
    }

    setImportingExcel(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/students/bulk-import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          students: excelRows,
          targetSession: selectedSession,
          defaultCourse: importCourse,
          defaultYear: importYear,
          defaultSemester: importSemester,
          autoCreateFeePayment: importAutoFee
        })
      });
      const data = await res.json();
      if (res.ok) {
        setImportResult(data);
        showToastMsg(`Bulk import complete: ${data.count} students registered in ${selectedSession}!`);
        fetchStudents();
      } else {
        showToastMsg(data.message || 'Error during bulk import', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setImportingExcel(false);
    }
  };

  // Fetch Registration Number Settings
  const fetchRegSettings = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/reg-number', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setRegConfig(data.config || {});
        setRegPreview(data.nextPreview || '');
      }
    } catch (err) {
      console.error('Failed to load reg settings', err);
    }
  };

  // Save Registration Number Settings
  const handleSaveRegSettings = async (e) => {
    e.preventDefault();
    setSavingRegConfig(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/reg-number', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(regConfig)
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(data.message || 'Registration settings saved');
        setRegPreview(data.nextPreview || '');
      } else {
        showToastMsg(data.message || 'Failed to update settings', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setSavingRegConfig(false);
    }
  };

  // Renumber existing students in sequence
  const handleRenumberExisting = async () => {
    if (!window.confirm('Are you sure you want to renumber all existing students in sequence? This will overwrite registration numbers for past students.')) {
      return;
    }

    setRenumbering(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/settings/reg-number/renumber-existing', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg(data.message || 'Renumbered existing students successfully');
        fetchStudents();
        fetchRegSettings();
      } else {
        showToastMsg(data.message || 'Error renumbering students', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setRenumbering(false);
    }
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
                {/* Search input - Instant Live Search on typing */}
                <div className="flex-1 max-w-lg relative">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-warm-800/40 dark:text-slate-500" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setPage(1);
                    }}
                    placeholder="Type to search (Name, Father, A/C No. 1001, Reg No, Mobile)..."
                    className="w-full pl-11 pr-10 py-3 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold focus:ring-1 focus:ring-brand-500 focus:border-brand-500 outline-none transition-all"
                  />
                  {search && (
                    <button
                      onClick={() => { setSearch(''); setPage(1); }}
                      className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Operations */}
                <div className="flex flex-wrap items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => { setShowBulkImportModal(true); setImportResult(null); setExcelRows([]); setExcelFileName(''); }}
                    className="px-3.5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                    title="Bulk register past and new students from Excel sheet"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    <span>Bulk Import (Excel)</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => { setShowRegSettingsModal(true); fetchRegSettings(); }}
                    className="p-3 rounded-xl bg-warm-100 dark:bg-darkbg-base hover:bg-warm-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                    title="Configure Registration Number Format & Starting Sequence"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Reg No. Settings</span>
                  </button>

                  <button 
                    type="button"
                    onClick={() => setShowFeeSettingsModal(true)}
                    className="p-3 rounded-xl bg-warm-100 dark:bg-darkbg-base hover:bg-warm-200 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all flex items-center space-x-1.5"
                    title="Configure Classes & Fee Structure Master"
                  >
                    <DollarSign className="w-4 h-4 text-brand-500" />
                    <span>Classes & Fees</span>
                  </button>

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
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                
                {/* Sort Order Selector */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <ArrowUpDown className="w-3 h-3" />
                    <span>Sort Order</span>
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-300"
                  >
                    <option value="accNo_asc">A/C No. (1001, 1002...) Sequence</option>
                    <option value="srNo_asc">SR No. (1, 2, 3...) Sequence</option>
                    <option value="recent">Recent Added First</option>
                    <option value="name_asc">Student Name (A-Z)</option>
                  </select>
                </div>

                {/* Session Filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Academic Session</span>
                  </label>
                  <select
                    value={sessionFilter}
                    onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none text-warm-800 dark:text-slate-300"
                  >
                    <option value="All Sessions">All Sessions (All Students)</option>
                    {sessions && sessions.filter(s => s !== 'All Sessions').map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                {/* Course Filter */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-warm-800/50 dark:text-slate-500 uppercase tracking-widest">Applied Course</label>
                  <select
                    value={courseFilter}
                    onChange={(e) => { setCourseFilter(e.target.value); setPage(1); }}
                    className="px-3 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-medium outline-none text-warm-800 dark:text-slate-300"
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
                    className="px-3 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-medium outline-none text-warm-800 dark:text-slate-300"
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
                    className="px-3 py-2 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-medium outline-none text-warm-800 dark:text-slate-300"
                  >
                    <option value="">All Categories</option>
                    <option value="General">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="EWS">EWS</option>
                    <option value="MBC">MBC</option>
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
                          <th className="w-12 px-4 py-4 text-center">
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
                          <th className="px-4 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">A/C No.</th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Reg. No.</th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Student & Father Name</th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Contact / Mobile</th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Category</th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Course Applied</th>
                          <th className="px-4 py-4 text-left text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Verification</th>
                          <th className="px-4 py-4 text-center text-xs font-bold text-warm-800/70 dark:text-slate-400 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border bg-transparent">
                        {students.map((s) => (
                          <tr key={s._id} className={`hover:bg-warm-100/10 dark:hover:bg-darkbg-base/20 transition-all ${selectedIds.includes(s._id) ? 'bg-indigo-50/10 dark:bg-indigo-500/5' : ''}`}>
                            <td className="px-4 py-4 text-center">
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
                            {/* A/C No. Column */}
                            <td className="px-4 py-4 text-xs">
                              <span className="inline-flex items-center px-2.5 py-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 font-mono font-bold text-xs rounded-lg border border-amber-500/20">
                                {s.studentAccNo || s.srNo || '-'}
                              </span>
                            </td>
                            {/* Reg. No. Column */}
                            <td className="px-4 py-4 text-xs font-mono font-semibold text-slate-600 dark:text-slate-400">
                              {s.registrationId || '-'}
                            </td>
                            {/* Student & Father Name */}
                            <td className="px-6 py-4 text-xs">
                              <div className="flex flex-col">
                                <span className="font-bold text-warm-900 dark:text-slate-100 text-[13px]">{s.fullName}</span>
                                {s.fatherName && (
                                  <span className="text-[11px] text-warm-800/60 dark:text-slate-400 font-medium">
                                    S/D/W of <span className="font-semibold text-warm-900 dark:text-slate-300">{s.fatherName}</span>
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Contact / Mobile & WhatsApp */}
                            <td className="px-4 py-4 text-xs">
                              <div className="flex flex-col font-mono">
                                <span className="text-warm-900 dark:text-slate-200 font-medium">{s.mobileNumber || '-'}</span>
                                {s.whatsAppNo && s.whatsAppNo !== s.mobileNumber && (
                                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">WA: {s.whatsAppNo}</span>
                                )}
                              </div>
                            </td>
                            {/* Category & Gender */}
                            <td className="px-4 py-4 text-xs">
                              <div className="flex items-center space-x-1.5">
                                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-warm-100 dark:bg-darkbg-base text-slate-700 dark:text-slate-300">
                                  {s.category || 'General'}
                                </span>
                                {s.gender && (
                                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${s.gender === 'Female' || s.gender === 'F' ? 'bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-300' : 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300'}`}>
                                    {s.gender === 'M' ? 'Male' : s.gender === 'F' ? 'Female' : s.gender}
                                  </span>
                                )}
                              </div>
                            </td>
                            {/* Course Applied & Year */}
                            <td className="px-4 py-4 text-xs">
                              <div className="flex flex-col">
                                <span className="font-bold text-brand-600 dark:text-brand-300">{s.courseApplied}</span>
                                <span className="text-[10px] text-warm-800/50 dark:text-slate-400 font-medium">{s.currentYear || '1st Year'}</span>
                              </div>
                            </td>
                            {/* Verification Status */}
                            <td className="px-4 py-4 text-xs">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                s.verificationStatus === 'Verified' || s.verificationStatus === 'Approved'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                                  : s.verificationStatus === 'Rejected'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                                  : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                              }`}>
                                {s.verificationStatus || 'Pending'}
                              </span>
                            </td>
                            {/* Actions */}
                            <td className="px-4 py-4 text-xs">
                              <div className="flex items-center justify-center space-x-2">
                                <button 
                                  onClick={() => navigate(`/profile/${s._id}`)}
                                  title="View Profile & Fees"
                                  className="p-1.5 rounded-lg text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
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

                  {/* Pagination row with Page Size Selector */}
                  <div className="flex flex-col sm:flex-row items-center justify-between px-2 pt-3 gap-3 text-xs font-semibold text-warm-800/60 dark:text-slate-400 border-t border-warm-200/40 dark:border-darkbg-border">
                    <div className="flex items-center space-x-3">
                      <span className="font-bold text-warm-900 dark:text-slate-200">
                        Total Registered Students: <strong className="text-brand-600 dark:text-brand-400 font-mono text-sm">{totalStudents}</strong>
                      </span>
                      <div className="flex items-center space-x-1.5 bg-warm-100/60 dark:bg-darkbg-base px-2.5 py-1 rounded-lg border border-warm-200/50 dark:border-darkbg-border">
                        <span className="text-[10px] uppercase font-bold text-slate-500">Show:</span>
                        <select
                          value={pageSize}
                          onChange={(e) => {
                            setPageSize(Number(e.target.value));
                            setPage(1);
                          }}
                          className="bg-transparent font-bold text-slate-800 dark:text-slate-200 text-xs focus:outline-none cursor-pointer"
                        >
                          <option value="10">10</option>
                          <option value="25">25</option>
                          <option value="50">50</option>
                          <option value="100">100</option>
                          <option value="250">250</option>
                          <option value="500">500 (All)</option>
                        </select>
                        <span className="text-[10px] text-slate-400">per page</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-500">
                        Showing {students.length > 0 ? (page - 1) * pageSize + 1 : 0} - {Math.min(page * pageSize, totalStudents)} of {totalStudents}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => setPage(p => Math.max(p - 1, 1))}
                          disabled={page === 1}
                          className="p-2 rounded-lg bg-warm-100/50 hover:bg-warm-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors border border-warm-200/40"
                          title="Previous Page"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <span className="px-2.5 py-1 rounded-lg bg-warm-100/80 dark:bg-darkbg-base font-bold font-mono text-slate-800 dark:text-slate-200">
                          {page} / {pages}
                        </span>
                        <button
                          onClick={() => setPage(p => Math.min(p + 1, pages))}
                          disabled={page === pages || pages === 0}
                          className="p-2 rounded-lg bg-warm-100/50 hover:bg-warm-100 dark:bg-slate-800/60 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors border border-warm-200/40"
                          title="Next Page"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
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

      {/* MODAL 1: BULK EXCEL IMPORT */}
      {showBulkImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/80 dark:bg-black/85 backdrop-blur-md p-3 sm:p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 border-b border-warm-200 dark:border-darkbg-border flex items-center justify-between bg-warm-50/50 dark:bg-darkbg-base/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-warm-900 dark:text-white">Bulk Student Excel Import & Session Assignment</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Import student lists from Excel (.xlsx / .csv) and assign to specific academic session</p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkImportModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
              
              {/* Step 1: Session & Defaults Selector (Crucial for 2-session college files) */}
              <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200/70 dark:border-indigo-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-900 dark:text-indigo-300 flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <span>Step 1: Konse Academic Session me Add Karna Hai? (Target Session)</span>
                  </span>
                  <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-md">Required</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Session Dropdown */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Academic Session *
                    </label>
                    <select
                      value={importSession}
                      onChange={(e) => setImportSession(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-darkbg-base text-xs font-bold text-indigo-900 dark:text-indigo-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="2025-26">2025-26 (Current Academic Session)</option>
                      <option value="2024-25">2024-25 (Previous Academic Session)</option>
                      <option value="2026-27">2026-27 (Upcoming Session)</option>
                      <option value="2023-24">2023-24 (Past Session)</option>
                      <option value="custom">✏️ Custom / Other Session...</option>
                    </select>
                  </div>

                  {/* Custom Session Input if selected */}
                  {importSession === 'custom' ? (
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Enter Custom Session *
                      </label>
                      <input
                        type="text"
                        value={customImportSession}
                        onChange={(e) => setCustomImportSession(e.target.value)}
                        placeholder="e.g. 2024-2027 or 2025-26"
                        className="px-3 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-white dark:bg-darkbg-base text-xs font-bold"
                      />
                    </div>
                  ) : (
                    /* Default Course */
                    <div className="flex flex-col space-y-1">
                      <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        Default Course (if missing in row)
                      </label>
                      <select
                        value={importCourse}
                        onChange={(e) => setImportCourse(e.target.value)}
                        className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-xs font-bold text-slate-800 dark:text-slate-200"
                      >
                        <option value="Bachelor of Laws (L.L.B.)">Bachelor of Laws (L.L.B.) - 3 Year</option>
                        <option value="B.A. L.L.B. Integrated">B.A. L.L.B. Integrated - 5 Year</option>
                        <option value="Master of Laws (L.L.M.)">Master of Laws (L.L.M.) - 2 Year</option>
                        <option value="PGDCC & PGDLL">PGDCC & PGDLL (1 Year Diploma)</option>
                      </select>
                    </div>
                  )}

                  {/* Default Year */}
                  <div className="flex flex-col space-y-1">
                    <label className="text-[10px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      Academic Year
                    </label>
                    <select
                      value={importYear}
                      onChange={(e) => setImportYear(e.target.value)}
                      className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-xs font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="1st Year">1st Year / Sem I & II</option>
                      <option value="2nd Year">2nd Year / Sem III & IV</option>
                      <option value="3rd Year">3rd Year / Sem V & VI</option>
                      <option value="4th Year">4th Year (B.A. LL.B.)</option>
                      <option value="5th Year">5th Year (B.A. LL.B.)</option>
                      <option value="Diploma Year">Diploma Year</option>
                    </select>
                  </div>
                </div>

                {/* Auto Fee payment creation toggle */}
                <div className="pt-1 flex items-center justify-between border-t border-indigo-200/50 dark:border-indigo-900/30">
                  <label className="flex items-center space-x-2 cursor-pointer text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    <input
                      type="checkbox"
                      checked={importAutoFee}
                      onChange={(e) => setImportAutoFee(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                    />
                    <span>Auto-record Fee Receipt if Excel contains fee payment amounts / receipt numbers</span>
                  </label>
                  <button
                    type="button"
                    onClick={handleDownloadSampleExcel}
                    className="text-[11px] font-bold text-indigo-700 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                  >
                    <Download className="w-3 h-3" />
                    <span>Download Sample Template</span>
                  </button>
                </div>
              </div>

              {/* Step 2: Upload Excel File Box */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-warm-900 dark:text-white block">
                  Step 2: Upload Excel Sheet (.xlsx / .xls / .csv)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="p-5 border-2 border-dashed border-warm-300 dark:border-slate-700 hover:border-emerald-500 rounded-2xl bg-warm-50/50 dark:bg-darkbg-base/50 text-center cursor-pointer transition-all space-y-1.5"
                >
                  <Upload className="w-7 h-7 text-emerald-600 dark:text-emerald-400 mx-auto" />
                  <div className="text-xs font-semibold text-warm-900 dark:text-white">
                    {excelFileName ? (
                      <span className="text-emerald-600 font-bold">{excelFileName} ({excelRows.length} rows loaded)</span>
                    ) : (
                      <span>Click to browse or drag & drop student Excel sheet here</span>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium">Supports all standard Rampuria Law College Excel sheets</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleExcelFileChange}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                </div>
              </div>

              {/* Result Summary if any */}
              {importResult && (
                <div className={`p-4 rounded-xl border ${importResult.success ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900 dark:bg-emerald-950/20 dark:border-emerald-900/40 dark:text-emerald-300' : 'bg-rose-50 border-rose-200 text-rose-900'}`}>
                  <div className="flex items-center space-x-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>{importResult.message}</span>
                  </div>
                  {importResult.paymentsCreated > 0 && (
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-1 font-semibold">
                      ✓ Created {importResult.paymentsCreated} initial fee receipt(s) in Fees Console & Day Book.
                    </p>
                  )}
                  {importResult.errorsCount > 0 && (
                    <div className="mt-2 text-[11px] space-y-1">
                      <span className="font-bold text-rose-600">Skipped {importResult.errorsCount} rows due to missing names or invalid data:</span>
                      <ul className="list-disc list-inside text-slate-600 dark:text-slate-400 max-h-32 overflow-y-auto">
                        {importResult.errors.map((e, idx) => (
                          <li key={idx}>Row {e.row}: {e.student || ''} - {e.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Preview Table */}
              {excelRows.length > 0 && !importResult && (
                <div className="space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center space-x-2">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Loaded All {excelRows.length} Student Rows from Excel</span>
                    </span>
                    <span className="text-[11px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-800">
                      ✓ All {excelRows.length} Records Ready for Session: {importSession === 'custom' ? customImportSession : importSession}
                    </span>
                  </div>
                  
                  <div className="border border-warm-200 dark:border-darkbg-border rounded-xl overflow-x-auto max-h-72 overflow-y-auto shadow-inner">
                    <table className="w-full text-left text-xs">
                      <thead className="sticky top-0 bg-warm-100 dark:bg-darkbg-base text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 border-b border-warm-200 dark:border-darkbg-border shadow-sm">
                        <tr>
                          <th className="px-2.5 py-2 text-center">S.No</th>
                          <th className="px-2.5 py-2">Ac. No.</th>
                          <th className="px-2.5 py-2">Registration No.</th>
                          <th className="px-3 py-2">Student Name</th>
                          <th className="px-3 py-2">Father's Name</th>
                          <th className="px-3 py-2">Mother's Name</th>
                          <th className="px-2.5 py-2 text-center">Gender</th>
                          <th className="px-2.5 py-2 text-center">Caste / Category</th>
                          <th className="px-3 py-2">WhatsApp Mob.</th>
                          <th className="px-3 py-2">Other Mob.</th>
                          <th className="px-2.5 py-2 text-center">Target Session</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warm-200/50 dark:divide-darkbg-border font-medium">
                        {excelRows.map((row, i) => {
                          const sNo = row['S.No'] || row['S.No.'] || row['S. No.'] || row['Sr No'] || (i + 1);
                          const acNo = row['Ac. No.'] || row['Ac. No'] || row['Ac No.'] || row['Ac No'] || row['studentAccNo'] || '-';
                          const regNo = row['Registration No.'] || row['Registration No'] || row['Reg No'] || row['registrationId'] || `Auto (#${1001 + i})`;
                          const name = row['Name'] || row['name'] || row['Full Name'] || row['Student Name'] || '-';
                          const father = row["Father's Name"] || row['Father Name'] || row['Fathers Name'] || row['fatherName'] || '-';
                          const mother = row['Mothers Name'] || row["Mother's Name"] || row['Mother Name'] || row['motherName'] || '-';
                          
                          // Gender from Category (M/F) or gender column
                          const rawCat = row['Category'] || row['category'] || '';
                          let genderDisplay = row['Gender'] || row['gender'] || '';
                          if (!genderDisplay && (rawCat === 'M' || rawCat === 'm')) genderDisplay = 'Male (M)';
                          else if (!genderDisplay && (rawCat === 'F' || rawCat === 'f')) genderDisplay = 'Female (F)';
                          else if (!genderDisplay) genderDisplay = rawCat || 'Male';

                          // Caste / Social Category
                          const caste = row['Caste'] || row['caste'] || (rawCat && !['M', 'F', 'm', 'f'].includes(rawCat) ? rawCat : 'GEN');
                          
                          const whatsapp = row['Whatsup Mob. No.'] || row['Whatsup Mob No'] || row['Whatsup Mob.'] || row['WhatsApp No'] || row['mobileNumber'] || row['Mobile'] || '-';
                          const otherMob = row['Other Mob. No.'] || row['Other Mob No'] || row['Other Mob.'] || row['alternateMobile'] || row['Parents Contact'] || '-';
                          const session = importSession === 'custom' ? customImportSession : (row['Academic Session'] || row['Session'] || importSession);

                          return (
                            <tr key={i} className="hover:bg-warm-50 dark:hover:bg-darkbg-base/70 transition-colors">
                              <td className="px-2.5 py-1.5 text-center text-slate-400 font-mono text-[11px]">{sNo}</td>
                              <td className="px-2.5 py-1.5 font-mono font-bold text-slate-700 dark:text-slate-300">{acNo}</td>
                              <td className="px-2.5 py-1.5 font-mono font-bold text-brand-600 dark:text-brand-400 whitespace-nowrap">{regNo}</td>
                              <td className="px-3 py-1.5 font-bold text-slate-900 dark:text-white whitespace-nowrap">{name}</td>
                              <td className="px-3 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{father}</td>
                              <td className="px-3 py-1.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">{mother}</td>
                              <td className="px-2.5 py-1.5 text-center whitespace-nowrap">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${genderDisplay.includes('F') ? 'bg-pink-100 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'}`}>
                                  {genderDisplay}
                                </span>
                              </td>
                              <td className="px-2.5 py-1.5 text-center whitespace-nowrap">
                                <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
                                  {caste}
                                </span>
                              </td>
                              <td className="px-3 py-1.5 font-mono text-emerald-700 dark:text-emerald-400 font-semibold">{whatsapp}</td>
                              <td className="px-3 py-1.5 font-mono text-slate-600 dark:text-slate-400">{otherMob}</td>
                              <td className="px-2.5 py-1.5 text-center font-bold font-mono text-indigo-600 dark:text-indigo-400 whitespace-nowrap">{session}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="px-5 sm:px-6 py-3.5 border-t border-warm-200 dark:border-darkbg-border flex flex-col sm:flex-row items-center justify-between gap-2 bg-warm-50/30 dark:bg-darkbg-base/30">
              <span className="text-[11px] text-slate-500 font-medium">
                {excelRows.length > 0 ? `${excelRows.length} students ready to register into Session ${importSession === 'custom' ? customImportSession : importSession}` : 'Upload an Excel file to begin'}
              </span>
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setShowBulkImportModal(false)}
                  className="px-4 py-2 bg-warm-100 hover:bg-warm-200 dark:bg-darkbg-base dark:text-slate-200 rounded-xl text-xs font-bold"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleExecuteBulkImport}
                  disabled={importingExcel || excelRows.length === 0}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1.5"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{importingExcel ? 'Registering Batch...' : `Register ${excelRows.length} Students in ${importSession === 'custom' ? customImportSession : importSession}`}</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: REGISTRATION NUMBER SEQUENCE SETTINGS */}
      {showRegSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-warm-900/80 dark:bg-black/85 backdrop-blur-md p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-warm-200 dark:border-darkbg-border flex items-center justify-between bg-warm-50/50 dark:bg-darkbg-base/50">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-xl bg-brand-500/10 text-brand-600 dark:bg-brand-500/20 dark:text-brand-400">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-warm-900 dark:text-white">Registration Number Settings</h3>
                  <p className="text-[11px] text-slate-500 font-medium">Configure format prefix & sequential auto-generator</p>
                </div>
              </div>
              <button
                onClick={() => setShowRegSettingsModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSaveRegSettings} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Prefix (e.g. BJS/ or RMP/)</label>
                  <input
                    type="text"
                    value={regConfig.prefix || ''}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, prefix: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold"
                    placeholder="BJS/"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Suffix (Optional)</label>
                  <input
                    type="text"
                    value={regConfig.suffix || ''}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, suffix: e.target.value }))}
                    className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold"
                    placeholder="e.g. /LAW"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Starting No</label>
                  <input
                    type="number"
                    value={regConfig.startNumber || 1001}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, startNumber: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Next Auto No</label>
                  <input
                    type="number"
                    value={regConfig.currentNumber || 1001}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, currentNumber: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold text-brand-600"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Digit Padding</label>
                  <select
                    value={regConfig.padding || 4}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, padding: Number(e.target.value) }))}
                    className="px-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-bold"
                  >
                    <option value="0">No Padding (1, 2...)</option>
                    <option value="3">3 Digits (001, 002...)</option>
                    <option value="4">4 Digits (0001, 0002...)</option>
                    <option value="5">5 Digits (00001...)</option>
                  </select>
                </div>
              </div>

              {/* Checkboxes */}
              <div className="space-y-2 pt-1">
                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!regConfig.includeSession}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, includeSession: e.target.checked }))}
                    className="rounded text-brand-600"
                  />
                  <span>Include Academic Session in ID (e.g. BJS/2025-26/1001)</span>
                </label>

                <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-300">
                  <input
                    type="checkbox"
                    checked={!!regConfig.includeYear}
                    onChange={(e) => setRegConfig(prev => ({ ...prev, includeYear: e.target.checked }))}
                    className="rounded text-brand-600"
                  />
                  <span>Include Current Calendar Year (e.g. BJS/2025/1001)</span>
                </label>
              </div>

              {/* Dynamic Preview Box */}
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400 block">
                  Next Registration ID Preview
                </span>
                <span className="text-base font-black text-emerald-800 dark:text-emerald-300 font-mono block">
                  {regConfig.prefix || ''}{regConfig.includeSession ? '2025-26/' : ''}{regConfig.includeYear ? `${new Date().getFullYear()}/` : ''}{String(regConfig.currentNumber || 1001).padStart(regConfig.padding || 4, '0')}{regConfig.suffix || ''}
                </span>
              </div>

              {/* Renumber existing button */}
              <div className="pt-2 border-t border-warm-200 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={handleRenumberExisting}
                  disabled={renumbering}
                  className="w-full py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${renumbering ? 'animate-spin' : ''}`} />
                  <span>{renumbering ? 'Renumbering...' : 'Renumber All Existing Records in Database'}</span>
                </button>
                <span className="text-[10px] text-slate-400 text-center block mt-1">
                  Assigns sequential numbers to old students starting from #{regConfig.startNumber}
                </span>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t">
                <button
                  type="button"
                  onClick={() => setShowRegSettingsModal(false)}
                  className="px-4 py-2 bg-warm-100 hover:bg-warm-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRegConfig}
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  {savingRegConfig ? 'Saving...' : 'Save Format Settings'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* Classes & Fee Structure Master Settings Modal */}
      <FeeStructureSettingsModal
        isOpen={showFeeSettingsModal}
        onClose={() => setShowFeeSettingsModal(false)}
        onFeeUpdated={fetchCourses}
      />

    </div>
  );
};

export default Registration;
