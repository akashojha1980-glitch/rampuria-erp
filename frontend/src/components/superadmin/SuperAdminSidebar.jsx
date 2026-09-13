import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
   LayoutDashboard, Building2, PlusCircle, KeyRound, 
   ToggleLeft, LifeBuoy, Database, Receipt, History, 
   LogOut, ExternalLink, ShieldCheck, Sparkles, X, Info
 } from 'lucide-react';
import { useSuperAdmin } from '../../context/SuperAdminContext';
import { PankhGoldLogo } from '../brand/PankhGoldLogo';
import { BRAND_CONFIG } from '../../config/branding';

const SuperAdminSidebar = ({ mobileOpen, setMobileOpen }) => {
   const { superAdmin, logout } = useSuperAdmin();
   const navigate = useNavigate();

   const navLinks = [
     { path: '/superadmin', label: 'Master Overview', icon: LayoutDashboard, exact: true },
     { path: '/superadmin/colleges', label: 'Colleges Directory', icon: Building2 },
     { path: '/superadmin/colleges/new', label: 'Register New College', icon: PlusCircle },
     { path: '/superadmin/licenses', label: 'License & Renewals', icon: KeyRound },
     { path: '/superadmin/feature-control', label: 'Feature Control Matrix', icon: ToggleLeft },
     { path: '/superadmin/database', label: 'Multi-DB Management', icon: Database },
     { path: '/superadmin/payments', label: 'Billing & AMC Invoices', icon: Receipt },
     { path: '/superadmin/support', label: 'Support Helpdesk', icon: LifeBuoy },
     { path: '/superadmin/audit', label: 'Global Audit Logs', icon: History },
   ];

   const handleLogout = () => {
     logout();
     navigate('/superadmin/login');
   };

   const sidebarContent = (
     <div className="flex flex-col h-full justify-between p-5 bg-[#0a0d14] text-slate-100 border-r border-slate-800/80 select-none">
       {/* Brand Header */}
       <div>
         <div className="flex items-center justify-between pb-4 border-b border-slate-800">
           <div className="flex flex-col">
             <PankhGoldLogo variant="compact" size="sm" />
             <div className="mt-1 flex items-center gap-1.5">
               <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase font-bold">
                 Super Admin HQ
               </span>
               <span className="text-[9px] text-slate-400 font-mono">{BRAND_CONFIG.version}</span>
             </div>
           </div>

           {/* Mobile Close Button */}
           {setMobileOpen && (
             <button
               onClick={() => setMobileOpen(false)}
               className="md:hidden p-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
             >
               <X className="w-5 h-5" />
             </button>
           )}
         </div>

         {/* Navigation Links */}
         <nav className="mt-6 space-y-1.5">
           {navLinks.map((link) => {
             const Icon = link.icon;
             return (
               <NavLink
                 key={link.path}
                 to={link.path}
                 end={link.exact}
                 onClick={() => setMobileOpen && setMobileOpen(false)}
                 className={({ isActive }) =>
                   `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 ${
                     isActive
                       ? 'bg-brand-600 text-white shadow-md shadow-brand-600/30 translate-x-1'
                       : 'text-warm-300 hover:text-white hover:bg-warm-800/60 dark:hover:bg-darkbg-surface'
                   }`
                 }
               >
                 <Icon className="w-4 h-4 shrink-0" />
                 <span>{link.label}</span>
               </NavLink>
             );
           })}
         </nav>
       </div>

       {/* Footer & User Info */}
       <div className="pt-6 border-t border-warm-800/80 dark:border-darkbg-border space-y-3">
         {/* Jump to College Portal */}
         <a
           href="/"
           target="_blank"
           rel="noreferrer"
           className="flex items-center justify-between px-3 py-2 rounded-xl bg-warm-800/40 hover:bg-warm-800 text-[11px] font-medium text-warm-300 hover:text-white transition-all border border-warm-700/40"
         >
           <span className="flex items-center gap-2">
             <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
             <span>Client College Portal</span>
           </span>
           <span className="text-[9px] bg-brand-500/20 text-brand-300 px-1.5 py-0.5 rounded">Port 5000</span>
         </a>

         {/* Super Admin Info Card */}
         <div className="flex items-center justify-between p-2.5 rounded-xl bg-warm-800/60 dark:bg-darkbg-surface/80 border border-warm-700/30">
           <div className="flex items-center space-x-2.5 min-w-0">
             <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-brand-600 to-amber-500 flex items-center justify-center text-white text-xs font-bold uppercase shrink-0">
               {superAdmin?.name ? superAdmin.name.substring(0, 2) : 'SA'}
             </div>
             <div className="truncate">
               <p className="text-xs font-bold text-white truncate">{superAdmin?.name || 'Master Admin'}</p>
               <p className="text-[10px] text-brand-400 font-mono truncate">{superAdmin?.role || 'MasterSuperAdmin'}</p>
             </div>
           </div>

           <button
             onClick={handleLogout}
             title="Sign Out Super Admin"
             className="p-1.5 rounded-lg text-warm-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
           >
             <LogOut className="w-4 h-4" />
           </button>
         </div>
       </div>
     </div>
   );

   return (
     <>
       {/* Desktop Fixed Sidebar */}
       <aside className="hidden md:block fixed inset-y-0 left-0 w-64 lg:w-72 z-30 shadow-2xl">
         {sidebarContent}
       </aside>

       {/* Mobile Drawer */}
       {mobileOpen && (
         <div className="fixed inset-0 z-50 md:hidden flex">
           <div 
             className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
             onClick={() => setMobileOpen(false)} 
           />
           <div className="relative w-4/5 max-w-xs h-full z-10">
             {sidebarContent}
           </div>
         </div>
       )}
     </>
   );
};

export default SuperAdminSidebar;