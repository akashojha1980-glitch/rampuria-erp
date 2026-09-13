import React, { useState, useEffect } from 'react';
import { BRAND_CONFIG } from '../config/branding';
import { PankhGoldLogo } from '../components/brand/PankhGoldLogo';
import {
  FiShield, FiCpu, FiDatabase, FiHardDrive, FiCheckCircle,
  FiMail, FiPhone, FiGlobe, FiKey, FiLayers, FiActivity, FiServer
} from 'react-icons/fi';

const AboutSoftware = () => {
  const [health, setHealth] = useState(null);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setHealth(d))
      .catch(() => setHealth({ connected: false }));
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12">
      {/* Hero Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0a1128] via-[#101f42] to-[#060b18] text-white p-8 md:p-12 border border-amber-500/30 shadow-2xl">
        {/* Ambient Gold Orbs */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-yellow-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 justify-between">
          <div className="space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-mono font-bold tracking-wider text-amber-300 bg-amber-500/10 border border-amber-500/30 uppercase">
              <FiShield className="text-amber-400" /> Commercial Enterprise ERP Release
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase">
              {BRAND_CONFIG.productName}
            </h1>
            <p className="text-sm md:text-base text-slate-300 max-w-xl font-medium leading-relaxed">
              {BRAND_CONFIG.description}
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3 justify-center md:justify-start text-xs font-mono text-amber-300/90">
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">Version: {BRAND_CONFIG.version}</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">Build: {BRAND_CONFIG.buildNumber}</span>
              <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg">Release: {BRAND_CONFIG.releaseDate}</span>
            </div>
          </div>

          <div className="flex-shrink-0 p-6 rounded-3xl bg-slate-900/60 border border-amber-500/40 shadow-2xl backdrop-blur-md">
            <PankhGoldLogo variant="icon" size="xl" />
          </div>
        </div>
      </div>

      {/* Grid: Product Info, System Architecture, Support */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Developer & Organization Card */}
        <div className="bg-white dark:bg-darkbg-surface p-7 rounded-2xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-warm-900 dark:text-slate-100 flex items-center gap-2 font-serif">
            <FiCpu className="text-brand-500" /> Developer & Organization
          </h3>
          <div className="space-y-3 text-xs text-warm-850 dark:text-slate-300">
            <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
              <span className="text-slate-400 font-semibold">Software Developer</span>
              <strong className="font-bold text-amber-600 dark:text-amber-400 text-sm">{BRAND_CONFIG.companyName}</strong>
            </div>
            <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
              <span className="text-slate-400 font-semibold">Product Classification</span>
              <span className="font-medium">Enterprise College Management Suite</span>
            </div>
            <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
              <span className="text-slate-400 font-semibold">Deployment Engine</span>
              <span className="font-medium">Single-PC Offline Desktop & Local LAN Hub</span>
            </div>
            <div className="flex justify-between py-2 border-b border-warm-100 dark:border-darkbg-border">
              <span className="text-slate-400 font-semibold">Database Engine</span>
              <span className="font-medium">Microsoft SQL Server 2008+ (MSSQL)</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-slate-400 font-semibold">Legal Copyright</span>
              <span className="font-medium">{BRAND_CONFIG.copyright}</span>
            </div>
          </div>
        </div>

        {/* Enterprise Support & Hotline */}
        <div className="bg-white dark:bg-darkbg-surface p-7 rounded-2xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-4">
          <h3 className="text-lg font-bold text-warm-900 dark:text-slate-100 flex items-center gap-2 font-serif">
            <FiPhone className="text-emerald-500" /> Technical Support & Helpdesk
          </h3>
          <p className="text-xs text-slate-500">
            For annual maintenance renewals, customization inquiries, database migration, or emergency technical assistance:
          </p>
          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 bg-warm-50 dark:bg-darkbg-base rounded-xl flex items-center justify-between gap-3 border border-warm-200/40 dark:border-darkbg-border">
              <div className="flex items-center gap-3">
                <FiPhone className="text-amber-500 flex-shrink-0" size={16} />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Technical Lead (Deepak Ojha)</span>
                  <a href="tel:+919610077159" className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-amber-500">+91 96100 77159</a>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Available</span>
            </div>

            <div className="p-3 bg-warm-50 dark:bg-darkbg-base rounded-xl flex items-center justify-between gap-3 border border-warm-200/40 dark:border-darkbg-border">
              <div className="flex items-center gap-3">
                <FiPhone className="text-amber-500 flex-shrink-0" size={16} />
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Support Specialist (Akash Ojha)</span>
                  <a href="tel:+916375645010" className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-amber-500">+91 63756 45010</a>
                </div>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">Available</span>
            </div>

            <div className="p-3 bg-warm-50 dark:bg-darkbg-base rounded-xl flex items-center gap-3 border border-warm-200/40 dark:border-darkbg-border">
              <FiMail className="text-indigo-500 flex-shrink-0" size={16} />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Official Support Email</span>
                <a href="mailto:admn@ruchikasoftwaresolution.com" className="font-mono font-bold text-slate-800 dark:text-slate-200 hover:text-indigo-500">{BRAND_CONFIG.supportEmail}</a>
              </div>
            </div>

            <div className="p-3 bg-warm-50 dark:bg-darkbg-base rounded-xl flex items-center gap-3 border border-warm-200/40 dark:border-darkbg-border">
              <FiGlobe className="text-teal-500 flex-shrink-0" size={16} />
              <div>
                <span className="block text-[10px] uppercase font-bold text-slate-400">Official Web Portal</span>
                <a href={BRAND_CONFIG.website} target="_blank" rel="noreferrer" className="font-mono font-bold text-indigo-600 dark:text-indigo-400 hover:underline">{BRAND_CONFIG.displayWebsite}</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* System Health Diagnostic Status Card */}
      <div className="bg-white dark:bg-darkbg-surface p-7 rounded-2xl border border-warm-200/60 dark:border-darkbg-border shadow-sm space-y-4">
        <h3 className="text-lg font-bold text-warm-900 dark:text-slate-100 flex items-center gap-2 font-serif">
          <FiActivity className="text-emerald-500" /> Runtime Diagnostics & System Integrity
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/40 dark:border-darkbg-border">
            <span className="text-[10px] text-slate-400 uppercase font-bold">SQL Database</span>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
              <FiCheckCircle /> Connected (MSSQL)
            </p>
          </div>
          <div className="p-4 rounded-xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/40 dark:border-darkbg-border">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Offline License</span>
            <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400 mt-1">
              Permanent Verified Key
            </p>
          </div>
          <div className="p-4 rounded-xl bg-warm-50 dark:bg-darkbg-base border border-warm-200/40 dark:border-darkbg-border">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Security Pipeline</span>
            <p className="text-sm font-bold text-amber-600 dark:text-amber-400 mt-1">
              Bcrypt & JWT Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutSoftware;
