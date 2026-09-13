import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Building2, CheckCircle, AlertTriangle, XCircle, 
  PauseCircle, ArrowUpRight, PlusCircle, KeyRound, 
  Database, Receipt, ShieldAlert, Users, TrendingUp,
  RefreshCw, Layers, LifeBuoy
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts';
import { useSuperAdmin } from '../../context/SuperAdminContext';

const SuperAdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const { token, refreshAlerts } = useSuperAdmin();
  const navigate = useNavigate();

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/dashboard/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const stats = await res.json();
        setData(stats);
      }
    } catch (error) {
      console.error('[Dashboard Stats Fetch Error]:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-3">
        <RefreshCw className="w-8 h-8 text-brand-500 animate-spin" />
        <p className="text-xs font-semibold text-warm-500">Aggregating Master Multi-College ERP Metrics...</p>
      </div>
    );
  }

  const { summary, packageStats, productStats, expiryAlerts, recentLogs } = data;

  const packageChartData = [
    { name: 'Basic', value: packageStats.Basic || 0, color: '#3b82f6' },
    { name: 'Standard', value: packageStats.Standard || 0, color: '#10b981' },
    { name: 'Premium', value: packageStats.Premium || 0, color: '#8b5cf6' },
    { name: 'Custom', value: packageStats.Custom || 0, color: '#f59e0b' }
  ];

  const productChartData = Object.keys(productStats || {}).map((key, i) => ({
    name: key,
    count: productStats[key],
    fill: ['#8C7A6B', '#10b981', '#6366f1', '#ec4899', '#f97316'][i % 5]
  }));

  return (
    <div className="flex flex-col space-y-8 font-sans">
      
      {/* 5 Summary KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 sm:gap-5">
        
        {/* Total Colleges */}
        <div 
          onClick={() => navigate('/superadmin/colleges')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-warm-500 dark:text-slate-400">Total Clients</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-warm-900 dark:text-white mt-3">
            {summary.totalColleges}
          </h3>
          <span className="text-[11px] text-warm-500 dark:text-slate-400 mt-1 block">Registered ERP Campuses</span>
        </div>

        {/* Active Licenses */}
        <div 
          onClick={() => navigate('/superadmin/colleges?status=Active')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Active Licenses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-emerald-700 dark:text-emerald-400 mt-3">
            {summary.activeColleges}
          </h3>
          <span className="text-[11px] text-emerald-600/80 dark:text-emerald-400/80 mt-1 block">Fully Operational</span>
        </div>

        {/* Renewal Due (<= 30 days) */}
        <div 
          onClick={() => navigate('/superadmin/licenses')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141721] border border-amber-200 dark:border-amber-900/40 bg-amber-500/5 shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 dark:text-amber-400">Renewal Due</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-amber-700 dark:text-amber-300 mt-3">
            {summary.renewalDueColleges}
          </h3>
          <span className="text-[11px] text-amber-600 dark:text-amber-400/80 mt-1 block">&le; 30 Days Left</span>
        </div>

        {/* Expired / Locked */}
        <div 
          onClick={() => navigate('/superadmin/colleges?status=Expired')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141721] border border-rose-200 dark:border-rose-900/40 bg-rose-500/5 shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600 dark:text-rose-400">Expired</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <XCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-rose-700 dark:text-rose-400 mt-3">
            {summary.expiredColleges}
          </h3>
          <span className="text-[11px] text-rose-600 dark:text-rose-400/80 mt-1 block">Access Locked</span>
        </div>

        {/* Suspended Clients */}
        <div 
          onClick={() => navigate('/superadmin/colleges?status=Suspended')}
          className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Suspended</span>
            <div className="p-2 rounded-xl bg-slate-500/10 text-slate-500">
              <PauseCircle className="w-5 h-5" />
            </div>
          </div>
          <h3 className="text-2xl sm:text-3xl font-bold font-serif text-slate-700 dark:text-slate-300 mt-3">
            {summary.suspendedColleges}
          </h3>
          <span className="text-[11px] text-slate-500 mt-1 block">Administrative Hold</span>
        </div>
      </div>

      {/* Revenue & Financial Snapshot Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 rounded-2xl bg-gradient-to-tr from-brand-900 to-amber-950 text-white shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-amber-300 block">Total Lifetime Revenue</span>
            <h4 className="text-2xl font-bold font-serif mt-1">₹ {summary.totalRevenue.toLocaleString('en-IN')}</h4>
            <span className="text-[11px] text-warm-300 mt-1 block">License Fees + Onboarding</span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <Receipt className="w-6 h-6 text-amber-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-tr from-emerald-950 to-teal-900 text-white shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-300 block">Pending Invoices / AMC Due</span>
            <h4 className="text-2xl font-bold font-serif mt-1">₹ {summary.pendingRevenue.toLocaleString('en-IN')}</h4>
            <span className="text-[11px] text-emerald-200 mt-1 block">To be collected</span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <TrendingUp className="w-6 h-6 text-emerald-400" />
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-gradient-to-tr from-purple-950 to-indigo-900 text-white shadow-lg flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-purple-300 block">Open Support Tickets</span>
            <h4 className="text-2xl font-bold font-serif mt-1">{summary.openTickets} Active Cases</h4>
            <span className="text-[11px] text-purple-200 mt-1 block">Client Helpdesk Queue</span>
          </div>
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-xs">
            <LifeBuoy className="w-6 h-6 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Main Grid: Graphs & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Product Type Breakdown Bar Chart (Future Ready) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-warm-900 dark:text-white uppercase tracking-wider">Multi-Product ERP Portfolio</h3>
              <p className="text-xs text-warm-500 dark:text-slate-400">Distribution across verticals (Future Ready Platform)</p>
            </div>
            <span className="text-[10px] font-mono font-bold bg-brand-500/10 text-brand-600 dark:text-brand-400 px-2.5 py-1 rounded-full border border-brand-500/20">
              Active Verticals: {productChartData.length}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.08} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} />
                <YAxis tickLine={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name="Colleges / Institutes" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Operations Dock */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-warm-900 dark:text-white uppercase tracking-wider">Master Quick Operations</h3>
            
            <div className="space-y-2.5">
              <button
                onClick={() => navigate('/superadmin/colleges/new')}
                className="w-full p-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-between shadow-md shadow-brand-600/20 transition-all"
              >
                <div className="flex items-center space-x-3">
                  <PlusCircle className="w-4 h-4" />
                  <span>Register New College</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/superadmin/licenses')}
                className="w-full p-3 rounded-xl bg-warm-100 dark:bg-darkbg-surface hover:bg-warm-200 text-warm-900 dark:text-white text-xs font-bold flex items-center justify-between border border-warm-200 dark:border-darkbg-border transition-all"
              >
                <div className="flex items-center space-x-3">
                  <KeyRound className="w-4 h-4 text-amber-500" />
                  <span>Renew License Key</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/superadmin/feature-control')}
                className="w-full p-3 rounded-xl bg-warm-100 dark:bg-darkbg-surface hover:bg-warm-200 text-warm-900 dark:text-white text-xs font-bold flex items-center justify-between border border-warm-200 dark:border-darkbg-border transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Layers className="w-4 h-4 text-emerald-500" />
                  <span>Feature Module Matrix</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => navigate('/superadmin/database')}
                className="w-full p-3 rounded-xl bg-warm-100 dark:bg-darkbg-surface hover:bg-warm-200 text-warm-900 dark:text-white text-xs font-bold flex items-center justify-between border border-warm-200 dark:border-darkbg-border transition-all"
              >
                <div className="flex items-center space-x-3">
                  <Database className="w-4 h-4 text-purple-500" />
                  <span>Backup & Multi-DB Health</span>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-warm-100 dark:border-darkbg-border flex items-center justify-between text-[11px] text-warm-500">
            <span>Server: Microsoft SQL Server</span>
            <span className="text-emerald-600 font-bold">● Port 1433 OK</span>
          </div>
        </div>
      </div>

      {/* Grid: Expiry Alarms & Recent Audit Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Expiry Warning Queue */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-warm-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-500" />
              <span>License Expiry Alarms</span>
            </h3>
            <button 
              onClick={() => navigate('/superadmin/licenses')}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              View All Licenses
            </button>
          </div>

          {expiryAlerts.length === 0 ? (
            <div className="py-8 text-center text-xs text-warm-500">
              ✓ All college client licenses have ample validity (&gt; 30 days).
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {expiryAlerts.map((alert, i) => (
                <div 
                  key={i}
                  onClick={() => navigate(`/superadmin/colleges/${alert.id}`)}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer hover:scale-[1.01] transition-all ${
                    alert.severity === 'critical'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-400'
                      : alert.severity === 'danger'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                      : 'bg-warm-100 border-warm-200 text-warm-800 dark:bg-darkbg-surface dark:text-slate-300'
                  }`}
                >
                  <div>
                    <h5 className="font-bold">{alert.name}</h5>
                    <p className="text-[11px] opacity-90 mt-0.5">{alert.message}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/10 dark:bg-white/10 font-bold">
                      {alert.remainingDays <= 0 ? 'LOCKED' : `${alert.remainingDays}d left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Master Audit Logs */}
        <div className="p-6 rounded-2xl bg-white dark:bg-[#141721] border border-warm-200/80 dark:border-darkbg-border shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-warm-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Users className="w-4 h-4 text-brand-500" />
              <span>Recent Super Admin Actions</span>
            </h3>
            <button 
              onClick={() => navigate('/superadmin/audit')}
              className="text-xs text-brand-600 dark:text-brand-400 font-bold hover:underline"
            >
              Full Audit Trail
            </button>
          </div>

          <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
            {recentLogs && recentLogs.length > 0 ? (
              recentLogs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl bg-warm-50 dark:bg-[#1a1e2b] border border-warm-100 dark:border-darkbg-border text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-warm-900 dark:text-white">{log.action}</span>
                    <p className="text-[11px] text-warm-500 dark:text-slate-400 mt-0.5 truncate max-w-xs">{log.target || log.details}</p>
                  </div>
                  <div className="text-right text-[10px] text-warm-400 shrink-0 font-mono">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-warm-500">
                No recent activity recorded.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default SuperAdminDashboard;