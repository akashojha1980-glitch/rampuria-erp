import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Printer, Download, MapPin, 
  Phone, Mail, Calendar, User, Heart, AlertOctagon,
  CreditCard, CheckCircle, XCircle, DollarSign, Award, ShieldAlert, Trash2,
  BookOpen, Clock, Plus, TrendingUp
} from 'lucide-react';
import Loading from '../components/Loading';
import Toast from '../components/Toast';

const ProfileCard = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  // Print targets: 'card' (ID card), 'form' (Admission Form), 'receipt' (Fees Receipt)
  const [printTarget, setPrintTarget] = useState('card');
  const [activePrintPayment, setActivePrintPayment] = useState(null);
  
  // Fees states
  const [showFeeModal, setShowFeeModal] = useState(false);
  const [submittingFees, setSubmittingFees] = useState(false);
  const [feeForm, setFeeForm] = useState({
    feesAmount: '',
    feesReceiptNo: '',
    feesPaymentDate: new Date().toISOString().split('T')[0],
    feesPaymentMode: 'Cash',
    feesInstallment: 'Full Payment',
    academicYear: '1st Year',
    semester: 'Annual',
    amountDue: '0',
    dueDate: '',
    remarks: '',
    transactionNo: ''
  });

  // Promotion states
  const [showPromoteModal, setShowPromoteModal] = useState(false);
  const [submittingPromotion, setSubmittingPromotion] = useState(false);
  const [promoteForm, setPromoteForm] = useState({
    academicYear: '1st Year',
    semester: 'Annual'
  });

  const showToastMsg = (message, type = 'success') => {
    setToast({ message, type });
  };

  const fetchStudentProfile = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudent(data);
        // Pre-fill fee form with existing details if available
        if (data.feesPaid) {
          setFeeForm({
            feesAmount: '',
            feesReceiptNo: '',
            feesPaymentDate: new Date().toISOString().split('T')[0],
            feesPaymentMode: 'Cash',
            feesInstallment: 'Full Payment',
            academicYear: '1st Year',
            semester: 'Annual',
            amountDue: '0',
            dueDate: '',
            remarks: '',
            transactionNo: ''
          });
        }
        setPromoteForm({
          academicYear: data.currentYear || '1st Year',
          semester: data.currentSemester || 'Annual'
        });
      } else {
        showToastMsg(data.message || 'Error fetching profile details', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudentProfile();
  }, [id]);

  const handlePrint = (target) => {
    setPrintTarget(target);
    // Tiny timeout to let React render the active print class before dialog opens
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleCollectFeesSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFees(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${id}/fees/collect`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          academicYear: feeForm.academicYear,
          semester: feeForm.semester,
          installmentName: feeForm.feesInstallment,
          amountPaid: feeForm.feesAmount,
          amountDue: feeForm.amountDue,
          dueDate: feeForm.dueDate || null,
          receiptNo: feeForm.feesReceiptNo,
          paymentDate: feeForm.feesPaymentDate,
          paymentMode: feeForm.feesPaymentMode,
          remarks: feeForm.remarks,
          transactionNo: feeForm.transactionNo
        })
      });
      
      const data = await res.json();
      if (res.ok) {
        showToastMsg('Fees payment collected and recorded successfully!');
        setStudent(data);
        setShowFeeModal(false);
        // Reset modal form
        setFeeForm({
          feesAmount: '',
          feesReceiptNo: '',
          feesPaymentDate: new Date().toISOString().split('T')[0],
          feesPaymentMode: 'Cash',
          feesInstallment: 'Full Payment',
          academicYear: '1st Year',
          semester: 'Annual',
          amountDue: '0',
          dueDate: '',
          remarks: '',
          transactionNo: ''
        });
      } else {
        showToastMsg(data.message || 'Error collecting fees payment', 'error');
      }
    } catch (err) {
      showToastMsg('Database connection timeout', 'error');
    } finally {
      setSubmittingFees(false);
    }
  };

  const handlePromoteSubmit = async (e) => {
    e.preventDefault();
    setSubmittingPromotion(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${id}/promote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentYear: promoteForm.academicYear,
          currentSemester: promoteForm.semester
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg('Student promoted successfully!');
        setStudent(prev => ({
          ...prev,
          currentYear: data.currentYear,
          currentSemester: data.currentSemester
        }));
        setShowPromoteModal(false);
      } else {
        showToastMsg(data.message || 'Error promoting student', 'error');
      }
    } catch (err) {
      showToastMsg('Server connection error', 'error');
    } finally {
      setSubmittingPromotion(false);
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment record? This will also revert the student status if this was the latest/only payment.')) {
      return;
    }
    
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students/${id}/fees/payment/${paymentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok) {
        showToastMsg('Payment record deleted successfully.');
        setStudent(data);
      } else {
        showToastMsg(data.message || 'Error deleting payment record', 'error');
      }
    } catch (err) {
      showToastMsg('Database offline', 'error');
    }
  };

  const handlePrintReceipt = (payment) => {
    setActivePrintPayment(payment);
    handlePrint('receipt');
  };

  // Convert numbers to words for receipt (Indian format)
  const numberToWords = (num) => {
    if (!num || isNaN(num)) return 'Zero';
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const g = ['', 'Thousand', 'Lakh', 'Crore'];
    
    const convertHundreds = (n) => {
      let str = '';
      if (n > 99) {
        str += a[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }
      if (n > 19) {
        str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
      } else if (n > 0) {
        str += a[n];
      }
      return str.trim();
    };

    let tempNum = Math.floor(num);
    let parts = [];
    if (tempNum > 0) {
      parts.push(tempNum % 1000);
      tempNum = Math.floor(tempNum / 1000);
      while (tempNum > 0) {
        parts.push(tempNum % 100);
        tempNum = Math.floor(tempNum / 100);
      }
      
      let wordStr = '';
      for (let i = 0; i < parts.length; i++) {
        let partWord = convertHundreds(parts[i]);
        if (partWord !== '') {
          if (i === 0) {
            wordStr = partWord;
          } else if (i === 1) {
            wordStr = partWord + ' Thousand ' + wordStr;
          } else if (i === 2) {
            wordStr = partWord + ' Lakh ' + wordStr;
          } else if (i === 3) {
            wordStr = partWord + ' Crore ' + wordStr;
          }
        }
      }
      return wordStr.trim() + ' Rupees Only';
    }
    return 'Zero Rupees';
  };

  if (loading) {
    return <Loading size="lg" text="Generating secure student profile..." />;
  }

  if (!student) {
    return (
      <div className="text-center py-20 glass-panel p-8 max-w-md mx-auto flex flex-col space-y-4 items-center">
        <AlertOctagon className="w-16 h-16 text-rose-500" />
        <h3 className="text-base font-bold text-slate-800 dark:text-white">Profile Registry Error</h3>
        <p className="text-xs text-slate-400">The requested student admission record was not found or is inactive.</p>
        <button onClick={() => navigate('/registration')} className="classy-btn-secondary text-xs py-2 px-4">Back to Registry</button>
      </div>
    );
  }

  const photoUrl = student.documents?.photo?.filename 
    ? `/uploads/${student.documents.photo.filename}` 
    : 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=60';

  const paymentsList = student.payments || [];
  const totalFeesPaid = paymentsList.reduce((sum, p) => sum + (p.amountPaid || 0), 0);
  const sortedPayments = [...paymentsList].sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate) || new Date(b.createdAt) - new Date(a.createdAt));
  const latestPaymentRecord = sortedPayments[0] || null;
  const currentOutstanding = latestPaymentRecord ? latestPaymentRecord.amountDue : 0;
  const duesDeadline = latestPaymentRecord && latestPaymentRecord.dueDate 
    ? new Date(latestPaymentRecord.dueDate).toLocaleDateString() 
    : 'No Dues / N/A';

  const issuesList = student.issues || [];
  const activeIssuesList = issuesList.filter(i => i.status === 'Issued');
  const totalLibraryFines = issuesList.reduce((sum, i) => sum + (i.fineAmount || 0), 0);
  const sortedIssues = [...issuesList].sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate) || new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <div className="flex flex-col space-y-6">
      
      {/* Toast Alert */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* ========================================== */}
      {/* SCREEN VIEW LAYOUT (Hidden when printing)  */}
      {/* ========================================== */}
      <div className="screen-container no-print flex flex-col space-y-6">
        
        {/* Navigation / Actions Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <button
            onClick={() => navigate('/registration')}
            className="flex items-center space-x-2 px-4 py-2.5 bg-warm-100 hover:bg-warm-250/60 dark:bg-darkbg-surface dark:hover:bg-darkbg-border text-xs font-bold text-warm-800 dark:text-slate-300 rounded-xl transition-all border border-warm-200/50 dark:border-darkbg-border"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Student Registry</span>
          </button>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handlePrint('dossier')}
              className="classy-btn-secondary text-xs font-bold flex items-center space-x-2 py-2.5 px-4 bg-purple-50/50 dark:bg-purple-500/10 border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-400"
            >
              <Printer className="w-4 h-4 text-purple-650" />
              <span>Print Dossier</span>
            </button>

            <button
              onClick={() => setShowPromoteModal(true)}
              className="classy-btn-secondary text-xs font-bold flex items-center space-x-2 py-2.5 px-4 bg-indigo-50/50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30 text-indigo-700 dark:text-indigo-400"
            >
              <TrendingUp className="w-4 h-4 text-indigo-650" />
              <span>Promote</span>
            </button>

            <button
              onClick={() => handlePrint('form')}
              className="classy-btn-secondary text-xs font-bold flex items-center space-x-2 py-2.5 px-4"
            >
              <Printer className="w-4 h-4 text-warm-700" />
              <span>Print Admission Form</span>
            </button>

            {student.feesPaid && (
              <button
                onClick={() => {
                  setActivePrintPayment(null);
                  handlePrint('receipt');
                }}
                className="classy-btn-secondary text-xs font-bold flex items-center space-x-2 py-2.5 px-4 bg-emerald-50/50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400"
              >
                <Printer className="w-4 h-4" />
                <span>Print Fee Receipt</span>
              </button>
            )}

            <button
              onClick={() => handlePrint('card')}
              className="classy-btn-primary text-xs font-bold flex items-center space-x-2 py-2.5 px-4"
            >
              <Printer className="w-4 h-4" />
              <span>Print ID Card</span>
            </button>
          </div>
        </div>

        {/* Profile Details Page Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN: Student ID card & Verification Details */}
          <div className="lg:col-span-1 flex flex-col space-y-6">
            
            {/* Visual Student Card Preview */}
            <div className="classy-card relative overflow-hidden bg-white dark:bg-darkbg-surface shadow-lg flex flex-col space-y-6">
              <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-brand-600 via-indigo-600 to-fuchsia-600" />
              
              <div className="flex items-center space-x-3 pt-2">
                <div className="w-10 h-10 bg-brand-500 text-white rounded-xl flex items-center justify-center font-extrabold text-lg shadow-md shadow-brand-500/20">
                  🎓
                </div>
                <div>
                  <h2 className="text-xs font-extrabold tracking-tight text-slate-800 dark:text-white uppercase leading-none">B.J.S. Rampuria Jain Law College</h2>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1 inline-block">Student Admission ID</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-1">
                  <div className="w-full aspect-[3/4] rounded-xl overflow-hidden border border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base flex items-center justify-center p-0.5 shadow-sm">
                    <img 
                      src={photoUrl} 
                      alt="Student Photo" 
                      className="w-full h-full object-cover rounded-lg"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&auto=format&fit=crop&q=60';
                      }}
                    />
                  </div>
                </div>
                <div className="col-span-2 flex flex-col justify-between py-1">
                  <div>
                    <h3 className="text-sm font-black text-warm-900 dark:text-white leading-tight">{student.fullName}</h3>
                    <span className="text-[9px] font-bold text-brand-600 dark:text-brand-300 uppercase mt-0.5 tracking-wider inline-block">{student.courseApplied}</span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-warm-800/40 dark:text-slate-500">Reg ID</span>
                      <span className="text-[10px] font-bold text-warm-800 dark:text-slate-300 tracking-wider leading-none">{student.registrationId}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[8px] font-bold uppercase text-warm-800/40 dark:text-slate-500">SR No</span>
                      <span className="text-[10px] font-bold text-warm-800 dark:text-slate-300 leading-none">#{student.srNo}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-warm-200/40 dark:border-darkbg-border pt-4 flex items-center justify-between text-xs">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold uppercase text-warm-800/40 dark:text-slate-500">Form Number</span>
                  <span className="text-[10px] font-black text-warm-800 dark:text-slate-200">{student.formNo || '-'}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[8px] font-bold uppercase text-warm-800/40 dark:text-slate-500">Admission Base</span>
                  <span className="text-[10px] font-black text-indigo-500">{student.admissionBase}</span>
                </div>
              </div>
            </div>

            {/* Document verification card */}
            <div className="classy-card flex flex-col space-y-4">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-brand-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-warm-800 dark:text-white">Verification Status</h3>
              </div>
              <div className="flex items-center space-x-3 bg-warm-50 dark:bg-darkbg-base p-3 rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                {student.verificationStatus === 'Verified' ? (
                  <CheckCircle className="w-6 h-6 text-emerald-500" />
                ) : student.verificationStatus === 'Rejected' ? (
                  <XCircle className="w-6 h-6 text-rose-500" />
                ) : (
                  <ShieldAlert className="w-6 h-6 text-amber-500" />
                )}
                <div>
                  <h4 className="text-xs font-bold text-warm-900 dark:text-white">{student.verificationStatus}</h4>
                  <p className="text-[10px] font-medium text-warm-850/40 dark:text-slate-400 mt-0.5">Documents & eligibility status</p>
                </div>
              </div>
              {student.verificationRemarks && (
                <div className="text-[11px] font-medium text-warm-800/60 dark:text-slate-400 italic bg-amber-500/5 border border-amber-500/10 p-2.5 rounded-lg">
                  <strong>Office Remarks:</strong> {student.verificationRemarks}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: Fees details & Academic profile */}
          <div className="lg:col-span-2 flex flex-col space-y-6">
            
            {/* FEE COLLECTION CARD */}
            <div className={`classy-card border-l-4 ${student.feesPaid ? 'border-l-emerald-500' : 'border-l-amber-500'} flex flex-col space-y-5`}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-100 dark:border-darkbg-border pb-3">
                <div className="flex items-center space-x-2">
                  <CreditCard className="w-5 h-5 text-brand-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-warm-800 dark:text-white">Student Fees Ledger & Installments</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                    student.feesPaid 
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' 
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
                  }`}>
                    {student.feesPaid ? `${paymentsList.length} Installment(s) Paid` : 'No Payments Recorded'}
                  </span>
                  <button
                    onClick={() => setShowFeeModal(true)}
                    className="classy-btn-primary text-xs font-bold py-2 px-4 h-9"
                  >
                    Collect Fee Payment
                  </button>
                </div>
              </div>

              {/* Ledger Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 p-3.5 rounded-xl flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Total Fees Paid</span>
                  <strong className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base mt-1">₹{totalFeesPaid.toLocaleString()}/-</strong>
                  <span className="text-[9px] text-slate-400 mt-0.5">Across all installments</span>
                </div>

                <div className={`${currentOutstanding > 0 ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10' : 'bg-warm-50 dark:bg-darkbg-base border-warm-200/50 dark:border-darkbg-border'} border p-3.5 rounded-xl flex flex-col`}>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Current Outstanding Dues</span>
                  <strong className={`font-extrabold text-base mt-1 ${currentOutstanding > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>₹{currentOutstanding.toLocaleString()}/-</strong>
                  <span className="text-[9px] text-slate-400 mt-0.5">Pending college dues balance</span>
                </div>

                <div className="bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 p-3.5 rounded-xl flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Next Dues Deadline</span>
                  <strong className="font-extrabold text-indigo-600 dark:text-indigo-400 text-sm mt-1.5">{duesDeadline}</strong>
                  <span className="text-[9px] text-slate-400 mt-0.5">Next installment due date</span>
                </div>
              </div>

              {/* Installment History Table / Timeline */}
              <div className="flex flex-col space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction Timeline & Ledger Details</h4>
                
                <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border bg-warm-50/25 dark:bg-darkbg-base/20">
                  <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border text-xs text-left">
                    <thead className="bg-warm-50 dark:bg-darkbg-base text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Date</th>
                        <th className="px-4 py-3">Receipt No</th>
                        <th className="px-4 py-3">Period (Year/Sem)</th>
                        <th className="px-4 py-3">Installment Type</th>
                        <th className="px-4 py-3">Amount Paid</th>
                        <th className="px-4 py-3">Dues Left</th>
                        <th className="px-4 py-3">Payment Mode</th>
                        <th className="px-4 py-3">Remarks</th>
                        <th className="px-4 py-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border font-medium">
                      {paymentsList.length > 0 ? (
                        paymentsList.map((payment) => (
                          <tr key={payment.id || payment._id} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-surface/30 transition-colors">
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold text-slate-700 dark:text-slate-300">{payment.receiptNo}</td>
                            <td className="px-4 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                              {payment.academicYear} • {payment.semester}
                            </td>
                            <td className="px-4 py-3 text-indigo-600 dark:text-indigo-400 font-bold">{payment.installmentName}</td>
                            <td className="px-4 py-3 font-extrabold text-emerald-600 dark:text-emerald-400">₹{(payment.amountPaid || 0).toLocaleString()}</td>
                            <td className="px-4 py-3 font-bold text-rose-500">
                              {payment.amountDue > 0 ? `₹${payment.amountDue.toLocaleString()}` : 'Nil'}
                            </td>
                            <td className="px-4 py-3 text-slate-400 whitespace-nowrap">{payment.paymentMode}</td>
                            <td className="px-4 py-3 text-slate-400 italic max-w-[150px] truncate" title={payment.remarks || ''}>
                              {payment.remarks || '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center justify-center space-x-2.5">
                                <button
                                  onClick={() => handlePrintReceipt(payment)}
                                  className="p-1.5 hover:bg-brand-50 dark:hover:bg-brand-950/20 text-brand-600 dark:text-brand-400 rounded-lg transition-all"
                                  title="Print Receipt copy"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePayment(payment.id || payment._id)}
                                  className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/25 text-rose-500 rounded-lg transition-all"
                                  title="Delete transaction record"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="px-4 py-8 text-center text-slate-400 bg-white dark:bg-darkbg-surface">
                            <CreditCard className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            No fees installments collected for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ADMISSION PROFILE DETAILS */}
            <div className="classy-card flex flex-col space-y-6">
              <div className="flex items-center space-x-2 border-b border-warm-200/40 dark:border-darkbg-border pb-3">
                <User className="w-5 h-5 text-brand-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-warm-800 dark:text-white">Admission Registry Profile</h3>
              </div>

              {/* Grid block */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 text-xs font-medium">
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Applied Course</span>
                  <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.courseApplied}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Medium</span>
                  <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.medium || 'English'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Aadhar Card Number</span>
                  <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.aadharNo || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">WhatsApp Contact</span>
                  <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.whatsAppNo || '-'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Father's Yearly Income</span>
                  <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">₹{student.yearlyIncomeFather ? student.yearlyIncomeFather.toLocaleString() : '0'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Mother's Yearly Income</span>
                  <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">₹{student.yearlyIncomeMother ? student.yearlyIncomeMother.toLocaleString() : '0'}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Present Address</span>
                  <span className="font-semibold text-warm-850 dark:text-slate-400 mt-0.5">{student.address}, {student.city}, {student.state} - {student.pincode}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Permanent Address</span>
                  <span className="font-semibold text-warm-850 dark:text-slate-400 mt-0.5">{student.permanentAddress || student.address}</span>
                </div>
              </div>
            </div>

            {/* QUALIFYING EXAM */}
            <div className="classy-card flex flex-col space-y-4">
              <div className="flex items-center space-x-2 border-b border-warm-200/40 dark:border-darkbg-border pb-3">
                <Award className="w-5 h-5 text-brand-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-warm-800 dark:text-white">Qualifying Examination Details</h3>
              </div>
              {student.qualExamName ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-medium">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Exam Name</span>
                    <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.qualExamName}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400">University / Board</span>
                    <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.qualUniversity}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Passing Year / Type</span>
                    <span className="font-bold text-warm-900 dark:text-slate-200 mt-0.5">{student.qualYear} ({student.qualType || 'Regular'})</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-bold uppercase text-slate-400">Marks (Obt / Max) • %</span>
                    <span className="font-extrabold text-brand-600 dark:text-brand-300 mt-0.5">{student.qualObtainedMarks} / {student.qualMaxMarks} ({student.qualPercentage}%)</span>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-warm-800/40 dark:text-slate-500 italic">No qualifying examination registered.</div>
              )}
            </div>

            {/* ACADEMIC HISTORY */}
            <div className="classy-card flex flex-col space-y-4">
              <div className="flex items-center space-x-2 border-b border-warm-200/40 dark:border-darkbg-border pb-3">
                <Award className="w-5 h-5 text-brand-500" />
                <h3 className="text-xs font-black uppercase tracking-wider text-warm-800 dark:text-white">Details of Academic Examinations Passed</h3>
              </div>
              <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border">
                <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border text-xs text-left">
                  <thead className="bg-warm-50 dark:bg-darkbg-base text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    <tr>
                      <th className="px-4 py-2.5">Exam</th>
                      <th className="px-4 py-2.5">Board / University</th>
                      <th className="px-4 py-2.5">Year</th>
                      <th className="px-4 py-2.5">Main Subjects</th>
                      <th className="px-4 py-2.5">Marks (Obt/Max)</th>
                      <th className="px-4 py-2.5">Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border font-medium">
                    {/* 10th */}
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">Secondary (10th)</td>
                      <td className="px-4 py-2.5">{student.board10}</td>
                      <td className="px-4 py-2.5">{student.passingYear10}</td>
                      <td className="px-4 py-2.5 text-slate-400">All General Subjects</td>
                      <td className="px-4 py-2.5">{student.obtainedMarks10} / {student.maxMarks10}</td>
                      <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">{student.marks10}%</td>
                    </tr>
                    {/* 12th */}
                    <tr>
                      <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">Sr. Secondary (12th)</td>
                      <td className="px-4 py-2.5">{student.board12}</td>
                      <td className="px-4 py-2.5">{student.passingYear12}</td>
                      <td className="px-4 py-2.5">{student.subject12}</td>
                      <td className="px-4 py-2.5">{student.obtainedMarks12} / {student.maxMarks12}</td>
                      <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">{student.marks12}%</td>
                    </tr>
                    {/* Graduation */}
                    {student.gradUniversity && (
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">Graduation</td>
                        <td className="px-4 py-2.5">{student.gradUniversity}</td>
                        <td className="px-4 py-2.5">{student.gradYear}</td>
                        <td className="px-4 py-2.5">{student.gradSubject}</td>
                        <td className="px-4 py-2.5">{student.gradObtainedMarks} / {student.gradMaxMarks}</td>
                        <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">{student.gradPercentage}%</td>
                      </tr>
                    )}
                    {/* PG */}
                    {student.pgUniversity && (
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">Post Graduation</td>
                        <td className="px-4 py-2.5">{student.pgUniversity}</td>
                        <td className="px-4 py-2.5">{student.pgYear}</td>
                        <td className="px-4 py-2.5">{student.pgSubject}</td>
                        <td className="px-4 py-2.5">{student.pgObtainedMarks} / {student.pgMaxMarks}</td>
                        <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">{student.pgPercentage}%</td>
                      </tr>
                    )}
                    {/* Other */}
                    {student.otherExamName && (
                      <tr>
                        <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">{student.otherExamName}</td>
                        <td className="px-4 py-2.5">{student.otherUniversity}</td>
                        <td className="px-4 py-2.5">{student.otherYear}</td>
                        <td className="px-4 py-2.5">{student.otherSubject}</td>
                        <td className="px-4 py-2.5">{student.otherObtainedMarks} / {student.otherMaxMarks}</td>
                        <td className="px-4 py-2.5 font-bold text-warm-900 dark:text-slate-200">{student.otherPercentage}%</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LIBRARY BOOK REGISTRY CARD */}
            <div className="classy-card flex flex-col space-y-5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warm-100 dark:border-darkbg-border pb-3">
                <div className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-brand-500" />
                  <h3 className="text-xs font-black uppercase tracking-wider text-warm-800 dark:text-white">Library Book Registry & Fine Ledger</h3>
                </div>
                <button
                  onClick={() => navigate(`/library?studentId=${student._id}`)}
                  className="classy-btn-primary text-xs font-bold py-2 px-4 h-9 flex items-center space-x-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Issue Book</span>
                </button>
              </div>

              {/* Library Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-brand-500/5 dark:bg-brand-500/10 border border-brand-500/10 p-3.5 rounded-xl flex flex-col">
                  <span className="text-[9px] font-bold uppercase text-slate-400">Active Books Checked Out</span>
                  <strong className="font-extrabold text-brand-600 dark:text-brand-400 text-base mt-1">
                    {activeIssuesList.length} Book(s)
                  </strong>
                  <span className="text-[9px] text-slate-400 mt-0.5">Currently issued & unreturned</span>
                </div>

                <div className={`${totalLibraryFines > 0 ? 'bg-rose-500/5 dark:bg-rose-500/10 border-rose-500/10' : 'bg-warm-50 dark:bg-darkbg-base border-warm-200/50 dark:border-darkbg-border'} border p-3.5 rounded-xl flex flex-col`}>
                  <span className="text-[9px] font-bold uppercase text-slate-400">Total Library Fines / Charges</span>
                  <strong className={`font-extrabold text-base mt-1 ${totalLibraryFines > 0 ? 'text-rose-500' : 'text-slate-500 dark:text-slate-400'}`}>
                    ₹{totalLibraryFines.toLocaleString()}/-
                  </strong>
                  <span className="text-[9px] text-slate-400 mt-0.5">Accumulated return delays / replacement fees</span>
                </div>
              </div>

              {/* Library Books Issue Logs List */}
              <div className="flex flex-col space-y-2 pt-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Book Issue & Return Log</h4>
                
                <div className="overflow-x-auto rounded-xl border border-warm-200/50 dark:border-darkbg-border bg-warm-50/25 dark:bg-darkbg-base/20">
                  <table className="min-w-full divide-y divide-warm-200/30 dark:divide-darkbg-border text-xs text-left">
                    <thead className="bg-warm-50 dark:bg-darkbg-base text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Book Accession</th>
                        <th className="px-4 py-3">Book Title / Author</th>
                        <th className="px-4 py-3">Issue Date</th>
                        <th className="px-4 py-3">Due Date</th>
                        <th className="px-4 py-3">Return Date</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3">Fines Charged</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-warm-200/20 dark:divide-darkbg-border font-medium">
                      {sortedIssues.length > 0 ? (
                        sortedIssues.map((issue) => (
                          <tr key={issue.id || issue._id} className="hover:bg-warm-50/50 dark:hover:bg-darkbg-surface/30 transition-colors text-slate-700 dark:text-slate-400">
                            <td className="px-4 py-3 font-mono font-bold text-indigo-655 dark:text-indigo-400">
                              #{issue.book?.bookNo}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col">
                                <span className="font-bold text-warm-900 dark:text-slate-200">{issue.book?.title}</span>
                                <span className="text-[9px] text-slate-400 italic mt-0.5">By {issue.book?.author}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {issue.issueDate ? new Date(issue.issueDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {issue.dueDate ? new Date(issue.dueDate).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                              {issue.returnDate ? new Date(issue.returnDate).toLocaleDateString() : '-'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                                issue.status === 'Returned'
                                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-550/15 dark:text-emerald-400'
                                  : issue.status === 'Lost'
                                  ? 'bg-rose-50 text-rose-700 dark:bg-rose-550/15 dark:text-rose-400'
                                  : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-550/15 dark:text-indigo-400'
                              }`}>
                                {issue.status}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-bold">
                              {issue.fineAmount > 0 ? (
                                <span className="text-rose-500">₹{issue.fineAmount}</span>
                              ) : (
                                <span className="text-slate-400">Nil</span>
                              )}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="px-4 py-8 text-center text-slate-400 bg-white dark:bg-darkbg-surface">
                            <BookOpen className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                            No library transactions recorded for this student.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ========================================== */}
      {/* FEES COLLECTION MODAL DIALOG               */}
      {/* ========================================== */}
      {showFeeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-lg rounded-2xl p-6 shadow-2xl flex flex-col space-y-5">
            
            <div className="flex justify-between items-center border-b border-warm-100 dark:border-darkbg-border pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-warm-900 dark:text-white">
                Collect Fees Payment
              </h3>
              <button 
                onClick={() => setShowFeeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-border"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCollectFeesSubmit} className="space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                {/* Amount */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Amount Collected (INR) *</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-warm-650 font-bold text-sm select-none">₹</span>
                    <input
                      type="number"
                      value={feeForm.feesAmount}
                      onChange={(e) => setFeeForm(prev => ({ ...prev, feesAmount: e.target.value }))}
                      placeholder="e.g. 12500"
                      className="classy-input"
                      style={{ paddingLeft: '3rem' }}
                      required
                    />
                  </div>
                </div>

                {/* Receipt No */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Receipt / Challan No *</label>
                  <input
                    type="text"
                    value={feeForm.feesReceiptNo}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, feesReceiptNo: e.target.value }))}
                    placeholder="e.g. REC-58402"
                    className="classy-input"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Payment Date */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Date *</label>
                  <input
                    type="date"
                    value={feeForm.feesPaymentDate}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, feesPaymentDate: e.target.value }))}
                    className="classy-input"
                    required
                  />
                </div>

                {/* Payment Mode */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Mode *</label>
                  <select
                    value={feeForm.feesPaymentMode}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, feesPaymentMode: e.target.value }))}
                    className="classy-input"
                    required
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online (UPI/NetBanking)">Online (UPI/NetBanking)</option>
                    <option value="Bank Challan">Bank Challan</option>
                    <option value="Credit/Debit Card">Credit/Debit Card</option>
                  </select>
                </div>
              </div>

              {/* Transaction Number row if UPI/Online/Card */}
              {(feeForm.feesPaymentMode === 'Online (UPI/NetBanking)' || feeForm.feesPaymentMode === 'Credit/Debit Card') && (
                <div className="flex flex-col space-y-1 animate-fade-in">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Transaction / UTR Number *</label>
                  <input
                    type="text"
                    value={feeForm.transactionNo || ''}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, transactionNo: e.target.value }))}
                    placeholder="e.g. UPI-923840294829"
                    className="classy-input font-mono"
                    required
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {/* Academic Year */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year *</label>
                  <select
                    value={feeForm.academicYear}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, academicYear: e.target.value }))}
                    className="classy-input"
                    required
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                  </select>
                </div>

                {/* Semester */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester *</label>
                  <select
                    value={feeForm.semester}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, semester: e.target.value }))}
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
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Installment / Fee Type */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Installment / Fee Type *</label>
                  <select
                    value={feeForm.feesInstallment}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, feesInstallment: e.target.value }))}
                    className="classy-input"
                    required
                  >
                    <option value="Full Payment">Full Payment (Full Fee)</option>
                    <option value="1st Installment">1st Installment</option>
                    <option value="2nd Installment">2nd Installment</option>
                    <option value="3rd Installment">3rd Installment</option>
                    <option value="Admission Fee">Admission Fee</option>
                    <option value="Other">Other Fee</option>
                  </select>
                </div>

                {/* Amount Due (Outstanding) */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dues Outstanding (INR)</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-3 text-warm-650 font-bold text-sm select-none">₹</span>
                    <input
                      type="number"
                      value={feeForm.amountDue}
                      onChange={(e) => setFeeForm(prev => ({ ...prev, amountDue: e.target.value }))}
                      placeholder="0"
                      className="classy-input"
                      style={{ paddingLeft: '3rem' }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {/* Next Due Date */}
                <div className="flex flex-col space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Dues Due Date</label>
                  <input
                    type="date"
                    value={feeForm.dueDate}
                    onChange={(e) => setFeeForm(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="classy-input"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remarks / Notes</label>
                <textarea
                  value={feeForm.remarks}
                  onChange={(e) => setFeeForm(prev => ({ ...prev, remarks: e.target.value }))}
                  placeholder="Enter payment notes..."
                  className="classy-input h-20 resize-none py-2"
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-warm-100 dark:border-darkbg-border">
                <button
                  type="button"
                  onClick={() => setShowFeeModal(false)}
                  className="classy-btn-secondary py-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingFees}
                  className="classy-btn-primary py-2 px-5"
                >
                  {submittingFees ? 'Saving...' : 'Confirm payment'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* PRINT-ONLY: STUDENT ID CARD VIEW (Active on 'card' print)  */}
      {/* ========================================================== */}
      <div className={`print-only font-sans p-6 text-black bg-white max-w-lg mx-auto ${printTarget === 'card' ? 'active-print' : 'hidden'}`}>
        <div className="border-2 border-double border-black rounded-2xl p-6 flex flex-col space-y-6 relative bg-white">
          <div className="flex items-center space-x-4 border-b border-black pb-4">
            <div className="w-12 h-12 border border-black rounded-lg flex items-center justify-center font-bold text-xl bg-slate-100">
              🎓
            </div>
            <div>
              <h2 className="text-sm font-black tracking-tight uppercase leading-none">B.J.S. Rampuria Jain Law College</h2>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest leading-none mt-1 inline-block">Student Admissions ID Card</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-1">
              <div className="w-full aspect-[3/4] border border-black p-0.5 rounded-lg">
                <img 
                  src={photoUrl} 
                  alt="Student Photo" 
                  className="w-full h-full object-cover rounded"
                />
              </div>
            </div>
            <div className="col-span-2 flex flex-col justify-between py-1 text-xs">
              <div className="space-y-1">
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Student Name</span>
                  <span className="font-extrabold text-sm">{student.fullName}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[8px] font-bold text-gray-500 uppercase">Course Applied</span>
                  <span className="font-bold text-black">{student.courseApplied}</span>
                </div>
              </div>
              <div className="space-y-0.5 mt-2">
                <div><strong>Reg ID:</strong> {student.registrationId}</div>
                <div><strong>SR No:</strong> #{student.srNo}</div>
                <div><strong>DOB:</strong> {new Date(student.dateOfBirth).toLocaleDateString()}</div>
                <div><strong>Mobile:</strong> {student.mobileNumber}</div>
              </div>
            </div>
          </div>

          <div className="border-t border-black pt-4 flex items-center justify-between text-[10px]">
            <div className="flex flex-col">
              <strong>Form No:</strong> {student.formNo || '-'}
            </div>
            <div className="flex flex-col text-right">
              <strong>Account No:</strong> {student.studentAccNo || '-'}
            </div>
          </div>

          <div className="flex justify-between items-end pt-4 text-[8px] font-bold">
            <div className="text-center">
              <div className="h-6 w-20 border border-dashed border-gray-400 rounded flex items-center justify-center mb-1">
                <span className="text-[6px] text-gray-400">OFFICIAL STAMP</span>
              </div>
              <span>Authority Stamp</span>
            </div>
            <div className="text-center">
              <div className="h-6 w-20 mb-1" />
              <span>Officer Signature</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================= */}
      {/* PRINT-ONLY: HIGH-FIDELITY ADMISSION APPLICATION FORM          */}
      {/* ============================================================= */}
      <div className={`print-only font-serif p-8 text-black bg-white max-w-4xl mx-auto border border-black ${printTarget === 'form' ? 'active-print' : 'hidden'}`}>
        
        {/* Double border header box */}
        <div className="border-4 border-double border-black p-4 flex flex-col items-center justify-center text-center space-y-1 relative mb-6">
          <h1 className="text-xl font-bold tracking-tight uppercase">B.J.S. Rampuria Jain Law College, Bikaner</h1>
          <h2 className="text-xs font-semibold uppercase">(Affiliated to Maharaja Ganga Singh University, Bikaner)</h2>
          <h3 className="text-sm font-black underline uppercase mt-2 tracking-wide">ADMISSION APPLICATION FORM (ACADEMIC YEAR 2026-27)</h3>
          
          {/* Form and account numbers row */}
          <div className="w-full flex justify-between text-xs pt-4 font-sans font-bold">
            <div>Form No: <span className="underline">{student.formNo || '___________'}</span></div>
            <div>Student Account No: <span className="underline">{student.studentAccNo || '___________'}</span></div>
            <div>SR No: <span className="underline">#{student.srNo}</span></div>
          </div>
        </div>

        {/* Top Grid: Course/photo layout */}
        <div className="grid grid-cols-4 gap-6 items-start mb-6">
          <div className="col-span-3 text-xs space-y-3 font-sans">
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Admission Base:</strong> <span className="underline font-bold text-sm">{student.admissionBase}</span></div>
              <div><strong>Course Applied:</strong> <span className="underline font-bold text-sm">{student.courseApplied}</span></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><strong>Medium of Instruction:</strong> <span className="underline font-bold">{student.medium || 'English'}</span></div>
              <div><strong>Registration Date:</strong> <span className="underline">{new Date(student.createdAt).toLocaleDateString()}</span></div>
            </div>
            <div>
              <strong>Aadhar Card Number:</strong> <span className="underline font-bold tracking-wider">{student.aadharNo || '__________________'}</span>
            </div>
            <div>
              <strong>Category Quota:</strong> <span className="underline font-bold">{student.category}</span>
            </div>
          </div>
          
          {/* Photo box */}
          <div className="col-span-1 flex justify-end">
            <div className="w-32 h-40 border border-black border-dashed flex flex-col items-center justify-center text-center p-1.5 bg-gray-50 relative">
              {student.documents?.photo?.filename ? (
                <img src={photoUrl} alt="Photo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-[8px] text-gray-400 font-bold uppercase">Affix Passport Size Photo Here</span>
              )}
            </div>
          </div>
        </div>

        {/* Section 1: Candidate Personal Details */}
        <div className="space-y-3 text-xs mb-6">
          <div className="bg-gray-150 font-bold uppercase p-1 border border-black tracking-wide text-center">1. Personal Profile Details</div>
          
          <table className="w-full border-collapse border border-black">
            <tbody>
              <tr className="border-b border-black">
                <td className="w-1/3 p-2 bg-gray-50 border-r border-black font-bold">1. Full Name of Candidate</td>
                <td className="p-2 font-bold uppercase">{student.fullName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">2. Father's Name</td>
                <td className="p-2 font-semibold">{student.fatherName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">3. Mother's Name</td>
                <td className="p-2 font-semibold">{student.motherName}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">4. Date of Birth / Gender</td>
                <td className="p-2 font-semibold">{new Date(student.dateOfBirth).toLocaleDateString()} / {student.gender}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">5. Parents Annual Income</td>
                <td className="p-2">
                  Father: <strong>₹{student.yearlyIncomeFather ? student.yearlyIncomeFather.toLocaleString() : 'N/A'}</strong> &nbsp;|&nbsp; 
                  Mother: <strong>₹{student.yearlyIncomeMother ? student.yearlyIncomeMother.toLocaleString() : 'N/A'}</strong>
                </td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">6. WhatsApp / Mobile Number</td>
                <td className="p-2 font-semibold">{student.whatsAppNo || student.mobileNumber} / {student.mobileNumber}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">7. Alternate Mobile / Guardian Contact</td>
                <td className="p-2 font-semibold">{student.alternateMobile || '-'} / {student.parentsContact || '-'}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">8. Email Address</td>
                <td className="p-2">{student.email}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 bg-gray-50 border-r border-black font-bold">9. Present / Mailing Address</td>
                <td className="p-2">{student.address}, {student.city}, {student.state} - {student.pincode}</td>
              </tr>
              <tr>
                <td className="p-2 bg-gray-50 border-r border-black font-bold">10. Permanent Address</td>
                <td className="p-2">{student.permanentAddress || student.address}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 2: Details of Exams Passed */}
        <div className="space-y-3 text-xs mb-6">
          <div className="bg-gray-150 font-bold uppercase p-1 border border-black tracking-wide text-center">2. Details of Academic Examinations Passed</div>
          
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-black">
                <th className="p-2 border-r border-black text-left">Examination</th>
                <th className="p-2 border-r border-black">Board / University</th>
                <th className="p-2 border-r border-black">Passing Year</th>
                <th className="p-2 border-r border-black">Subjects</th>
                <th className="p-2 border-r border-black">Max Marks</th>
                <th className="p-2 border-r border-black">Obtained Marks</th>
                <th className="p-2">% Marks</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-black">
                <td className="p-2 border-r border-black text-left font-bold">Secondary (10th)</td>
                <td className="p-2 border-r border-black">{student.board10}</td>
                <td className="p-2 border-r border-black">{student.passingYear10}</td>
                <td className="p-2 border-r border-black text-gray-500">General Subjects</td>
                <td className="p-2 border-r border-black">{student.maxMarks10}</td>
                <td className="p-2 border-r border-black">{student.obtainedMarks10}</td>
                <td className="p-2 font-bold">{student.marks10}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 border-r border-black text-left font-bold">Sr. Secondary (12th)</td>
                <td className="p-2 border-r border-black">{student.board12}</td>
                <td className="p-2 border-r border-black">{student.passingYear12}</td>
                <td className="p-2 border-r border-black">{student.subject12}</td>
                <td className="p-2 border-r border-black">{student.maxMarks12}</td>
                <td className="p-2 border-r border-black">{student.obtainedMarks12}</td>
                <td className="p-2 font-bold">{student.marks12}%</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 border-r border-black text-left font-bold">Graduation</td>
                <td className="p-2 border-r border-black">{student.gradUniversity || '-'}</td>
                <td className="p-2 border-r border-black">{student.gradYear || '-'}</td>
                <td className="p-2 border-r border-black">{student.gradSubject || '-'}</td>
                <td className="p-2 border-r border-black">{student.gradMaxMarks || '-'}</td>
                <td className="p-2 border-r border-black">{student.gradObtainedMarks || '-'}</td>
                <td className="p-2 font-bold">{student.gradPercentage ? `${student.gradPercentage}%` : '-'}</td>
              </tr>
              <tr className="border-b border-black">
                <td className="p-2 border-r border-black text-left font-bold">Post Graduation</td>
                <td className="p-2 border-r border-black">{student.pgUniversity || '-'}</td>
                <td className="p-2 border-r border-black">{student.pgYear || '-'}</td>
                <td className="p-2 border-r border-black">{student.pgSubject || '-'}</td>
                <td className="p-2 border-r border-black">{student.pgMaxMarks || '-'}</td>
                <td className="p-2 border-r border-black">{student.pgObtainedMarks || '-'}</td>
                <td className="p-2 font-bold">{student.pgPercentage ? `${student.pgPercentage}%` : '-'}</td>
              </tr>
              <tr>
                <td className="p-2 border-r border-black text-left font-bold">{student.otherExamName || 'Other Exam'}</td>
                <td className="p-2 border-r border-black">{student.otherUniversity || '-'}</td>
                <td className="p-2 border-r border-black">{student.otherYear || '-'}</td>
                <td className="p-2 border-r border-black">{student.otherSubject || '-'}</td>
                <td className="p-2 border-r border-black">{student.otherMaxMarks || '-'}</td>
                <td className="p-2 border-r border-black">{student.otherObtainedMarks || '-'}</td>
                <td className="p-2 font-bold">{student.otherPercentage ? `${student.otherPercentage}%` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Section 3: Qualifying Exam */}
        <div className="space-y-3 text-xs mb-6">
          <div className="bg-gray-150 font-bold uppercase p-1 border border-black tracking-wide text-center">3. Details of Qualifying Examination</div>
          
          <table className="w-full border-collapse border border-black text-center text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-black">
                <th className="p-2 border-r border-black text-left">Exam Name</th>
                <th className="p-2 border-r border-black">University / Board</th>
                <th className="p-2 border-r border-black">Type</th>
                <th className="p-2 border-r border-black">Passing Year</th>
                <th className="p-2 border-r border-black">Max Marks</th>
                <th className="p-2 border-r border-black">Obtained Marks</th>
                <th className="p-2">Percentage (%)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border-r border-black text-left font-bold">{student.qualExamName || '-'}</td>
                <td className="p-2 border-r border-black">{student.qualUniversity || '-'}</td>
                <td className="p-2 border-r border-black">{student.qualType || '-'}</td>
                <td className="p-2 border-r border-black">{student.qualYear || '-'}</td>
                <td className="p-2 border-r border-black">{student.qualMaxMarks || '-'}</td>
                <td className="p-2 border-r border-black">{student.qualObtainedMarks || '-'}</td>
                <td className="p-2 font-bold">{student.qualPercentage ? `${student.qualPercentage}%` : '-'}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Declaration & Signatures */}
        <div className="space-y-4 text-xs font-sans mt-8 pt-4 border-t border-black">
          <div>
            <strong>Declaration by Applicant:</strong><br />
            <p className="italic text-gray-700 leading-relaxed text-[11px] mt-1">
              "I hereby declare that all statements made in this application are true, complete, and correct to the best of my knowledge and belief. I understand that in the event of any information being found false, my candidature/admission is liable to be cancelled at any stage by the college administration."
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 pt-8 text-center font-bold">
            <div>
              <div className="h-10 mb-1" />
              <div className="border-t border-black pt-1">Signature of Applicant</div>
            </div>
            <div>
              <div className="h-10 mb-1" />
              <div className="border-t border-black pt-1">Signature of Parent / Guardian</div>
            </div>
          </div>

          <div className="bg-gray-50 border border-black p-4 mt-8 flex flex-col space-y-4 rounded-lg">
            <span className="font-extrabold underline uppercase tracking-wider text-[10px] text-gray-700">For Admission Office Use Only</span>
            
            <div className="grid grid-cols-3 gap-6 text-center pt-8 font-bold text-[10px]">
              <div>
                <div className="h-6" />
                <div className="border-t border-black pt-1">Dealing Clerk (Verification)</div>
              </div>
              <div>
                <div className="h-6" />
                <div className="border-t border-black pt-1">Admission Committee Convener</div>
              </div>
              <div>
                <div className="h-6" />
                <div className="border-t border-black pt-1">Principal / Approving Authority</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* PRINT-ONLY: DUAL FEE PAYMENT RECEIPT (Office Copy & Student)   */}
      {/* ============================================================== */}
      {(() => {
        const displayReceiptNo = activePrintPayment ? activePrintPayment.receiptNo : student.feesReceiptNo;
        const displayInstallment = activePrintPayment ? activePrintPayment.installmentName : (student.feesInstallment || 'Full Payment');
        const displayPaymentMode = activePrintPayment ? activePrintPayment.paymentMode : (student.feesPaymentMode || 'Cash');
        const displayAmountPaid = activePrintPayment ? activePrintPayment.amountPaid : student.feesAmount;
        const displayPaymentDate = activePrintPayment ? activePrintPayment.paymentDate : student.feesPaymentDate;

        return (
          <div className={`print-only font-sans text-black bg-white max-w-2xl mx-auto p-4 ${printTarget === 'receipt' ? 'active-print' : 'hidden'}`}>
            
            {/* Receipt copy generator helper */}
            {[
              { title: 'OFFICE COPY', color: 'bg-indigo-50/50' },
              { title: 'STUDENT COPY', color: 'bg-emerald-50/50' }
            ].map((copy, index) => (
              <div key={index} className={`flex flex-col space-y-4 p-5 border border-black rounded-2xl relative bg-white ${index === 1 ? 'mt-8 border-t-2 border-dashed border-gray-400' : ''}`}>
                
                {/* Cut line helper */}
                {index === 1 && (
                  <div className="absolute -top-5.5 left-0 right-0 flex items-center justify-center text-gray-400 select-none text-[8px] font-bold tracking-widest uppercase">
                    <span className="flex-1 border-t border-dashed border-gray-300"></span>
                    <span className="px-3 flex items-center gap-1 text-[10px]">✂️ CUT RECEIPT SEPARATION LINE ✂️</span>
                    <span className="flex-1 border-t border-dashed border-gray-300"></span>
                  </div>
                )}

                {/* Receipt Header */}
                <div className="flex justify-between items-start border-b border-black pb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl">🎓</span>
                    <div>
                      <h2 className="text-xs font-black uppercase leading-none tracking-tight">B.J.S. Rampuria Jain Law College</h2>
                      <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wide mt-1 inline-block">Bikaner, Rajasthan • Fees Receipt</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[8px] font-black uppercase border border-black px-2 py-0.5 rounded tracking-wider">{copy.title}</span>
                    <span className="text-[9px] block text-gray-500 mt-1">Date: {displayPaymentDate ? new Date(displayPaymentDate).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Receipt Parameters Grid */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-2 text-xs font-semibold">
                  <div>Receipt No: <span className="underline font-bold">{displayReceiptNo || '___________'}</span></div>
                  <div>Reg ID: <span className="underline font-bold">{student.registrationId}</span></div>
                  <div>Form No: <span className="underline">{student.formNo || '-'}</span></div>
                  <div>Class/Course: <span className="underline font-bold text-indigo-700">{student.courseApplied}</span></div>
                  <div>Fee Type: <span className="underline font-bold text-brand-600">{displayInstallment || 'Full Payment'}</span></div>
                </div>

                <div className="text-xs space-y-2 leading-relaxed">
                  <div>
                    Received with thanks from Mr./Ms. <strong className="underline uppercase">{student.fullName}</strong>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>Son/Daughter of: <strong className="underline">{student.fatherName}</strong></div>
                    <div>Payment Mode: <strong className="underline">{displayPaymentMode || 'Cash'}</strong></div>
                  </div>
                  
                  {/* Payment Box */}
                  <div className="border border-black p-3 bg-gray-50 flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2 rounded-lg">
                    <div>
                      <span className="text-[9px] font-bold text-gray-500 uppercase block leading-none mb-1">A Sum of Rupees (In Words)</span>
                      <strong className="text-xs uppercase italic">{numberToWords(displayAmountPaid)}</strong>
                    </div>
                    <div className="text-right whitespace-nowrap bg-black text-white px-4 py-2 rounded font-black text-sm border border-black shadow">
                      ₹{displayAmountPaid ? displayAmountPaid.toLocaleString() : '0'} /-
                    </div>
                  </div>
                </div>

                {/* Bottom Signature Blocks */}
                <div className="flex justify-between items-end pt-6 text-[9px] font-bold">
                  <div className="text-center">
                    <div className="h-6" />
                    <span>Signature of Depositor</span>
                  </div>
                  <div className="text-center">
                    <div className="h-6 w-24 border border-dashed border-gray-400 rounded flex items-center justify-center mb-1 bg-gray-50">
                      <span className="text-[6px] text-gray-400 uppercase">OFFICIAL SEAL</span>
                    </div>
                    <span>College Accounts Officer</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        );
      })()}

      {/* STUDENT PROMOTION MODAL DIALOG */}
      {showPromoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border w-full max-w-md rounded-2xl p-6 shadow-2xl flex flex-col space-y-5">
            
            <div className="flex justify-between items-center border-b border-warm-100 dark:border-darkbg-border pb-3">
              <h3 className="text-sm font-black uppercase tracking-wider text-warm-900 dark:text-white">
                Promote Student Year / Semester
              </h3>
              <button 
                onClick={() => setShowPromoteModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-warm-100 dark:hover:bg-darkbg-border"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePromoteSubmit} className="space-y-4">
              <div className="flex flex-col space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Academic Year *</label>
                <select
                  value={promoteForm.academicYear}
                  onChange={(e) => setPromoteForm(prev => ({ ...prev, academicYear: e.target.value }))}
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
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Semester *</label>
                <select
                  value={promoteForm.semester}
                  onChange={(e) => setPromoteForm(prev => ({ ...prev, semester: e.target.value }))}
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
                  onClick={() => setShowPromoteModal(false)}
                  className="px-4 py-2 bg-warm-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs hover:bg-warm-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingPromotion}
                  className="px-4 py-2 bg-brand-650 hover:bg-brand-700 text-white font-bold rounded-xl text-xs disabled:opacity-50 transition-colors shadow-lg shadow-brand-500/20"
                >
                  {submittingPromotion ? 'Promoting...' : 'Promote Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PRINT-ONLY: COMPREHENSIVE STUDENT DOSSIER / FULL REPORT */}
      {student && (
        <div className={`print-only font-sans p-8 text-black bg-white max-w-4xl mx-auto border-2 border-slate-300 p-10 ${printTarget === 'dossier' ? 'active-print' : 'hidden'}`}>
          {/* College Header */}
          <div className="text-center border-b-2 border-slate-800 pb-5 mb-6">
            <h1 className="text-2xl font-extrabold uppercase tracking-wide">B.J.S. Rampuria Jain Law College, Bikaner</h1>
            <p className="text-sm font-semibold text-slate-700 mt-1">Complete Student Record Dossier</p>
            <div className="flex justify-between items-center text-[10px] text-slate-500 font-bold mt-4">
              <span>REGISTRATION ID: {student.registrationId}</span>
              <span>ACADEMIC YEAR: {student.currentYear || '1st Year'} | SEMESTER: {student.currentSemester || 'Annual'}</span>
              <span>PRINT DATE: {new Date().toLocaleDateString()}</span>
            </div>
          </div>

          {/* Personal Details Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-3">1. Personal & Contact Details</h2>
            <table className="w-full text-xs border border-collapse border-slate-200">
              <tbody>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 w-1/4 border border-slate-200">Full Name</td>
                  <td className="p-2 border border-slate-200">{student.fullName}</td>
                  <td className="p-2 font-bold bg-slate-50 w-1/4 border border-slate-200">SR No. / Roll No.</td>
                  <td className="p-2 border border-slate-200">#{student.srNo || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Father's Name</td>
                  <td className="p-2 border border-slate-200">{student.fatherName}</td>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Mother's Name</td>
                  <td className="p-2 border border-slate-200">{student.motherName}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Mobile Number</td>
                  <td className="p-2 border border-slate-200">{student.mobileNumber}</td>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Alternate Contact</td>
                  <td className="p-2 border border-slate-200">{student.alternateMobile || '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Email Address</td>
                  <td className="p-2 border border-slate-200">{student.email || '-'}</td>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Date of Birth</td>
                  <td className="p-2 border border-slate-200">{student.dateOfBirth}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Category</td>
                  <td className="p-2 border border-slate-200">{student.category}</td>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Gender</td>
                  <td className="p-2 border border-slate-200">{student.gender}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Address</td>
                  <td className="p-2 border border-slate-200" colSpan={3}>{student.address}, {student.city}, {student.state} - {student.pincode}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Academic Details Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-3">2. Qualifying Academic Records</h2>
            <table className="w-full text-xs text-center border border-collapse border-slate-200">
              <thead>
                <tr className="bg-slate-50 font-bold">
                  <th className="p-2 border border-slate-200">Examination</th>
                  <th className="p-2 border border-slate-200">Board / University</th>
                  <th className="p-2 border border-slate-200">Passing Year</th>
                  <th className="p-2 border border-slate-200">Obtained / Max Marks</th>
                  <th className="p-2 border border-slate-200">Percentage</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border border-slate-200 font-semibold">Class 10th</td>
                  <td className="p-2 border border-slate-200">{student.board10 || '-'}</td>
                  <td className="p-2 border border-slate-200">{student.passingYear10 || '-'}</td>
                  <td className="p-2 border border-slate-200">-</td>
                  <td className="p-2 border border-slate-200 font-bold">{student.marks10}%</td>
                </tr>
                <tr>
                  <td className="p-2 border border-slate-200 font-semibold">Class 12th</td>
                  <td className="p-2 border border-slate-200">{student.board12 || '-'}</td>
                  <td className="p-2 border border-slate-200">{student.passingYear12 || '-'}</td>
                  <td className="p-2 border border-slate-200">-</td>
                  <td className="p-2 border border-slate-200 font-bold">{student.marks12}%</td>
                </tr>
                {student.qualExamName && (
                  <tr>
                    <td className="p-2 border border-slate-200 font-semibold">{student.qualExamName} (UG/Grad)</td>
                    <td className="p-2 border border-slate-200">{student.qualUniversity || '-'}</td>
                    <td className="p-2 border border-slate-200">{student.qualYear || '-'}</td>
                    <td className="p-2 border border-slate-200">{student.qualObtainedMarks} / {student.qualMaxMarks}</td>
                    <td className="p-2 border border-slate-200 font-bold">{student.qualPercentage}%</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Verification & Admission Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-3">3. Verification & Seat Allotment Status</h2>
            <table className="w-full text-xs border border-collapse border-slate-200">
              <tbody>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 w-1/4 border border-slate-200">Document Verification</td>
                  <td className="p-2 border border-slate-200 font-bold">{student.verificationStatus}</td>
                  <td className="p-2 font-bold bg-slate-50 w-1/4 border border-slate-200">Verified By / Date</td>
                  <td className="p-2 border border-slate-200">{student.verificationStatus === 'Verified' ? 'Admissions Committee' : '-'}</td>
                </tr>
                <tr>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Seat Allotment</td>
                  <td className="p-2 border border-slate-200 font-bold">{student.seatAllotted ? 'Allotted' : 'Pending'}</td>
                  <td className="p-2 font-bold bg-slate-50 border border-slate-200">Allotted Course</td>
                  <td className="p-2 border border-slate-200 font-bold">{student.allottedCourse || student.courseApplied}</td>
                </tr>
                {student.remarks && (
                  <tr>
                    <td className="p-2 font-bold bg-slate-50 border border-slate-200">Verification Remarks</td>
                    <td className="p-2 border border-slate-200" colSpan={3}>{student.remarks}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Fees Ledger Section */}
          <div className="mb-6">
            <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-3">4. Fees Collection Installment Ledger</h2>
            {paymentsList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No fee installments collected for this student.</p>
            ) : (
              <table className="w-full text-xs border border-collapse border-slate-200">
                <thead>
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="p-2 border border-slate-200 text-left">Receipt No</th>
                    <th className="p-2 border border-slate-200">Installment Name</th>
                    <th className="p-2 border border-slate-200">Year / Sem</th>
                    <th className="p-2 border border-slate-200">Payment Date</th>
                    <th className="p-2 border border-slate-200">Payment Mode</th>
                    <th className="p-2 border border-slate-200">Transaction No</th>
                    <th className="p-2 border border-slate-200 text-right">Amount Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentsList.map(payment => (
                    <tr key={payment._id} className="text-center">
                      <td className="p-2 border border-slate-200 text-left font-mono">{payment.receiptNo}</td>
                      <td className="p-2 border border-slate-200">{payment.installmentName}</td>
                      <td className="p-2 border border-slate-200">{payment.academicYear} - {payment.semester}</td>
                      <td className="p-2 border border-slate-200">{payment.paymentDate}</td>
                      <td className="p-2 border border-slate-200">{payment.paymentMode}</td>
                      <td className="p-2 border border-slate-200 font-mono">{payment.transactionNo || '-'}</td>
                      <td className="p-2 border border-slate-200 text-right font-bold">₹{payment.amountPaid?.toLocaleString()}</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="p-2 border border-slate-200 text-right" colSpan={6}>Total Paid Fees</td>
                    <td className="p-2 border border-slate-200 text-right font-black text-emerald-700">₹{totalFeesPaid.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Library History Section */}
          <div className="mb-8">
            <h2 className="text-xs font-bold uppercase tracking-wider bg-slate-100 p-1.5 border-l-4 border-slate-800 mb-3">5. Library Checkout & Fine Ledger</h2>
            {!issuesList || issuesList.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No library issues registered for this student.</p>
            ) : (
              <table className="w-full text-xs border border-collapse border-slate-200">
                <thead>
                  <tr className="bg-slate-50 font-bold text-center">
                    <th className="p-2 border border-slate-200 text-left">Accession No / Book</th>
                    <th className="p-2 border border-slate-200">Issue Date</th>
                    <th className="p-2 border border-slate-200">Due Date</th>
                    <th className="p-2 border border-slate-200">Return Date</th>
                    <th className="p-2 border border-slate-200">Status</th>
                    <th className="p-2 border border-slate-200 text-right">Fine Charged</th>
                  </tr>
                </thead>
                <tbody>
                  {issuesList.map(issue => (
                    <tr key={issue._id} className="text-center">
                      <td className="p-2 border border-slate-200 text-left">
                        <div className="font-bold">[{issue.book?.bookNo || '-'}]</div>
                        <div>{issue.book?.title || '-'}</div>
                      </td>
                      <td className="p-2 border border-slate-200">{issue.issueDate}</td>
                      <td className="p-2 border border-slate-200">{issue.dueDate}</td>
                      <td className="p-2 border border-slate-200">{issue.returnDate || 'Not Returned'}</td>
                      <td className="p-2 border border-slate-200">
                        <span className={`font-bold uppercase text-[9px] ${
                          issue.status === 'Returned' ? 'text-emerald-600' :
                          issue.status === 'Lost' ? 'text-rose-600' : 'text-amber-600'
                        }`}>{issue.status}</span>
                      </td>
                      <td className="p-2 border border-slate-200 text-right font-bold">₹{issue.fineAmount || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Signature Area */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-300">
            <div className="text-center w-1/3">
              <div className="border-b border-slate-400 h-8"></div>
              <div className="text-[10px] font-bold mt-2 uppercase tracking-wide">Dealing Assistant</div>
            </div>
            <div className="text-center w-1/3">
              <div className="border-b border-slate-400 h-8"></div>
              <div className="text-[10px] font-bold mt-2 uppercase tracking-wide">Librarian</div>
            </div>
            <div className="text-center w-1/3">
              <div className="border-b border-slate-400 h-8"></div>
              <div className="text-[10px] font-bold mt-2 uppercase tracking-wide">Principal / Coordinator</div>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Printing Custom Style Sheets */}
      <style>{`
        /* Media Print styles to display only printable target container */
        @media print {
          /* Reset parent layout paddings/margins that push prints off-center */
          body, html, #root, main, .screen-container {
            background-color: white !important;
            color: black !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
          }
          
          /* Remove sidebar left padding during print */
          .pl-\\[19rem\\] {
            padding-left: 0 !important;
          }
          .pr-8 {
            padding-right: 0 !important;
          }
          .py-8 {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
          
          /* Hide all screen components */
          .screen-container, 
          .no-print,
          aside, 
          header,
          footer,
          nav {
            display: none !important;
          }
          
          /* Show only active print document */
          .print-only {
            display: none !important;
          }
          
          .print-only.active-print {
            display: block !important;
            visibility: visible !important;
            margin: 0 auto !important;
            padding: 24px !important;
            float: none !important;
            box-sizing: border-box !important;
          }
          
          /* Visual improvements for print rendering */
          .no-dark-invert {
            filter: none !important;
          }
          
          /* Enable tables, lines, borders to draw correctly */
          table, th, td {
            border: 1px solid black !important;
            border-collapse: collapse !important;
          }
          
          /* Force page background colors to print */
          .bg-gray-50 {
            background-color: #f9fafb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .bg-gray-150 {
            background-color: #e5e7eb !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>
    </div>
  );
};

export default ProfileCard;
