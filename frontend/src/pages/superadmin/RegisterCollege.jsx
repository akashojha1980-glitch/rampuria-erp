import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, User, KeyRound, Database, Layers, 
  Save, ArrowLeft, CheckCircle2, AlertCircle, Sparkles, ShieldCheck
} from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const ALL_AVAILABLE_MODULES = [
  { id: 'admission', name: 'Admission Management', desc: 'Central admission lifecycle & application processing' },
  { id: 'registration', name: 'Student Registration', desc: 'Direct form entry & bulk Excel import' },
  { id: 'verification', name: 'Document Verification', desc: '10th/12th/Graduation/Caste checklist verification' },
  { id: 'fees', name: 'Fee & Cashflow Console', desc: 'Installment control, concessions, & 1-click receipts' },
  { id: 'examination', name: 'Examination & Admit Cards', desc: 'Exam roll numbers, centers, & seating plan' },
  { id: 'results', name: 'Annual Result Console', desc: 'University marks ledger, tabulation, & marksheets' },
  { id: 'promotion', name: 'Academic Promotion', desc: '1-click Year & Semester bulk student promotion' },
  { id: 'library', name: 'Law & General Library', desc: 'Accession registers, barcode scanning, issue/return' },
  { id: 'staff', name: 'Staff & Security Access', desc: 'Sub-admin credentials & granular page permissions' },
  { id: 'reports', name: 'Finance & Day Book Hub', desc: 'Comprehensive financial statements & Excel exports' },
  { id: 'id_card', name: 'ID Card Generator', desc: 'Bulk printable student identity cards with barcodes' },
  { id: 'accounts', name: 'Expense & Accounting', desc: 'Vouchers, vendor expenses, & cashbook tracking' },
  { id: 'hostel', name: 'Hostel Management', desc: 'Room allotment, mess fees, & warden registry' },
  { id: 'transport', name: 'Transport / Bus Fleet', desc: 'Bus routes, pickup stops, & transport fees' }
];

const RegisterCollege = () => {
  const navigate = useNavigate();
  const { token, refreshAlerts } = useSuperAdmin();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    collegeName: '',
    collegeCode: '',
    productType: 'College ERP',
    address: '',
    city: '',
    state: 'Rajasthan',
    mobileNumber: '',
    email: '',
    website: '',
    principalName: '',
    principalMobile: '',
    principalEmail: '',
    packageType: 'Standard',
    status: 'Active',
    installationDate: new Date().toISOString().split('T')[0],
    licenseStartDate: new Date().toISOString().split('T')[0],
    licenseExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    dbServer: '127.0.0.1',
    dbPort: 1433,
    dbName: '',
    dbUsername: 'sa',
    dbPassword: 'BjsRampuria@2026',
    amcAmount: 20000,
    totalPaid: 50000,
    notes: ''
  });

  const [selectedModules, setSelectedModules] = useState([
    'admission', 'registration', 'verification', 'fees', 
    'examination', 'results', 'promotion', 'library', 
    'staff', 'reports', 'id_card', 'accounts'
  ]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Auto suggest dbName from collegeCode
      ...(name === 'collegeCode' && !prev.dbName ? { dbName: `erp_${value.toLowerCase().replace(/[^a-z0-9]/g, '_')}_db` } : {})
    }));
  };

  const toggleModule = (modId) => {
    if (selectedModules.includes(modId)) {
      setSelectedModules(selectedModules.filter(m => m !== modId));
    } else {
      setSelectedModules([...selectedModules, modId]);
    }
  };

  const handleSelectAllModules = () => {
    if (selectedModules.length === ALL_AVAILABLE_MODULES.length) {
      setSelectedModules(['admission', 'registration', 'fees']);
    } else {
      setSelectedModules(ALL_AVAILABLE_MODULES.map(m => m.id));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const res = await fetch('/api/superadmin/colleges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          installedModules: selectedModules
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to register college');
      }

      setSuccess(`College "${data.college.collegeName}" registered successfully! Client ID: ${data.college.clientId}`);
      refreshAlerts();
      setTimeout(() => {
        navigate(`/superadmin/colleges/${data.college.id}`);
      }, 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans">
      
      {/* Header with back button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/superadmin/colleges')}
            className="p-2 rounded-xl bg-white dark:bg-[#141721] border border-warm-200 dark:border-darkbg-border text-warm-600 dark:text-slate-300 hover:bg-warm-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-warm-900 dark:text-white">
              Register New College / Client
            </h1>
            <p className="text-xs text-warm-500 dark:text-slate-400">
              Setup tenant database, cryptographic license key, and enabled software modules.
            </p>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* Registration Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* SECTION 1: COLLEGE GENERAL DETAILS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-warm-100 dark:border-darkbg-border">
            <Building2 className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-warm-900 dark:text-white">
              1. Institution / College Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">College Full Name *</label>
              <input
                type="text"
                required
                name="collegeName"
                value={formData.collegeName}
                onChange={handleChange}
                placeholder="e.g. B.J.S. Rampuria Jain Law College"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none focus:border-brand-500 font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">College Short Code (Unique) *</label>
              <input
                type="text"
                required
                name="collegeCode"
                value={formData.collegeCode}
                onChange={handleChange}
                placeholder="e.g. BJS-01, LAW-101"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white uppercase font-mono font-bold focus:outline-none focus:border-brand-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Product Vertical (Future Ready)</label>
              <select
                name="productType"
                value={formData.productType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              >
                <option value="College ERP">🎓 College ERP (Higher Education)</option>
                <option value="School ERP">🏫 School ERP (K-12)</option>
                <option value="Hospital ERP">🏥 Hospital & Clinic ERP</option>
                <option value="Lab ERP">🔬 Diagnostic Lab ERP</option>
                <option value="Pharmacy ERP">💊 Pharmacy & Store ERP</option>
                <option value="Service ERP">🚗 Automobile & Service ERP</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Bikaner"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Rajasthan"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Mobile Number / Phone</label>
              <input
                type="text"
                name="mobileNumber"
                value={formData.mobileNumber}
                onChange={handleChange}
                placeholder="e.g. 0151-2200123"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Official Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="e.g. info@rampurialaw.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Official Website URL</label>
              <input
                type="text"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="e.g. https://rampurialaw.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Campus Address</label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Full campus physical address"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: PRINCIPAL & AUTHORITY DETAILS */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-warm-100 dark:border-darkbg-border">
            <User className="w-5 h-5 text-amber-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-warm-900 dark:text-white">
              2. Principal / Authorised Signatory Details
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Principal / Director Name</label>
              <input
                type="text"
                name="principalName"
                value={formData.principalName}
                onChange={handleChange}
                placeholder="e.g. Dr. S. K. Sharma"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Principal Mobile Number</label>
              <input
                type="text"
                name="principalMobile"
                value={formData.principalMobile}
                onChange={handleChange}
                placeholder="e.g. +91 98290 12345"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Principal Email</label>
              <input
                type="email"
                name="principalEmail"
                value={formData.principalEmail}
                onChange={handleChange}
                placeholder="e.g. principal@rampurialaw.ac.in"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: LICENSE, PACKAGE & DATES */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-warm-100 dark:border-darkbg-border">
            <KeyRound className="w-5 h-5 text-emerald-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-warm-900 dark:text-white">
              3. License Terms, Package & Billing
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Package Tier</label>
              <select
                name="packageType"
                value={formData.packageType}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              >
                <option value="Basic">Basic (Core Admissions)</option>
                <option value="Standard">Standard (Admissions + Fees + Reports)</option>
                <option value="Premium">Premium (Full-Suite ERP + Library + Exam)</option>
                <option value="Custom">Custom Enterprise Solution</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Account Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              >
                <option value="Active">🟢 Active (Operational)</option>
                <option value="Suspended">🟡 Suspended (Temporarily Frozen)</option>
                <option value="Expired">🔴 Expired (Locked)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">License Start Date</label>
              <input
                type="date"
                name="licenseStartDate"
                value={formData.licenseStartDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">License Expiry Date *</label>
              <input
                type="date"
                required
                name="licenseExpiryDate"
                value={formData.licenseExpiryDate}
                onChange={handleChange}
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium font-bold text-brand-600 dark:text-brand-400"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Initial Onboarding Fee (₹)</label>
              <input
                type="number"
                name="totalPaid"
                value={formData.totalPaid}
                onChange={handleChange}
                placeholder="50000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Annual AMC Amount (₹)</label>
              <input
                type="number"
                name="amcAmount"
                value={formData.amcAmount}
                onChange={handleChange}
                placeholder="20000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white focus:outline-none font-medium"
              />
            </div>
          </div>
        </div>

        {/* SECTION 4: TENANT DATABASE CONNECTION CONFIGURATION */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-warm-100 dark:border-darkbg-border">
            <Database className="w-5 h-5 text-purple-500" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-warm-900 dark:text-white">
              4. Tenant SQL Server Database Parameters
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">SQL Server Host / IP</label>
              <input
                type="text"
                name="dbServer"
                value={formData.dbServer}
                onChange={handleChange}
                placeholder="127.0.0.1"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">SQL Server Port</label>
              <input
                type="number"
                name="dbPort"
                value={formData.dbPort}
                onChange={handleChange}
                placeholder="1433"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white font-mono focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">Database Name *</label>
              <input
                type="text"
                name="dbName"
                value={formData.dbName}
                onChange={handleChange}
                placeholder="erp_college_db"
                className="w-full px-3.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white font-mono font-bold focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-warm-700 dark:text-slate-300">DB Login User / Password</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  name="dbUsername"
                  value={formData.dbUsername}
                  onChange={handleChange}
                  placeholder="sa"
                  className="w-full px-2.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white font-mono focus:outline-none"
                />
                <input
                  type="password"
                  name="dbPassword"
                  value={formData.dbPassword}
                  onChange={handleChange}
                  placeholder="Password"
                  className="w-full px-2.5 py-2.5 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-200 dark:border-slate-700 text-xs text-warm-900 dark:text-white font-mono focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 5: INSTALLED MODULES CHECKLIST */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-warm-100 dark:border-darkbg-border">
            <div className="flex items-center space-x-2.5">
              <Layers className="w-5 h-5 text-indigo-500" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-warm-900 dark:text-white">
                5. Enabled Feature Modules ({selectedModules.length}/{ALL_AVAILABLE_MODULES.length})
              </h3>
            </div>
            <button
              type="button"
              onClick={handleSelectAllModules}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              {selectedModules.length === ALL_AVAILABLE_MODULES.length ? 'Deselect Extra' : 'Select All Modules'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {ALL_AVAILABLE_MODULES.map((mod) => {
              const isSelected = selectedModules.includes(mod.id);
              return (
                <div
                  key={mod.id}
                  onClick={() => toggleModule(mod.id)}
                  className={`p-3.5 rounded-xl border text-xs cursor-pointer transition-all flex items-start space-x-3 select-none ${
                    isSelected
                      ? 'bg-brand-500/10 border-brand-500/40 text-warm-900 dark:text-white shadow-xs'
                      : 'bg-warm-50 dark:bg-[#1a1e2b] border-warm-200 dark:border-slate-700/60 opacity-60 hover:opacity-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    className="mt-0.5 rounded text-brand-600 focus:ring-0 cursor-pointer"
                  />
                  <div>
                    <h5 className="font-bold">{mod.name}</h5>
                    <p className="text-[11px] text-warm-500 dark:text-slate-400 mt-0.5 leading-tight">{mod.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit & Action Buttons */}
        <div className="flex items-center justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/superadmin/colleges')}
            className="px-5 py-3 rounded-xl border border-warm-300 dark:border-slate-700 text-warm-700 dark:text-slate-300 text-xs font-bold hover:bg-warm-100"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 active:scale-95 transition-all flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Creating Client & Database Records...' : 'Complete College Registration'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};

export default RegisterCollege;