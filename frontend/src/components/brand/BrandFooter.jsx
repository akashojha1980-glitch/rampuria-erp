import React from 'react';
import { Link } from 'react-router-dom';
import { BRAND_CONFIG } from '../../config/branding';
import { PankhGoldLogo } from './PankhGoldLogo';

export const BrandFooter = ({ className = '' }) => {
  return (
    <footer className={`py-4 px-6 border-t border-warm-200/50 dark:border-darkbg-border text-xs text-slate-500 dark:text-slate-400 no-print flex flex-col sm:flex-row items-center justify-between gap-2.5 ${className}`}>
      <div className="flex items-center gap-2">
        <PankhGoldLogo variant="icon" size="xs" />
        <span>
          Powered by <strong className="text-amber-600 dark:text-amber-400 font-bold">{BRAND_CONFIG.companyName}</strong>
        </span>
      </div>

      <div className="flex items-center gap-3 text-[11px] font-mono">
        <span className="hidden md:inline text-slate-400">
          {BRAND_CONFIG.productName} ({BRAND_CONFIG.shortName})
        </span>
        <span className="px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800">
          {BRAND_CONFIG.version}
        </span>
        <Link
          to="/about"
          className="text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
        >
          About Software
        </Link>
      </div>
    </footer>
  );
};

export default BrandFooter;
