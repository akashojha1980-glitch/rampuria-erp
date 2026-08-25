import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { 
  Database, Clock, RefreshCw, GraduationCap, 
  BookOpen, Scale, Scroll, PenTool, BookMarked 
} from 'lucide-react';

const Layout = () => {
  const location = useLocation();
  const [dbOnline, setDbOnline] = useState(true);
  const [dbChecking, setDbChecking] = useState(false);
  const [localTime, setLocalTime] = useState(new Date());
  const [cursorPos, setCursorPos] = useState({ x: 0, y: 0 });

  // Update ticking time
  useEffect(() => {
    const timer = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Track Mouse Cursor for custom soft glow
  useEffect(() => {
    const handleMouseMove = (e) => {
      setCursorPos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  // Check database status
  const checkDbStatus = async () => {
    setDbChecking(true);
    const token = localStorage.getItem('token');
    try {
      const res = await fetch('/api/courses', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setDbOnline(res.ok || res.status === 401);
    } catch (err) {
      setDbOnline(false);
    } finally {
      setDbChecking(false);
    }
  };

  useEffect(() => {
    checkDbStatus();
    const interval = setInterval(checkDbStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Mapping paths to titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Dashboard Overview';
      case '/registration': return 'Student Registration Form';
      case '/verification': return 'Document Verification Portal';
      case '/fees': return 'Fees Control & Cashflow Console';
      default:
        if (location.pathname.startsWith('/profile/')) return 'Student Profile Summary';
        return 'ERP Console';
    }
  };

  return (
    <div className="min-h-screen bg-warm-50 dark:bg-darkbg-base flex transition-colors duration-300 relative overflow-hidden">
      
      {/* ─── CUSTOM SOFT GLOW CURSOR TRAILER ─── */}
      <div 
        className="fixed w-36 h-36 rounded-full pointer-events-none z-50 transition-transform duration-[400ms] ease-out -translate-x-1/2 -translate-y-1/2 opacity-40 dark:opacity-20"
        style={{
          left: `${cursorPos.x}px`,
          top: `${cursorPos.y}px`,
          background: 'radial-gradient(circle, rgba(140,122,107,0.3) 0%, rgba(140,122,107,0) 70%)',
          boxShadow: '0 0 35px 5px rgba(140,122,107,0.1)'
        }}
      />

      {/* ─── DYNAMIC FLOATING BACKGROUND VECTORS (SVG) ─── */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-[0.25] dark:opacity-[0.18]">
        {/* Floating BookOpen */}
        <div className="absolute top-[12%] left-[25%] animate-float-screen1 text-brand-500/80 dark:text-brand-500/60">
          <BookOpen size={90} strokeWidth={0.8} />
        </div>
        {/* Floating Scale */}
        <div className="absolute top-[35%] right-[15%] animate-float-screen2 text-brand-500/80 dark:text-brand-500/60">
          <Scale size={100} strokeWidth={0.8} />
        </div>
        {/* Floating GraduationCap */}
        <div className="absolute bottom-[20%] left-[30%] animate-float-screen3 text-brand-500/80 dark:text-brand-500/60">
          <GraduationCap size={95} strokeWidth={0.8} />
        </div>
        {/* Floating BookMarked */}
        <div className="absolute bottom-[40%] left-[80%] animate-float-screen1 text-brand-500/80 dark:text-brand-500/60">
          <BookMarked size={80} strokeWidth={0.8} />
        </div>
        {/* Floating Scroll */}
        <div className="absolute top-[65%] left-[10%] animate-float-screen2 text-brand-500/80 dark:text-brand-500/60">
          <Scroll size={75} strokeWidth={0.8} />
        </div>
        {/* Floating PenTool */}
        <div className="absolute top-[48%] left-[45%] animate-float-screen3 text-brand-500/80 dark:text-brand-500/60">
          <PenTool size={65} strokeWidth={0.8} />
        </div>
      </div>

      {/* Sidebar Nav Dock */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 pl-[19rem] pr-8 py-8 min-h-screen flex flex-col space-y-8 relative z-10">
        
        {/* Top Header */}
        <header className="classy-card px-8 py-5 flex items-center justify-between z-10 border border-warm-200/50 dark:border-darkbg-border">
          <div>
            <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest leading-none">ERP System Control</span>
            <h2 className="text-2xl font-serif font-semibold text-warm-900 dark:text-slate-100 leading-none mt-2">{getPageTitle()}</h2>
          </div>

          <div className="flex items-center space-x-6">
            {/* Live Local Clock */}
            <div className="flex items-center space-x-2 text-xs font-medium text-warm-800/60 dark:text-slate-400">
              <Clock className="w-4 h-4 text-brand-500" />
              <span>{localTime.toLocaleTimeString()} | {localTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            <div className="h-4 w-px bg-warm-200 dark:bg-darkbg-border" />

            {/* Offline/Online Local SQL Server status */}
            <button 
              onClick={checkDbStatus}
              disabled={dbChecking}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full border text-[11px] font-medium transition-all duration-200 ${
                dbOnline 
                  ? 'bg-emerald-50/50 border-emerald-200/40 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20'
                  : 'bg-rose-50/50 border-rose-200/40 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20'
              }`}
            >
              <Database className={`w-3.5 h-3.5 ${dbOnline ? 'text-emerald-500' : 'text-rose-500'}`} />
              <span>{dbOnline ? 'SQL Server: Connected' : 'Database: Disconnected'}</span>
              <RefreshCw className={`w-3 h-3 text-slate-400 ${dbChecking ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Global Database Offline Warn Panel */}
        {!dbOnline && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-700 dark:text-rose-400 p-5 rounded-2xl flex flex-col space-y-2.5 shadow-sm">
            <h4 className="text-sm font-bold flex items-center space-x-2">
              <span>⚠️ Connection Error: SQL Server Unreachable</span>
            </h4>
            <p className="text-xs leading-relaxed opacity-90">
              The application could not establish a connection to your local Microsoft SQL Server database. 
              Please check if your SQL Server service is running, verify port 1433 settings, or update database credentials in your <strong>backend/.env</strong> file.
            </p>
          </div>
        )}

        {/* Dynamic Page Outlets */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
