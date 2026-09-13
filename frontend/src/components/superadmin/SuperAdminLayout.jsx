import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import SuperAdminSidebar from './SuperAdminSidebar';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { 
  Bell, Database, ShieldCheck, Sun, Moon, 
  RefreshCw, AlertTriangle, AlertCircle, Menu, X, ExternalLink
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { BrandFooter } from '../brand/BrandFooter';

const SuperAdminLayout = () => {
  const { superAdmin, activeAlerts, refreshAlerts } = useSuperAdmin();
  const { darkMode, toggleDarkMode } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [localTime, setLocalTime] = useState(new Date());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setInterval(() => setLocalTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/superadmin': return 'Software Provider HQ Dashboard';
      case '/superadmin/colleges': return 'Colleges & Client Directory';
      case '/superadmin/colleges/new': return 'Register New College / Client';
      case '/superadmin/licenses': return 'License & Expiry Alarms';
      case '/superadmin/feature-control': return 'Granular Feature Matrix Control';
      case '/superadmin/database': return 'Multi-Database & Health Center';
      case '/superadmin/payments': return 'Payments, Invoices & AMC Billing';
      case '/superadmin/support': return 'Support Tickets & Helpdesk';
      case '/superadmin/audit': return 'Master Audit Log Records';
      default:
        if (location.pathname.startsWith('/superadmin/colleges/')) return 'College 360° Client Dossier';
        return 'Super Admin Master Console';
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f6f3] dark:bg-[#0c0d12] text-warm-900 dark:text-slate-100 flex transition-colors duration-300 relative overflow-hidden font-sans">
      
      {/* Super Admin Sidebar */}
      <SuperAdminSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Panel Content Area */}
      <div className="flex-1 w-full pl-0 md:pl-64 lg:pl-72 px-4 sm:px-6 md:px-8 py-4 sm:py-6 min-h-screen flex flex-col space-y-6 relative z-10">
        
        {/* Top Navbar Header */}
        <header className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border flex items-center justify-between shadow-xs transition-all">
          <div className="flex items-center space-x-3.5">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 rounded-xl bg-warm-100 dark:bg-darkbg-surface text-warm-700 dark:text-slate-300 hover:bg-warm-200"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none block">
                Master Software Provider Suite
              </span>
              <h2 className="text-lg sm:text-xl font-serif font-bold text-warm-900 dark:text-white leading-tight mt-1">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-3 sm:space-x-4">
            {/* Live Clock */}
            <div className="hidden lg:flex items-center space-x-2 text-xs font-semibold text-warm-600 dark:text-slate-400 bg-warm-100/70 dark:bg-[#1a1e2b] px-3 py-1.5 rounded-full">
              <span>{localTime.toLocaleTimeString()} | {localTime.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            </div>

            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setBellOpen(!bellOpen)}
                className="relative p-2.5 rounded-xl bg-warm-100/80 dark:bg-[#1a1e2b] text-warm-700 dark:text-slate-300 hover:bg-warm-200 dark:hover:bg-[#222738] transition-all"
                title="License & System Alerts"
              >
                <Bell className="w-4 h-4" />
                {activeAlerts && activeAlerts.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-600 text-white text-[9px] font-bold flex items-center justify-center animate-pulse">
                    {activeAlerts.length}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {bellOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-white dark:bg-[#161924] border border-warm-200 dark:border-darkbg-border shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
                  <div className="flex items-center justify-between pb-3 border-b border-warm-100 dark:border-darkbg-border">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-warm-900 dark:text-white flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500" />
                      <span>System Expiry Alerts ({activeAlerts.length})</span>
                    </h4>
                    <button 
                      onClick={() => setBellOpen(false)}
                      className="p-1 text-warm-400 hover:text-warm-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                    {activeAlerts.length === 0 ? (
                      <div className="py-6 text-center text-xs text-warm-500">
                        ✓ All client college licenses are healthy and active.
                      </div>
                    ) : (
                      activeAlerts.map((alert, idx) => (
                        <div
                          key={idx}
                          onClick={() => {
                            setBellOpen(false);
                            navigate(`/superadmin/colleges/${alert.id}`);
                          }}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:scale-[1.01] ${
                            alert.severity === 'critical'
                              ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                              : alert.severity === 'danger'
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                              : 'bg-warm-100 border-warm-200 text-warm-800 dark:bg-darkbg-surface dark:text-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span>{alert.name}</span>
                            <span className="font-mono text-[10px]">{alert.code}</span>
                          </div>
                          <p className="mt-1 text-[11px] opacity-90">{alert.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Dark / Light Mode Toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2.5 rounded-xl bg-warm-100/80 dark:bg-[#1a1e2b] text-warm-700 dark:text-slate-300 hover:bg-warm-200 dark:hover:bg-[#222738] transition-all"
              title="Toggle Theme"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-brand-600" />}
            </button>
          </div>
        </header>

        {/* Dynamic Nested Route Outlets */}
        <main className="flex-1 w-full overflow-x-hidden">
          <Outlet />
        </main>

        <BrandFooter />
      </div>
    </div>
  );
};

export default SuperAdminLayout;