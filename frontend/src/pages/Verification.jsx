import React, { useState, useEffect } from 'react';
import { 
  Search, FileCheck, FileX, Clock, Upload, 
  Eye, FileText, AlertTriangle, AlertCircle, Save
} from 'lucide-react';
import { motion } from 'framer-motion';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const Verification = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [search, setSearch] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [toast, setToast] = useState(null);

  // Verification states
  const [remarks, setRemarks] = useState({});
  const [statuses, setStatuses] = useState({});
  const [globalRemarks, setGlobalRemarks] = useState('');
  const [previewFile, setPreviewFile] = useState(null); // { url, isPDF }

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchStudentsList = async () => {
    setLoadingList(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students?limit=200&search=${search}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
        if (data.students?.length > 0 && !selectedStudent) {
          fetchStudentDetails(data.students[0]._id);
        }
      }
    } catch (err) {
      showToastMsg('Failed to sync students list from database', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchStudentDetails = async (id) => {
    setLoadingDetails(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setSelectedStudent(data);
        setGlobalRemarks(data.verificationRemarks || '');
        
        const docRemarks = {};
        const docStatuses = {};
        if (data.documents) {
          Object.keys(data.documents).forEach(key => {
            docRemarks[key] = data.documents[key]?.remarks || '';
            docStatuses[key] = data.documents[key]?.status || 'Pending';
          });
        }
        setRemarks(docRemarks);
        setStatuses(docStatuses);
      }
    } catch (err) {
      showToastMsg('Database fetch error', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchStudentsList();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchStudentsList();
  };

  // Safe status submit
  const handleVerifySubmit = async (docType) => {
    const token = localStorage.getItem('token');
    
    // Build updated documents object
    const updatedDocs = { ...selectedStudent.documents };
    updatedDocs[docType] = {
      filename: selectedStudent.documents[docType]?.filename || '',
      status: statuses[docType],
      remarks: remarks[docType] || ''
    };

    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/students/${selectedStudent._id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          verificationStatus: statuses[docType] === 'Rejected' ? 'Rejected' : selectedStudent.verificationStatus,
          verificationRemarks: globalRemarks,
          documents: updatedDocs
        })
      });

      const data = await res.json();
      if (res.ok) {
        showToastMsg(`${docLabels[docType] || docType} verification saved`);
        await fetchStudentDetails(selectedStudent._id);
        fetchStudentsList();
      } else {
        showToastMsg(data.message || 'Failed to update verification', 'error');
      }
    } catch (err) {
      showToastMsg('Database update timeout', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  // Submit global verification decision
  const handleGlobalDecision = async (status) => {
    const token = localStorage.getItem('token');
    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/students/${selectedStudent._id}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          verificationStatus: status,
          verificationRemarks: globalRemarks
        })
      });
      if (res.ok) {
        showToastMsg(`Overall profile status set to: ${status}`);
        await fetchStudentDetails(selectedStudent._id);
        fetchStudentsList();
      } else {
        showToastMsg('Failed to update status', 'error');
      }
    } catch (err) {
      showToastMsg('Server offline', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handlePreview = (filename) => {
    if (!filename) return;
    const extension = filename.split('.').pop().toLowerCase();
    const isPDF = extension === 'pdf';
    const url = `/uploads/${filename}`;
    setPreviewFile({ url, isPDF });
  };

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      showToastMsg('File size must be less than 5MB', 'error');
      return;
    }

    const token = localStorage.getItem('token');
    const formData = new FormData();
    formData.append('file', file);

    setLoadingDetails(true);
    try {
      const res = await fetch(`/api/students/${selectedStudent._id}/upload/${docType}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        showToastMsg(`${docLabels[docType] || docType} uploaded successfully`);
        await fetchStudentDetails(selectedStudent._id);
        fetchStudentsList();
      } else {
        showToastMsg(data.message || 'File upload failed', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection failed', 'error');
    } finally {
      setLoadingDetails(false);
    }
  };

  const docLabels = {
    photo: 'Passport Size Photograph',
    signature: 'Official Student Signature',
    marksheet10: '10th Class Marksheet',
    marksheet12: '12th Class Marksheet',
    aadharCard: 'Aadhar Card (Identity)',
    casteCertificate: 'Caste Certificate',
    domicileCertificate: 'Domicile Certificate'
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start h-[calc(100vh-12rem)]">
      
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* LEFT PANE: Students Selector Search List */}
      <div className="classy-card flex flex-col space-y-4 h-[400px] lg:h-[calc(100vh-12rem)] lg:sticky lg:top-6 overflow-hidden">
        <div>
          <h3 className="text-xs font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">Verification Ledger</h3>
          <span className="text-[10px] text-warm-800/40 dark:text-slate-500 font-semibold">Select applicant to audit</span>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative">
          <Search className="absolute left-3 top-3.5 w-4 h-4 text-warm-800/40 dark:text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search student name..."
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold focus:outline-none focus:border-brand-500"
          />
        </form>

        {loadingList ? (
          <Loading size="sm" text="Syncing ledger..." />
        ) : (
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {students.length === 0 ? (
              <div className="text-center py-8 text-xs text-warm-800/40 dark:text-slate-500">No applicants found.</div>
            ) : (
              students.map((s) => (
                <button
                  key={s._id}
                  onClick={() => fetchStudentDetails(s._id)}
                  className={`w-full text-left p-3.5 rounded-xl border text-xs transition-all flex flex-col space-y-2 ${
                    selectedStudent?._id === s._id
                      ? 'bg-brand-500 text-white border-brand-500 font-medium'
                      : 'bg-warm-50/30 border-warm-200/50 dark:bg-darkbg-base/30 dark:border-darkbg-border text-warm-800 dark:text-slate-400 hover:border-warm-200'
                  }`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold truncate max-w-[130px]">#{s.srNo || '-'} {s.fullName}</span>
                    <span className={`text-[9px] font-bold py-0.5 px-2 rounded-full uppercase tracking-wider ${
                      s.verificationStatus === 'Verified' 
                        ? 'bg-emerald-500/20 text-emerald-100' 
                        : s.verificationStatus === 'Rejected'
                        ? 'bg-rose-500/20 text-rose-100'
                        : 'bg-amber-500/20 text-amber-100'
                    }`}>
                      {s.verificationStatus}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[9px] opacity-80 font-semibold uppercase">
                    <span>Course: {s.courseApplied}</span>
                    <span>Marks: {s.marks12}%</span>
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* RIGHT MAIN PANE: Checklist upload & status verify grids */}
      <div className="lg:col-span-3 classy-card flex flex-col space-y-6 h-full overflow-y-auto">
        
        {loadingDetails ? (
          <Loading size="md" text="Syncing applicant records..." />
        ) : !selectedStudent ? (
          <div className="text-center py-20 text-xs text-warm-800/40 dark:text-slate-500 flex flex-col space-y-2 justify-center items-center h-full">
            <span>No student selected.</span>
            <span>Please select a student from the left verification ledger panel.</span>
          </div>
        ) : (
          <div className="flex flex-col space-y-6">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-warm-200/40 dark:border-darkbg-border pb-4.5 gap-4">
              <div>
                <h3 className="text-lg font-serif font-semibold text-warm-900 dark:text-slate-100 leading-none">#{selectedStudent.srNo || '-'} - {selectedStudent.fullName}</h3>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-warm-850 dark:text-slate-400 mt-2.5">
                  <span>Category: <strong className="text-brand-600 dark:text-brand-300">{selectedStudent.category}</strong></span>
                  <span>•</span>
                  <span>Applied Course: <strong className="text-brand-600 dark:text-brand-300">{selectedStudent.courseApplied}</strong></span>
                  <span>•</span>
                  <span>12th Marks: <strong className="text-brand-600 dark:text-brand-300">{selectedStudent.marks12}%</strong></span>
                </div>
              </div>

              {/* Status Indicator */}
              <div className="flex items-center space-x-2.5">
                <span className="text-xs font-bold text-warm-800/50 dark:text-slate-500">PROFILE STATUS:</span>
                <span className={`px-3.5 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  selectedStudent.verificationStatus === 'Verified' 
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                    : selectedStudent.verificationStatus === 'Rejected'
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'
                    : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                }`}>
                  {selectedStudent.verificationStatus}
                </span>
              </div>
            </div>

            {/* Warning Alert Panel for Caste requirements */}
            {selectedStudent.category !== 'General' && (!selectedStudent.documents.casteCertificate || !selectedStudent.documents.casteCertificate.filename) && (
              <div className="flex items-start space-x-3 p-4 bg-amber-500/10 border border-amber-500/20 text-amber-750 dark:text-amber-400 rounded-xl text-xs font-semibold">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-500" />
                <div>
                  <h5 className="font-bold">Missing Reserved Category Certificate</h5>
                  <p className="mt-0.5 leading-relaxed opacity-95">
                    Student belongs to category <strong>{selectedStudent.category}</strong>. 
                    It is mandatory to review a valid Caste Certificate to qualify for category-based seat allotments.
                  </p>
                </div>
              </div>
            )}

            {/* Essential Document Checklists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(docLabels).map(docKey => {
                const isGeneralCaste = docKey === 'casteCertificate' && selectedStudent.category === 'General';
                const doc = selectedStudent.documents?.[docKey];
                const isUploaded = doc && doc.filename;

                return (
                  <div 
                    key={docKey} 
                    className={`flex flex-col space-y-3.5 p-5 rounded-2xl border transition-all ${
                      isGeneralCaste 
                        ? 'opacity-30 pointer-events-none bg-warm-100/20 border-warm-200/20' 
                        : isUploaded
                          ? 'bg-warm-50/20 border-warm-200/50 dark:bg-darkbg-base/30 dark:border-darkbg-border'
                          : 'bg-rose-500/5 border-rose-500/10 dark:bg-rose-500/5 dark:border-rose-500/10'
                    }`}
                  >
                    {/* Header: Label & Status */}
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-warm-900 dark:text-slate-200">{docLabels[docKey]}</span>
                      {isUploaded ? (
                        <div className="flex items-center space-x-1.5">
                          {doc.status === 'Verified' && <FileCheck className="w-3.5 h-3.5 text-emerald-500" />}
                          {doc.status === 'Rejected' && <FileX className="w-3.5 h-3.5 text-rose-500" />}
                          {doc.status === 'Pending' && <Clock className="w-3.5 h-3.5 text-amber-500" />}
                          <span className={`text-[10px] font-bold uppercase tracking-wider ${
                            doc.status === 'Verified' ? 'text-emerald-500' : ''
                          } ${
                            doc.status === 'Rejected' ? 'text-rose-500' : ''
                          } ${
                            doc.status === 'Pending' ? 'text-amber-500' : ''
                          }`}>
                            {doc.status}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-rose-500 flex items-center space-x-1">
                          <AlertCircle className="w-3 h-3 text-rose-500" />
                          <span>Missing File</span>
                        </span>
                      )}
                    </div>

                    {/* Body: Action trigger zone */}
                    <div className="flex items-center space-x-2">
                      {isUploaded ? (
                        <div className="flex-1 flex items-center justify-between bg-warm-50/50 dark:bg-darkbg-base p-2.5 rounded-xl border border-warm-200/30 dark:border-darkbg-border mr-1 select-none">
                          <button
                            type="button"
                            onClick={() => handlePreview(doc.filename)}
                            className="flex items-center space-x-2 text-xs font-bold text-brand-600 hover:text-brand-700 dark:text-brand-300 hover:underline text-left truncate"
                          >
                            <FileText className="w-4 h-4 flex-shrink-0 text-brand-600" />
                            <span className="truncate max-w-[150px]">{doc.filename}</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 text-xs text-warm-800/40 dark:text-slate-500 font-semibold p-2">
                          No file uploaded yet.
                        </div>
                      )}

                      {/* Upload Button */}
                      <label className="flex items-center justify-center p-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl cursor-pointer transition-colors shadow-sm active:scale-95">
                        <Upload className="w-4 h-4" />
                        <input
                          type="file"
                          className="hidden"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => handleFileUpload(e, docKey)}
                        />
                      </label>
                    </div>

                    {/* Verification Controls (Show only if uploaded) */}
                    {isUploaded && (
                      <div className="flex flex-col space-y-2 border-t border-warm-200/40 dark:border-darkbg-border pt-3">
                        <div className="flex items-center space-x-2">
                          <select
                            value={statuses[docKey] || 'Pending'}
                            onChange={(e) => setStatuses({ ...statuses, [docKey]: e.target.value })}
                            className="px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-[11px] font-semibold outline-none text-warm-900 dark:text-slate-200"
                          >
                            <option value="Pending">Pending</option>
                            <option value="Verified">Approve</option>
                            <option value="Rejected">Reject</option>
                          </select>

                          <input
                            type="text"
                            value={remarks[docKey] || ''}
                            onChange={(e) => setRemarks({ ...remarks, [docKey]: e.target.value })}
                            placeholder="Add remarks..."
                            className="flex-1 px-2.5 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-base text-[11px] font-semibold outline-none text-warm-900 dark:text-slate-200"
                          />

                          <button
                            onClick={() => handleVerifySubmit(docKey)}
                            title="Save Verification"
                            className="p-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Global Verification Notes */}
            <div className="classy-card flex flex-col space-y-4">
              <div>
                <h4 className="text-xs font-bold text-warm-900 dark:text-slate-100 uppercase tracking-wider">Overall Profile Audit Remarks</h4>
                <span className="text-[10px] text-warm-800/40 dark:text-slate-500 font-semibold">General decision log notes regarding this applicant</span>
              </div>
              <textarea
                value={globalRemarks}
                onChange={(e) => setGlobalRemarks(e.target.value)}
                rows={3}
                placeholder="Type overall remarks regarding verification, certificates validity, pending corrections..."
                className="classy-input"
              />
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => handleGlobalDecision('Rejected')}
                  className="classy-btn-secondary border-rose-200 text-rose-600 hover:bg-rose-50 dark:border-rose-900/30 dark:text-rose-400"
                >
                  Reject Application
                </button>
                <button
                  onClick={() => handleGlobalDecision('Verified')}
                  className="classy-btn-primary bg-emerald-600 hover:bg-emerald-700"
                >
                  Approve & Verify Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: Beautiful Document Preview Box */}
      {previewFile && (
        <div className="fixed inset-0 bg-warm-900/80 dark:bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="classy-card max-w-4xl w-full h-[85vh] flex flex-col overflow-hidden bg-white dark:bg-darkbg-surface p-0 border border-warm-200 dark:border-darkbg-border">
            {/* Modal Header */}
            <div className="px-6 py-4.5 border-b border-warm-200 dark:border-darkbg-border flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-widest text-warm-800/60 dark:text-slate-400">Document Preview</span>
              <button 
                onClick={() => setPreviewFile(null)}
                className="classy-btn-secondary py-1.5 text-xs font-bold"
              >
                Close Preview
              </button>
            </div>
            
            {/* Document body container */}
            <div className="flex-1 bg-warm-50 dark:bg-darkbg-base flex items-center justify-center p-6">
              {previewFile.isPDF ? (
                <div className="flex flex-col items-center space-y-4 text-center">
                  <FileText className="w-16 h-16 text-brand-600 dark:text-brand-300" />
                  <div className="space-y-1.5">
                    <span className="text-sm font-bold text-warm-900 dark:text-white">PDF Document File</span>
                    <p className="text-xs text-warm-800/50 dark:text-slate-400 max-w-sm font-semibold">
                      Standard PDF files cannot be fully embedded inside local sandbox controls.
                    </p>
                  </div>
                  <a
                    href={previewFile.url}
                    target="_blank"
                    rel="noreferrer"
                    className="classy-btn-primary text-xs"
                  >
                    Open PDF in Browser Tab
                  </a>
                </div>
              ) : (
                <img 
                  src={previewFile.url} 
                  alt="Document Preview" 
                  className="max-w-full max-h-full object-contain rounded-lg border border-warm-200 dark:border-darkbg-border shadow-sm" 
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verification;
