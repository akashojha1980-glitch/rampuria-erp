import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Lock, User, AlertCircle, Sun, Moon, Shield, Award, Phone, Globe, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { CpuArchitecture } from '../components/ui/cpu-architecture';
import { PankhGoldLogo } from '../components/brand/PankhGoldLogo';
import { BRAND_CONFIG } from '../config/branding';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isAuthenticated, error, setError } = useAuth();
  const { darkMode, toggleTheme } = useTheme();
  const [localLoading, setLocalLoading] = useState(false);
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  // Clear errors on load
  useEffect(() => {
    setError(null);
  }, [setError]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setLocalLoading(true);
    const success = await login(username, password);
    setLocalLoading(false);
    
    if (success) {
      navigate('/');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-4 sm:p-6 md:p-12 gap-8 lg:gap-14 overflow-hidden bg-slate-950 text-slate-100 transition-colors duration-300 font-sans select-none">
      
      {/* Background Animated Gradient Aura */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[550px] h-[550px] bg-blue-600/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(#d4af37_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.04] pointer-events-none" />

      {/* Floating Theme Toggle (Absolute top-right) */}
      <div className="absolute top-6 right-6 flex items-center gap-3 z-20">
        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 border border-amber-500/20 text-[10px] font-mono font-bold text-amber-300 shadow-sm">
          <Shield className="w-3 h-3 text-amber-400" />
          {BRAND_CONFIG.version} • {BRAND_CONFIG.edition}
        </span>
        <button 
          onClick={toggleTheme}
          className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 text-amber-400 transition-all active:scale-95 shadow-sm"
          title="Toggle Theme"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-amber-400" />}
        </button>
      </div>

      {/* Visual Component Side */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden lg:flex flex-col items-center justify-center w-full max-w-lg p-8 bg-slate-900/50 border border-slate-800/80 rounded-3xl backdrop-blur-md shadow-2xl relative overflow-hidden"
      >
        <div className="w-full h-64 flex items-center justify-center">
          <CpuArchitecture className="text-amber-500/70 w-full h-full" text="PG-CMS CORE" />
        </div>
        
        <div className="text-center mt-6 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] font-mono uppercase tracking-widest font-bold">
            <Award className="w-3.5 h-3.5 text-amber-400" /> Enterprise Edition
          </div>
          <h2 className="text-sm font-serif font-bold text-slate-100 uppercase tracking-wider">
            Automated Academic & Financial Architecture
          </h2>
          <p className="text-[11px] text-slate-400 max-w-sm leading-relaxed">
            Engineered by <strong className="text-amber-400 font-semibold">{BRAND_CONFIG.companyName}</strong> for multi-session college admissions, merit verification algorithms, fee receipts, and offline SQL database resilience.
          </p>
        </div>

        {/* Support hotline bar on visual side */}
        <div className="w-full mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
          <span className="flex items-center gap-1.5"><Phone className="w-3 h-3 text-amber-400" /> Helpline: 9610077159 / 6375645010</span>
          <a href="https://ruchikasoftwaresolution.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-amber-400"><Globe className="w-3 h-3 text-amber-400" /> ruchikasoftwaresolution.com</a>
        </div>
      </motion.div>

      {/* Login Glass Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-8 sm:p-10 bg-slate-900/90 border border-amber-500/30 rounded-3xl shadow-2xl shadow-black/80 z-10 flex flex-col space-y-7 backdrop-blur-xl relative"
      >
        {/* Top Gold Accent Line */}
        <div className="absolute top-0 left-10 right-10 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />

        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <PankhGoldLogo variant="horizontal" size="md" />
          
          <div className="pt-2 border-t border-slate-800/80 w-full">
            <span className="text-[10px] font-mono font-bold tracking-widest text-amber-400 uppercase block">
              College Terminal Access Portal
            </span>
            <h2 className="text-sm font-serif font-bold text-slate-200 uppercase mt-0.5 tracking-wide">
              {BRAND_CONFIG.defaultCollegeName}
            </h2>
          </div>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-4">
          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Username */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admin Username</label>
            <div className="relative">
              <User className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all duration-200 text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-[14px] w-4 h-4 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-11 pr-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-600 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 outline-none transition-all duration-200 text-xs font-semibold"
                required
              />
            </div>
          </div>

          {/* Action button */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            type="submit"
            disabled={localLoading}
            className="w-full py-3.5 mt-2 bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-600 hover:from-amber-500 hover:to-yellow-400 text-slate-950 font-bold text-xs tracking-wider uppercase rounded-xl shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center font-serif"
          >
            {localLoading ? 'Verifying Credentials...' : 'Sign In To College ERP'}
          </motion.button>
        </form>

        <div className="text-center space-y-3 pt-2">
          <p className="text-[10px] text-slate-500 leading-relaxed font-mono">
            {BRAND_CONFIG.copyright}<br />
            Powered by <span className="text-amber-400 font-semibold">{BRAND_CONFIG.companyName}</span>
          </p>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              onClick={() => navigate('/superadmin/login')}
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors inline-flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" />
              <span>Super Admin HQ Console</span>
            </button>

            <span className="text-[10px] text-slate-500 font-mono">
              Build {BRAND_CONFIG.version}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
