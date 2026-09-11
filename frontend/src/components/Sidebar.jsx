import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserPlus, FileCheck, Award, 
  LogOut, Sun, Moon, GraduationCap, CreditCard, BookOpen, Users, BarChart3, FileText, X,
  Database
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = ({ mobileOpen = false, setMobileOpen = () => {} }) => {
  const { admin, logout } = useAuth();
  const { darkMode, toggleTheme, currentTheme, setAccentTheme, themes } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleNavClick = () => {
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const allNavItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard className="w-5 h-5" />, key: 'dashboard' },
    { name: 'Registration', path: '/registration', icon: <UserPlus className="w-5 h-5" />, key: 'registration' },
    { name: 'Student 360 Dossier', path: '/dossier', icon: <FileText className="w-5 h-5" />, key: 'registration' },
    { name: 'Verification', path: '/verification', icon: <FileCheck className="w-5 h-5" />, key: 'verification' },
    { name: 'Promotion', path: '/promotion', icon: <GraduationCap className="w-5 h-5" />, key: 'verification' },
    { name: 'Exam Results', path: '/results', icon: <Award className="w-5 h-5" />, key: 'verification' },
    { name: 'Fees Console', path: '/fees', icon: <CreditCard className="w-5 h-5" />, key: 'fees' },
    { name: 'Library Console', path: '/library', icon: <BookOpen className="w-5 h-5" />, key: 'library' },
    { name: 'Reports Panel', path: '/reports', icon: <BarChart3 className="w-5 h-5" />, key: 'reports' },
    { name: 'Staff Access', path: '/users', icon: <Users className="w-5 h-5" />, key: 'users' },
    { name: 'Database & LAN', path: '/database-settings', icon: <Database className="w-5 h-5" />, key: 'database' },
  ];

  const isSuperAdmin = 
    !admin?.role ||
    admin?.role?.toLowerCase() === 'superadmin' || 
    admin?.role?.toLowerCase() === 'admin' || 
    admin?.username === 'admin';

  const navItems = allNavItems.filter(item => {
    if (isSuperAdmin) return true;
    if (item.key === 'dashboard' || item.key === 'database') return true;
    return admin?.permissions?.includes(item.key);
  });

  return (
    <>
      {/* Mobile Drawer Backdrop Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-warm-900/60 dark:bg-black/80 backdrop-blur-sm z-40 md:hidden transition-opacity"
        />
      )}

      <aside className={`
        w-72 bg-white dark:bg-darkbg-surface border-r border-warm-200/50 dark:border-darkbg-border h-screen flex flex-col justify-between p-4 md:p-5 fixed left-0 top-0 z-50 md:z-20 shadow-xl md:shadow-sm no-print transition-transform duration-300 ease-in-out
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Header / Logo */}
        <div className="flex items-center justify-between shrink-0 pb-3 border-b border-warm-200/50 dark:border-darkbg-border">
          <div className="flex items-center space-x-3 px-1">
            <div className="p-2 bg-brand-600 dark:bg-brand-500 rounded-xl text-white shadow-sm flex-shrink-0">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-serif font-bold text-xs tracking-tight text-warm-900 dark:text-slate-100 leading-tight">
                B.J.S. RAMPURIA JAIN
              </h1>
              <span className="text-[9px] font-bold text-brand-500 tracking-wider uppercase block mt-0.5">
                LAW COLLEGE ERP
              </span>
            </div>
          </div>

          {/* Close button on mobile */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav Links - Scrollable container */}
        <div className="flex-1 overflow-y-auto py-2.5 space-y-1 pr-1 my-1 custom-scrollbar">
          <nav className="flex flex-col space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={handleNavClick}
                className={({ isActive }) => `
                  flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200
                  ${isActive 
                    ? 'bg-brand-500 text-white shadow-sm dark:bg-brand-600' 
                    : 'text-warm-800/70 hover:text-warm-900 hover:bg-warm-100/40 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-darkbg-base/60'
                  }
                `}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                <span className="truncate">{item.name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Footer Controls (Theme & Admin & Logout) - Always visible & Compact */}
        <div className="flex flex-col space-y-2.5 shrink-0 pt-2.5 border-t border-warm-200/50 dark:border-darkbg-border">
          {/* Accent Theme Selector */}
          <div className="flex flex-col space-y-1 px-0.5">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-bold text-warm-800/50 dark:text-slate-400 uppercase tracking-wider block">Accent Theme</span>
              <span className="text-[9px] font-semibold text-brand-600 dark:text-brand-400 capitalize">{themes.find(t=>t.id===currentTheme)?.name}</span>
            </div>
            <div className="relative">
              <select
                value={currentTheme}
                onChange={(e) => setAccentTheme(e.target.value)}
                className="w-full pl-2.5 pr-7 py-1.5 rounded-lg border border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base text-[11px] font-semibold text-warm-850 dark:text-slate-200 outline-none appearance-none cursor-pointer focus:border-brand-500 transition-colors"
              >
                {themes.map((t) => (
                  <option key={t.id} value={t.id} className="dark:bg-darkbg-surface dark:text-slate-200">
                    {t.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-warm-800/40 dark:text-slate-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Theme Mode Toggle (Light / Dark) */}
          <button
            onClick={toggleTheme}
            className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-[11px] font-semibold bg-warm-50 hover:bg-warm-100/60 dark:bg-darkbg-base dark:hover:bg-darkbg-base/90 text-warm-800/80 dark:text-slate-300 transition-colors border border-warm-200/40 dark:border-darkbg-border"
          >
            <div className="flex items-center space-x-2">
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-brand-500" />}
              <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
            </div>
            <span className="text-[9px] text-brand-600 dark:text-brand-400 uppercase tracking-wider font-bold">Toggle</span>
          </button>

          {/* Admin profile detail card + Logout */}
          <div className="flex items-center justify-between bg-warm-50/70 dark:bg-darkbg-base/60 border border-warm-200/50 dark:border-darkbg-border p-2.5 rounded-xl">
            <div className="flex items-center space-x-2.5 min-w-0">
              <div className="w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center font-bold text-[10px] flex-shrink-0 shadow-sm">
                {admin?.name?.split(' ').map(n=>n[0]).join('') || 'AD'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold leading-tight text-warm-900 dark:text-slate-200 truncate max-w-[120px]">
                  {admin?.name || 'Admin'}
                </span>
                <span className="text-[9px] text-warm-800/50 dark:text-slate-400 font-semibold uppercase tracking-wider">
                  {admin?.role || 'Staff'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              title="Log Out Terminal"
              className="p-1.5 rounded-lg text-warm-800/50 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/20 transition-all flex-shrink-0"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
