import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, UserPlus, FileCheck, Award, 
  LogOut, Sun, Moon, GraduationCap, CreditCard, BookOpen, Users, BarChart3
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const Sidebar = () => {
  const { admin, logout } = useAuth();
  const { darkMode, toggleTheme, currentTheme, setAccentTheme, themes } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
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
  ];

  const navItems = allNavItems.filter(item => {
    if (admin?.role === 'SuperAdmin') return true;
    return admin?.permissions?.includes(item.key);
  });

  if (admin?.role === 'SuperAdmin') {
    navItems.push({
      name: 'Staff Access',
      path: '/users',
      icon: <Users className="w-5 h-5" />,
      key: 'users'
    });
  }

  return (
    <aside className="w-72 bg-white dark:bg-darkbg-surface border-r border-warm-200/50 dark:border-darkbg-border h-screen flex flex-col justify-between p-8 fixed left-0 top-0 z-20">
      {/* Header / Logo */}
      <div className="flex flex-col space-y-8">
        <div className="flex items-center space-x-3 px-1">
          <div className="p-2 bg-brand-600 dark:bg-brand-500 rounded-xl text-white shadow-sm flex-shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-xs tracking-tight text-warm-900 dark:text-slate-100 leading-tight">
              B.J.S. RAMPURIA JAIN
            </h1>
            <span className="text-[9px] font-bold text-brand-500 tracking-wider uppercase block mt-0.5">
              LAW COLLEGE
            </span>
          </div>
        </div>

        <div className="h-px bg-warm-200/50 dark:bg-darkbg-border w-full" />

        {/* Nav Links */}
        <nav className="flex flex-col space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center space-x-4 px-5 py-3.5 rounded-xl text-sm font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-brand-500 text-white shadow-sm dark:bg-brand-600' 
                  : 'text-warm-800/70 hover:text-warm-900 hover:bg-warm-100/30 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-darkbg-base/50'
                }
              `}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer Controls (Theme & Admin & Logout) */}
      <div className="flex flex-col space-y-4">
        <div className="h-px bg-warm-200/50 dark:bg-darkbg-border w-full" />

        {/* Accent Theme Selector */}
        <div className="flex flex-col space-y-1.5 px-1">
          <span className="text-[9px] font-bold text-warm-800/40 dark:text-slate-500 uppercase tracking-widest block">Royal Accent Theme</span>
          <div className="relative">
            <select
              value={currentTheme}
              onChange={(e) => setAccentTheme(e.target.value)}
              className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-warm-200 dark:border-darkbg-border bg-warm-50 dark:bg-darkbg-base text-xs font-semibold text-warm-850 dark:text-slate-200 outline-none appearance-none cursor-pointer focus:border-brand-500 transition-colors"
            >
              {themes.map((t) => (
                <option key={t.id} value={t.id} className="dark:bg-darkbg-surface dark:text-slate-200">
                  {t.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-warm-800/40 dark:text-slate-500">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-between w-full px-5 py-3 rounded-xl text-xs font-semibold bg-warm-50 hover:bg-warm-100/50 dark:bg-darkbg-base dark:hover:bg-darkbg-base/80 text-warm-800/80 dark:text-slate-300 transition-colors duration-200 border border-warm-200/30 dark:border-darkbg-border"
        >
          <div className="flex items-center space-x-2.5">
            {darkMode ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-brand-500" />}
            <span>{darkMode ? 'Light Theme' : 'Dark Theme'}</span>
          </div>
          <span className="text-[9px] text-warm-800/40 dark:text-slate-500 uppercase tracking-wider font-bold">Switch</span>
        </button>

        {/* Admin profile detail card */}
        <div className="flex items-center justify-between bg-warm-50/50 dark:bg-darkbg-base/40 border border-warm-200/40 dark:border-darkbg-border p-3.5 rounded-xl">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-full bg-brand-500/10 text-brand-700 dark:bg-brand-500/20 dark:text-brand-300 flex items-center justify-center font-bold text-xs">
              {admin?.name?.split(' ').map(n=>n[0]).join('') || 'AD'}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold leading-tight text-warm-900 dark:text-slate-200 max-w-[110px] truncate">{admin?.name || 'Admin'}</span>
              <span className="text-[9px] text-warm-800/50 dark:text-slate-500 font-semibold uppercase tracking-wider">{admin?.username || 'admin'}</span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            title="Log Out"
            className="p-2 rounded-lg text-warm-800/40 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
          >
            <LogOut className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
