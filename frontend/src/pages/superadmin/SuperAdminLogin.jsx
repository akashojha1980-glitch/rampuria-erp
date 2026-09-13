import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { 
  ShieldCheck, Lock, User, ArrowRight, KeyRound, 
  HelpCircle, CheckCircle2, AlertCircle, Sparkles, Building, Shield
} from 'lucide-react';
import { PankhGoldLogo } from '../../components/brand/PankhGoldLogo';
import { BRAND_CONFIG } from '../../config/branding';

const SuperAdminLogin = () => {
  const [username, setUsername] = useState('superadmin');
  const [password, setPassword] = useState('SuperAdmin@2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Forgot password modal state
  const [forgotModal, setForgotModal] = useState(false);
  const [forgotUsername, setForgotUsername] = useState('superadmin');
  const [secQuestion, setSecQuestion] = useState('');
  const [secAnswer, setSecAnswer] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [forgotStep, setForgotStep] = useState(1); // 1: enter username, 2: answer & new pass
  const [forgotMsg, setForgotMsg] = useState({ type: '', text: '' });

  const { login } = useSuperAdmin();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/superadmin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Login failed');
      }

      login(data.token, data.superAdmin);
      navigate('/superadmin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFetchQuestion = async (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/superadmin/auth/forgot-password-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: forgotUsername })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSecQuestion(data.securityQuestion);
      setForgotStep(2);
    } catch (err) {
      setForgotMsg({ type: 'error', text: err.message });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setForgotMsg({ type: '', text: '' });
    try {
      const res = await fetch('/api/superadmin/auth/reset-password-with-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username: forgotUsername, 
          securityAnswer: secAnswer, 
          newPassword 
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setForgotMsg({ type: 'success', text: data.message });
      setTimeout(() => {
        setForgotModal(false);
        setForgotStep(1);
        setPassword(newPassword);
      }, 1500);
    } catch (err) {
      setForgotMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-100 flex items-center justify-center p-4 relative overflow-hidden font-sans select-none">
      
      {/* Dynamic Ambient Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:28px_28px] opacity-[0.03] pointer-events-none" />

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-[#10141f]/95 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl relative z-10 backdrop-blur-md">
        
        {/* Top Gold Accent Bar */}
        <div className="absolute top-0 left-8 right-8 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <PankhGoldLogo variant="horizontal" size="md" />
          </div>
          
          <div className="pt-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-500/10 px-3 py-0.5 rounded-full border border-amber-500/20 font-mono">
              Provider Master HQ Console
            </span>
            <h1 className="text-xl font-serif font-bold text-white mt-1.5">Super Admin Portal</h1>
            <p className="text-xs text-slate-400">Multi-College Tenant ERP & Central Governance Suite</p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mt-5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300">Master Username</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="superadmin"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1e2b] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Master Key Password</label>
              <button
                type="button"
                onClick={() => {
                  setForgotModal(true);
                  setForgotStep(1);
                  setForgotMsg({ type: '', text: '' });
                }}
                className="text-[11px] text-amber-400 hover:text-amber-300 hover:underline"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1e2b] border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-mono"
              />
            </div>
          </div>

          {/* Quick Demo Pre-fill helper */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center space-x-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded bg-[#1a1e2b] border-slate-700 text-brand-600 focus:ring-0"
              />
              <span>Remember Login</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setUsername('superadmin');
                setPassword('SuperAdmin@2026');
              }}
              className="text-[10px] text-brand-400 hover:text-brand-300 flex items-center gap-1 bg-brand-500/10 px-2 py-0.5 rounded-full"
            >
              <Sparkles className="w-3 h-3" />
              <span>Fill Master Credentials</span>
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 via-brand-600 to-rose-600 hover:from-amber-500 hover:to-rose-500 text-white text-xs font-bold shadow-lg shadow-brand-600/30 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-50 mt-2"
          >
            {loading ? (
              <span>Authorizing Master Console...</span>
            ) : (
              <>
                <span>Access Super Admin HQ</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Client Portal Link */}
        <div className="mt-6 pt-5 border-t border-slate-800 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <Building className="w-3.5 h-3.5 text-amber-400" />
            <span>Switch to College User Portal</span>
          </a>
        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {forgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-[#161a26] border border-slate-700 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-amber-400" />
                <span>Super Admin Password Recovery</span>
              </h3>
              <button 
                onClick={() => setForgotModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            {forgotMsg.text && (
              <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                forgotMsg.type === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
              }`}>
                {forgotMsg.type === 'error' ? <AlertCircle className="w-4 h-4 shrink-0" /> : <CheckCircle2 className="w-4 h-4 shrink-0" />}
                <span>{forgotMsg.text}</span>
              </div>
            )}

            {forgotStep === 1 ? (
              <form onSubmit={handleFetchQuestion} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Enter Super Admin Username</label>
                  <input
                    type="text"
                    required
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full px-3 py-2 bg-[#1a1e2b] border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-brand-600 hover:bg-brand-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Verify Username & Get Security Question
                </button>
              </form>
            ) : (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 font-medium">
                  {secQuestion}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">Security Answer</label>
                  <input
                    type="text"
                    required
                    value={secAnswer}
                    onChange={(e) => setSecAnswer(e.target.value)}
                    placeholder="Enter answer (Hint: ERP2026MASTER)"
                    className="w-full px-3 py-2 bg-[#1a1e2b] border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-300">New Password</label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new master password"
                    className="w-full px-3 py-2 bg-[#1a1e2b] border border-slate-700 rounded-xl text-xs text-white font-mono"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all"
                >
                  Confirm & Reset Master Password
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuperAdminLogin;