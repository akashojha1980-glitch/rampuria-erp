import React, { useState, useEffect } from 'react';
import { 
  CreditCard, ShieldCheck, Key, RefreshCw, CheckCircle, 
  AlertCircle, Copy, Check, ExternalLink, HelpCircle, 
  PlusCircle, Search, FileText, Printer, Lock, Sparkles, Building
} from 'lucide-react';
import PrintReceiptModal from '../components/PrintReceiptModal';
import { useSession } from '../context/SessionContext';

const PaymentGatewaySettings = () => {
  const { activeSession } = useSession();
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'guide' | 'entry' | 'history'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [copiedField, setCopiedField] = useState('');
  const [toast, setToast] = useState({ show: false, msg: '', type: 'success' });

  // Gateway Config State
  const [config, setConfig] = useState({
    activeGateway: 'billdesk',
    isGatewayEnabled: true,
    autoGenerateReceipt: true,
    receiptPrefix: 'REC-BD-',
    billdesk: {
      merchantId: 'RAMPURIABILLDESK',
      securityKey: 'SEC_KEY_TEST_2026',
      clientId: 'CLIENT_RAMPURIA_01',
      returnUrl: 'http://localhost:5000/api/payment-gateway/billdesk/callback',
      webhookUrl: 'http://localhost:5000/api/payment-gateway/billdesk/webhook',
      environment: 'sandbox',
      enabled: true,
      currency: 'INR'
    },
    razorpay: {
      keyId: '',
      keySecret: '',
      enabled: false
    }
  });

  const [setupSteps, setSetupSteps] = useState([]);
  const [testResult, setTestResult] = useState(null);

  // Manual / BillDesk Entry State
  const [students, setStudents] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [entryForm, setEntryForm] = useState({
    installmentName: 'College Tuition & Online Admission Fee',
    amountPaid: '',
    billdeskTxnId: '',
    orderId: '',
    bankRef: '',
    paymentDate: new Date().toISOString().split('T')[0],
    remarks: ''
  });
  const [submittingEntry, setSubmittingEntry] = useState(false);

  // Transactions History State
  const [transactions, setTransactions] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [totalGatewayCollection, setTotalGatewayCollection] = useState(0);
  const [historySearch, setHistorySearch] = useState('');

  // Receipt Modal State
  const [receiptModalOpen, setReceiptModalOpen] = useState(false);
  const [activeReceiptData, setActiveReceiptData] = useState({ payment: null, student: null });

  const showToast = (msg, type = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast({ show: false, msg: '', type: 'success' }), 4000);
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    showToast(`Copied ${fieldName} to clipboard!`);
    setTimeout(() => setCopiedField(''), 2000);
  };

  // 1. Fetch Gateway Config
  const fetchConfig = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/payment-gateway/config', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.config) setConfig(data.config);
        if (data.setupSteps) setSetupSteps(data.setupSteps);
      }
    } catch (err) {
      console.error('Error fetching gateway config:', err);
    } finally {
      setLoading(false);
    }
  };

  // 2. Fetch Students for Entry Search
  const fetchStudents = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/students?limit=200&session=${activeSession || ''}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  };

  // 3. Fetch Transactions History
  const fetchTransactions = async () => {
    setHistoryLoading(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`/api/payment-gateway/transactions?session=${activeSession || ''}&search=${encodeURIComponent(historySearch)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setTransactions(data.transactions || []);
        setTotalGatewayCollection(data.totalGatewayCollection || 0);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchStudents();
    fetchTransactions();
  }, [activeSession]);

  // Save Gateway Settings
  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/payment-gateway/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (res.ok) {
        showToast('Payment Gateway & BillDesk credentials updated successfully!');
        setConfig(data.config);
      } else {
        showToast(data.message || 'Failed to save gateway config', 'error');
      }
    } catch (err) {
      showToast('Database connection error', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Test Gateway Connection / HMAC Checksum Signature
  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/payment-gateway/test-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setTestResult({ success: true, ...data });
        showToast('BillDesk HMAC checksum generator verified successfully!');
      } else {
        setTestResult({ success: false, message: data.message || 'Signature check failed' });
        showToast(data.message || 'Connection test failed', 'error');
      }
    } catch (err) {
      setTestResult({ success: false, message: 'Server connection timeout' });
      showToast('Connection test timeout', 'error');
    } finally {
      setTesting(false);
    }
  };

  // Submit BillDesk Payment Entry & Generate Receipt
  const handleEntrySubmit = async (e) => {
    e.preventDefault();
    if (!selectedStudent) {
      showToast('Please select a student first', 'error');
      return;
    }
    if (!entryForm.amountPaid || Number(entryForm.amountPaid) <= 0) {
      showToast('Please enter a valid payment amount', 'error');
      return;
    }

    setSubmittingEntry(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/payment-gateway/record-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          studentId: selectedStudent.id || selectedStudent._id,
          installmentName: entryForm.installmentName,
          amountPaid: entryForm.amountPaid,
          billdeskTxnId: entryForm.billdeskTxnId,
          orderId: entryForm.orderId,
          paymentDate: entryForm.paymentDate,
          bankRef: entryForm.bankRef,
          remarks: entryForm.remarks
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast(data.message);
        
        // Open Print Receipt Modal immediately
        setActiveReceiptData({
          payment: data.payment,
          student: data.student
        });
        setReceiptModalOpen(true);

        // Reset Entry Form
        setEntryForm({
          installmentName: 'College Tuition & Online Admission Fee',
          amountPaid: '',
          billdeskTxnId: '',
          orderId: '',
          bankRef: '',
          paymentDate: new Date().toISOString().split('T')[0],
          remarks: ''
        });
        setSelectedStudent(null);
        setStudentSearch('');

        // Refresh transactions list
        fetchTransactions();
      } else {
        showToast(data.message || 'Error recording transaction', 'error');
      }
    } catch (err) {
      showToast('Server connection failed', 'error');
    } finally {
      setSubmittingEntry(false);
    }
  };

  // Filtered students for search
  const filteredStudents = students.filter(s => {
    if (!studentSearch) return true;
    const query = studentSearch.toLowerCase();
    return (
      (s.fullName && s.fullName.toLowerCase().includes(query)) ||
      (s.registrationId && s.registrationId.toLowerCase().includes(query)) ||
      (s.mobileNumber && s.mobileNumber.includes(query)) ||
      (s.srNo && String(s.srNo).includes(query))
    );
  }).slice(0, 8);

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      
      {/* Toast Notification Alert */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs font-bold animate-in fade-in slide-in-from-top-4 ${
          toast.type === 'error' ? 'bg-rose-600 text-white shadow-rose-600/30' : 'bg-emerald-600 text-white shadow-emerald-600/30'
        }`}>
          {toast.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* Hero Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c1322] via-[#141e34] to-[#0a0f1d] text-white p-6 md:p-8 border border-amber-500/30 shadow-xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold uppercase border border-amber-500/30">
              <CreditCard className="w-3.5 h-3.5 text-amber-400" />
              <span>BillDesk & Online Gateway Integration Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500">
              Payment Gateway Console
            </h1>
            <p className="text-xs text-slate-300 max-w-2xl">
              Configure your institutional BillDesk merchant keys, verify cryptographic checksums, automatically settle online fee inflows, and issue computerized official receipts instantly.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="p-3 bg-slate-900/80 border border-slate-700/80 rounded-2xl text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Gateway Collection</span>
              <span className="text-base font-black font-mono text-amber-400">
                ₹{totalGatewayCollection.toLocaleString('en-IN')}/-
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-warm-200/60 dark:border-darkbg-border pb-2">
        <button
          onClick={() => setActiveTab('config')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'config'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-white dark:bg-darkbg-surface text-slate-700 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border'
          }`}
        >
          <Key className="w-4 h-4 text-amber-400" />
          <span>BillDesk Gateway Keys</span>
        </button>

        <button
          onClick={() => setActiveTab('guide')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'guide'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-white dark:bg-darkbg-surface text-slate-700 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border'
          }`}
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>Setup Guide & Steps</span>
        </button>

        <button
          onClick={() => setActiveTab('entry')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'entry'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'bg-white dark:bg-darkbg-surface text-slate-700 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border'
          }`}
        >
          <PlusCircle className="w-4 h-4 text-emerald-400" />
          <span>Record BillDesk Inflow & Print Receipt</span>
        </button>

        <button
          onClick={() => {
            setActiveTab('history');
            fetchTransactions();
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'history'
              ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30'
              : 'bg-white dark:bg-darkbg-surface text-slate-700 dark:text-slate-300 hover:bg-warm-100 dark:hover:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border'
          }`}
        >
          <FileText className="w-4 h-4 text-teal-400" />
          <span>Gateway Inflow Ledger ({transactions.length})</span>
        </button>
      </div>

      {/* TAB 1: BILLDESK CONFIGURATION */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Credentials Form */}
          <div className="lg:col-span-2 bg-white dark:bg-darkbg-surface p-6 sm:p-8 rounded-3xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-warm-100 dark:border-darkbg-border">
              <div>
                <h3 className="text-base font-bold text-warm-900 dark:text-slate-100 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-500" />
                  <span>BillDesk Merchant Account Credentials</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Enter credentials provided by BillDesk onboarding team.
                </p>
              </div>

              {/* Live Status Pill */}
              <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 ${
                config.billdesk.environment === 'production'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
              }`}>
                <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                <span>Mode: {config.billdesk.environment.toUpperCase()}</span>
              </span>
            </div>

            <form onSubmit={handleSaveConfig} className="space-y-4">
              
              {/* Merchant ID (MID) */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  BillDesk Merchant ID (MID) *
                </label>
                <input
                  type="text"
                  required
                  value={config.billdesk.merchantId}
                  onChange={(e) => setConfig({
                    ...config,
                    billdesk: { ...config.billdesk, merchantId: e.target.value.trim() }
                  })}
                  placeholder="e.g. RAMPURIABILLDESK"
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Security Key / Checksum Secret */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  BillDesk Security Key / Checksum Secret Key *
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    value={config.billdesk.securityKey}
                    onChange={(e) => setConfig({
                      ...config,
                      billdesk: { ...config.billdesk, securityKey: e.target.value.trim() }
                    })}
                    placeholder="Enter HMAC-SHA256 Encryption Key"
                    className="w-full pl-4 pr-12 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(config.billdesk.securityKey, 'Security Key')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    title="Copy Key"
                  >
                    {copiedField === 'Security Key' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Client ID / Auth Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Client ID / Sub-Merchant Code (Optional)
                </label>
                <input
                  type="text"
                  value={config.billdesk.clientId}
                  onChange={(e) => setConfig({
                    ...config,
                    billdesk: { ...config.billdesk, clientId: e.target.value.trim() }
                  })}
                  placeholder="e.g. CLIENT_RAMPURIA_01"
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Environment Mode & Currency Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Operation Environment
                  </label>
                  <select
                    value={config.billdesk.environment}
                    onChange={(e) => setConfig({
                      ...config,
                      billdesk: { ...config.billdesk, environment: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                  >
                    <option value="sandbox">Sandbox (Testing / Demo Mode)</option>
                    <option value="production">Production (Real Bank Settlement)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Receipt Prefix For Gateway Inflows
                  </label>
                  <input
                    type="text"
                    value={config.receiptPrefix}
                    onChange={(e) => setConfig({ ...config, receiptPrefix: e.target.value })}
                    placeholder="REC-BD-"
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Webhook Callback URL */}
              <div className="space-y-1.5 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 flex items-center justify-between">
                  <span>Server S2S Webhook / IPN Response URL</span>
                  <span className="text-[10px] text-amber-500 lowercase font-mono">Give this URL to BillDesk</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={config.billdesk.returnUrl}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-100/50 dark:bg-darkbg-base text-xs font-mono text-slate-700 dark:text-slate-300 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(config.billdesk.returnUrl, 'Webhook URL')}
                    className="px-3.5 py-2.5 rounded-xl bg-warm-100 hover:bg-warm-200 dark:bg-darkbg-base dark:hover:bg-darkbg-border text-slate-700 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    {copiedField === 'Webhook URL' ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    <span>Copy</span>
                  </button>
                </div>
              </div>

              {/* Buttons */}
              <div className="pt-4 flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="px-6 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold transition-all shadow-md shadow-brand-600/30 flex items-center gap-2 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{saving ? 'Saving Gateway Settings...' : 'Save BillDesk Configuration'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testing}
                  className="px-5 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-600 dark:text-amber-400 text-xs font-bold transition-all flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
                  <span>{testing ? 'Testing HMAC Signature...' : 'Test Gateway Signature Generator'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Side Info & Verification Diagnostic Panel */}
          <div className="space-y-6">
            
            {/* Signature Test Result */}
            {testResult && (
              <div className={`p-5 rounded-3xl border shadow-sm space-y-3 ${
                testResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
                  : 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300'
              }`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  {testResult.success ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <AlertCircle className="w-4 h-4 text-rose-500" />}
                  <span>{testResult.message}</span>
                </div>
                {testResult.details && (
                  <div className="space-y-1 font-mono text-[11px] bg-black/10 dark:bg-black/30 p-3 rounded-xl">
                    <div>MID: <strong>{testResult.details.merchantId}</strong></div>
                    <div>Order: <strong>{testResult.details.testOrderId}</strong></div>
                    <div>Checksum: <strong>{testResult.details.generatedChecksum}</strong></div>
                    <div className="text-emerald-600 dark:text-emerald-400 font-bold mt-1">✓ Status: READY FOR INFLOWS</div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Status Box */}
            <div className="bg-white dark:bg-darkbg-surface p-6 rounded-3xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Gateway Status Matrix</span>
              </h4>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
                  <span className="text-slate-400">Primary Gateway</span>
                  <strong className="font-bold text-slate-900 dark:text-white uppercase">BillDesk PG</strong>
                </div>
                <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
                  <span className="text-slate-400">Encryption Method</span>
                  <span className="font-mono font-bold text-amber-500">HMAC-SHA256</span>
                </div>
                <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
                  <span className="text-slate-400">Auto-Receipt Engine</span>
                  <span className="font-bold text-emerald-500">Enabled (Instant A4)</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-400">Ledger Auto-Sync</span>
                  <span className="font-bold text-emerald-500">Real-Time Active</span>
                </div>
              </div>
            </div>

            {/* Support Box */}
            <div className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-transparent p-6 rounded-3xl border border-amber-500/20 shadow-sm space-y-2">
              <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                Need Help with BillDesk Credentials?
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                If the college has purchased the BillDesk service and needs assistance extracting the Secret Key or configuring IP whitelisting:
              </p>
              <div className="pt-2 text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                Call: Deepak Ojha (+91 96100 77159) / Akash Ojha (+91 63756 45010)
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STEP-BY-STEP SETUP GUIDE */}
      {activeTab === 'guide' && (
        <div className="bg-white dark:bg-darkbg-surface p-6 sm:p-8 rounded-3xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-6">
          <div>
            <h3 className="text-lg font-bold text-warm-900 dark:text-slate-100 font-serif flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-brand-500" />
              <span>BillDesk Payment Gateway Setup & Activation Guide</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Follow these simple 4 steps to connect your College BillDesk merchant account with the Pankh Gold ERP:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
            
            {/* Step 1 */}
            <div className="p-5 rounded-2xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-brand-600 text-white font-bold text-xs flex items-center justify-center">1</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sign Up & Acquire Merchant ID (MID)</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
                Client (College) signs up with BillDesk for education fee collection. BillDesk issues a unique <strong>Merchant ID (MID)</strong> and security encryption certificate / checksum key.
              </p>
            </div>

            {/* Step 2 */}
            <div className="p-5 rounded-2xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center">2</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Enter Keys in ERP Settings</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
                Go to the <strong>BillDesk Gateway Keys</strong> tab above, enter your <strong>Merchant ID</strong> and <strong>Security Key</strong>, then click <em>"Save BillDesk Configuration"</em>.
              </p>
            </div>

            {/* Step 3 */}
            <div className="p-5 rounded-2xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">3</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Provide Webhook Callback to BillDesk</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
                Share your return webhook URL with BillDesk engineers: <br />
                <code className="text-[10px] text-amber-500 font-bold font-mono">http://localhost:5000/api/payment-gateway/billdesk/callback</code>
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-5 rounded-2xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/60 dark:border-darkbg-border space-y-2">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-xl bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">4</span>
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Record & Instant Auto-Receipts</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-10">
                When student payments are processed or entered with BillDesk reference numbers, the ERP automatically updates the student's dues, adds the amount to the Day Book, and produces a printable A4 receipt!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RECORD BILLDESK PAYMENT & INSTANT RECEIPT */}
      {activeTab === 'entry' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Form */}
          <div className="lg:col-span-2 bg-white dark:bg-darkbg-surface p-6 sm:p-8 rounded-3xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-6">
            <div>
              <h3 className="text-base font-bold text-warm-900 dark:text-slate-100 flex items-center gap-2 font-serif">
                <PlusCircle className="w-5 h-5 text-emerald-500" />
                <span>Record BillDesk Inflow & Generate Official Receipt</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Search the student profile, enter the BillDesk transaction ID and amount received, and the ERP will instantly create the receipt and update accounts.
              </p>
            </div>

            <form onSubmit={handleEntrySubmit} className="space-y-4">
              
              {/* Student Search & Select Dropdown */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select Student (Search by Name, Reg ID, Mobile) *
                </label>
                
                {selectedStudent ? (
                  <div className="p-3.5 rounded-xl bg-brand-50 dark:bg-darkbg-base border border-brand-300 dark:border-brand-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white block">
                        {selectedStudent.fullName} ({selectedStudent.courseApplied})
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Reg ID: {selectedStudent.registrationId || 'N/A'} | Mobile: {selectedStudent.mobileNumber || 'N/A'} | Fees Paid: ₹{(Number(selectedStudent.feesPaid) || 0).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedStudent(null)}
                      className="px-2.5 py-1 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 rounded-lg font-bold"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        placeholder="Type student name, Reg ID or mobile number..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                      />
                    </div>

                    {studentSearch && (
                      <div className="max-h-48 overflow-y-auto rounded-xl border border-warm-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface divide-y divide-warm-100 dark:divide-darkbg-border shadow-lg">
                        {filteredStudents.length === 0 ? (
                          <div className="p-3 text-xs text-slate-400 text-center">No students matching search.</div>
                        ) : (
                          filteredStudents.map((s) => (
                            <div
                              key={s.id || s._id}
                              onClick={() => {
                                setSelectedStudent(s);
                                setStudentSearch('');
                              }}
                              className="p-3 hover:bg-warm-50 dark:hover:bg-darkbg-base cursor-pointer flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-slate-900 dark:text-white">{s.fullName}</span>
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {s.registrationId} • {s.courseApplied}
                                </span>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-600 dark:text-brand-400 font-bold">Select</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Fee Particulars & Installment */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Fee Particulars / Installment Head *
                </label>
                <input
                  type="text"
                  required
                  value={entryForm.installmentName}
                  onChange={(e) => setEntryForm({ ...entryForm, installmentName: e.target.value })}
                  placeholder="e.g. 1st Installment / College Admission Fee"
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                />
              </div>

              {/* Amount & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Amount Paid via BillDesk (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={entryForm.amountPaid}
                    onChange={(e) => setEntryForm({ ...entryForm, amountPaid: e.target.value })}
                    placeholder="e.g. 15000"
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 focus:border-emerald-500 outline-none text-base"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Payment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={entryForm.paymentDate}
                    onChange={(e) => setEntryForm({ ...entryForm, paymentDate: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* BillDesk Txn ID & Order ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    BillDesk Transaction ID / Reference No. *
                  </label>
                  <input
                    type="text"
                    required
                    value={entryForm.billdeskTxnId}
                    onChange={(e) => setEntryForm({ ...entryForm, billdeskTxnId: e.target.value })}
                    placeholder="e.g. BD20260913009841"
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Bank Reference / UTR No. (Optional)
                  </label>
                  <input
                    type="text"
                    value={entryForm.bankRef}
                    onChange={(e) => setEntryForm({ ...entryForm, bankRef: e.target.value })}
                    placeholder="e.g. HDFC000192837"
                    className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                  />
                </div>
              </div>

              {/* Remarks */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Notes / Payment Remarks
                </label>
                <input
                  type="text"
                  value={entryForm.remarks}
                  onChange={(e) => setEntryForm({ ...entryForm, remarks: e.target.value })}
                  placeholder="Optional settlement remarks"
                  className="w-full px-4 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold text-slate-900 dark:text-white focus:border-brand-500 outline-none"
                />
              </div>

              <div className="pt-3">
                <button
                  type="submit"
                  disabled={submittingEntry || !selectedStudent}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Printer className="w-4 h-4" />
                  <span>{submittingEntry ? 'Processing & Generating Receipt...' : 'Record Payment & Generate Official Receipt'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Helper Summary Side */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-darkbg-surface p-6 rounded-3xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                ⚡ What Happens Automatically?
              </h4>
              <ul className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>The student's fee ledger is credited with the paid amount.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>A computer-generated unique receipt number is minted (e.g. <code>REC-BD-2026-1023</code>).</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>The official A4 printable receipt popup opens immediately for 1-click printing or PDF export.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span>The Day Book & Reports panel immediately reflects the inflow.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: GATEWAY TRANSACTIONS LEDGER */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-darkbg-surface p-6 sm:p-8 rounded-3xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-warm-900 dark:text-slate-100 flex items-center gap-2 font-serif">
                <FileText className="w-5 h-5 text-teal-500" />
                <span>BillDesk & Online Gateway Inflow Transactions</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Full ledger of all transactions received via BillDesk Gateway.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchTransactions()}
                  placeholder="Search receipt / txn ID..."
                  className="pl-9 pr-3 py-2 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-xs font-semibold outline-none"
                />
              </div>

              <button
                onClick={fetchTransactions}
                className="p-2.5 rounded-xl bg-warm-100 dark:bg-darkbg-base hover:bg-warm-200 text-slate-700 dark:text-slate-300 transition-all"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Transactions Table */}
          {historyLoading ? (
            <div className="py-12 text-center text-xs text-slate-400">Loading gateway transactions...</div>
          ) : transactions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No BillDesk transactions found. Record your first transaction using the "Record BillDesk Inflow" tab!
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-warm-200/60 dark:border-darkbg-border">
              <table className="w-full text-xs text-left">
                <thead className="bg-warm-50 dark:bg-darkbg-base text-slate-600 dark:text-slate-400 uppercase font-bold text-[10px] border-b border-warm-200 dark:border-darkbg-border">
                  <tr>
                    <th className="py-3 px-4">Receipt No.</th>
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Particulars</th>
                    <th className="py-3 px-4">BillDesk Txn Ref</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4 text-right">Amount (₹)</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-warm-100 dark:divide-darkbg-border">
                  {transactions.map((t) => (
                    <tr key={t.id || t._id} className="hover:bg-warm-50/60 dark:hover:bg-darkbg-base/40 transition-colors">
                      <td className="py-3.5 px-4 font-mono font-bold text-brand-600 dark:text-brand-400">{t.receiptNo}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900 dark:text-white block">{t.student?.fullName || 'N/A'}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{t.student?.registrationId} • {t.student?.courseApplied}</span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">{t.installmentName}</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300 text-[11px]">{t.transactionNo || '-'}</td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">{t.paymentDate}</td>
                      <td className="py-3.5 px-4 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                        ₹{(Number(t.amountPaid) || 0).toLocaleString('en-IN')}/-
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => {
                            setActiveReceiptData({ payment: t, student: t.student });
                            setReceiptModalOpen(true);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-brand-500/10 hover:bg-brand-500/20 text-brand-600 dark:text-brand-400 font-bold text-[11px] transition-all inline-flex items-center gap-1.5"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Reprint A4</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Official Print Receipt Modal */}
      <PrintReceiptModal
        isOpen={receiptModalOpen}
        onClose={() => setReceiptModalOpen(false)}
        payment={activeReceiptData.payment}
        student={activeReceiptData.student}
      />
    </div>
  );
};

export default PaymentGatewaySettings;
