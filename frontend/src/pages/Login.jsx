import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { GraduationCap, Lock, User, AlertCircle, Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CpuArchitecture } from '../components/ui/cpu-architecture';

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
    <div className="relative min-h-screen w-full flex flex-col md:flex-row items-center justify-center p-6 md:p-12 gap-10 overflow-hidden bg-warm-50 dark:bg-darkbg-base text-warm-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Floating Theme Toggle (Absolute top-right) */}
      <button 
        onClick={toggleTheme}
        className="absolute top-6 right-6 p-3 rounded-xl bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border hover:bg-warm-100/50 dark:hover:bg-darkbg-border text-warm-850 dark:text-slate-300 transition-all z-20 active:scale-95 shadow-sm"
      >
        {darkMode ? <Sun className="w-5 h-5 text-amber-500" /> : <Moon className="w-5 h-5 text-brand-600" />}
      </button>

      {/* Visual Component Side */}
      <motion.div 
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex flex-col items-center justify-center w-full max-w-lg p-8 bg-white/40 dark:bg-darkbg-surface/30 border border-warm-200/50 dark:border-darkbg-border/50 rounded-2xl backdrop-blur-sm shadow-sm"
      >
        <div className="w-full h-72 flex items-center justify-center">
          <CpuArchitecture className="text-brand-500/80 dark:text-brand-500/40 w-full h-full" text="LAW ERP" />
        </div>
        <div className="text-center mt-6 space-y-2">
          <h2 className="text-sm font-serif font-bold text-warm-900 dark:text-white uppercase tracking-wider">Secure Admission Core</h2>
          <p className="text-[11px] text-warm-800/60 dark:text-slate-400 max-w-sm">
            Powered by a localized core engine handling encrypted student registries, automated merit seat allotment algorithms, and secure document verification pipelines.
          </p>
        </div>
      </motion.div>

      {/* Login Glass Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md p-10 bg-white dark:bg-darkbg-surface border border-warm-200 dark:border-darkbg-border rounded-2xl shadow-elegant dark:shadow-elegant-dark z-10 flex flex-col space-y-8"
      >
        {/* Brand / Logo */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="p-4 bg-brand-600 dark:bg-brand-500 rounded-2xl text-white shadow-sm">
            <GraduationCap className="w-10 h-10" />
          </div>
          <div>
            <h1 className="text-lg font-serif font-extrabold text-warm-900 dark:text-white uppercase leading-tight tracking-tight">
              B.J.S. RAMPURIA JAIN
              <span className="text-xs font-sans font-bold text-brand-500 tracking-widest uppercase block mt-1">LAW COLLEGE ERP</span>
            </h1>
            <p className="text-[9px] text-warm-800/50 dark:text-slate-500 font-bold tracking-widest uppercase mt-2">Single-PC Local Terminal</p>
          </div>
        </div>

        {/* Input Forms */}
        <form onSubmit={handleSubmit} className="flex flex-col space-y-5">
          {error && (
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex items-center space-x-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-600 dark:text-rose-455 text-xs font-semibold"
            >
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 flex-shrink-0" />
              <span>{error}</span>
            </motion.div>
          )}

          {/* Username */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-800/40 dark:text-slate-500">Admin Username</label>
            <div className="relative">
              <User className="absolute left-4 top-[15px] w-4.5 h-4.5 text-warm-800/30 dark:text-slate-500" />
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-warm-900 dark:text-slate-100 placeholder-warm-800/30 dark:placeholder-slate-650 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all duration-200 text-sm font-semibold"
                required
              />
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col space-y-1.5">
            <label className="text-xs font-bold uppercase tracking-wider text-warm-800/40 dark:text-slate-500">Security Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-[15px] w-4.5 h-4.5 text-warm-800/30 dark:text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50/50 dark:bg-darkbg-base text-warm-900 dark:text-slate-100 placeholder-warm-800/30 dark:placeholder-slate-650 focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all duration-200 text-sm font-semibold"
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
            className="w-full py-4 mt-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm tracking-wide rounded-xl shadow-sm hover:shadow transition-all duration-150 flex items-center justify-center"
          >
            {localLoading ? 'Authenticating Admin...' : 'Authenticate & Enter'}
          </motion.button>
        </form>

        <div className="text-center">
          <p className="text-[10px] text-warm-800/40 dark:text-slate-500 font-semibold leading-relaxed">
            Authorized Single College PC Use Only.<br />
            Security active. Local session timeout: 30 days.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
