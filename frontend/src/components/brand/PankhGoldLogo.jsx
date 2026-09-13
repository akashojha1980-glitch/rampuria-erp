import React from 'react';
import { BRAND_CONFIG } from '../../config/branding';
import logoImg from '../../assets/logo.png';

export const PankhGoldLogo = ({
  variant = 'horizontal', // 'icon' | 'horizontal' | 'badge' | 'compact'
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  className = '',
  showTagline = true
}) => {
  const sizeMap = {
    xs: { icon: 'w-6 h-6', text: 'text-xs', sub: 'text-[8px]' },
    sm: { icon: 'w-8 h-8', text: 'text-sm', sub: 'text-[9px]' },
    md: { icon: 'w-10 h-10', text: 'text-base', sub: 'text-[10px]' },
    lg: { icon: 'w-14 h-14', text: 'text-xl', sub: 'text-xs' },
    xl: { icon: 'w-20 h-20', text: 'text-2xl', sub: 'text-sm' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // Actual Pankh Gold Logo Image Component
  const WingEmblem = () => (
    <div className={`relative flex-shrink-0 ${currentSize.icon} transition-transform duration-300 hover:scale-105`}>
      <img
        src={logoImg}
        alt="Pankh Gold Logo"
        className="w-full h-full object-contain filter drop-shadow-md"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = '/logo.png';
        }}
      />
    </div>
  );

  if (variant === 'icon') {
    return <WingEmblem />;
  }

  if (variant === 'badge') {
    return (
      <div className={`inline-flex items-center gap-3 px-4 py-2 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-amber-500/30 shadow-lg ${className}`}>
        <WingEmblem />
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase text-sm">
              PANKH GOLD
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
              CMS
            </span>
          </div>
          <p className="text-[9px] text-slate-400 font-medium tracking-wide uppercase">
            College Management System
          </p>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <WingEmblem />
        <div className="min-w-0">
          <div className="flex items-center gap-1 leading-none">
            <span className="font-serif font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-400 to-amber-500 text-sm">
              PANKH GOLD
            </span>
            <span className="text-[9px] font-mono font-bold text-amber-400">CMS</span>
          </div>
          <span className="text-[8px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest block mt-0.5">
            Enterprise ERP
          </span>
        </div>
      </div>
    );
  }

  // Default: 'horizontal' Full Lockup
  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      <WingEmblem />
      <div>
        <div className="flex items-center gap-2">
          <span className={`font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase ${currentSize.text}`}>
            PANKH GOLD
          </span>
          <span className="text-[10px] font-mono font-extrabold px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-400 border border-amber-500/40 shadow-sm">
            CMS
          </span>
        </div>
        <p className={`font-sans font-semibold tracking-wide text-slate-600 dark:text-slate-300 uppercase ${currentSize.sub}`}>
          College Management System
        </p>
        {showTagline && (
          <p className="text-[9px] text-amber-500/90 dark:text-amber-400/80 font-medium tracking-normal mt-0.5 hidden sm:block">
            {BRAND_CONFIG.tagline}
          </p>
        )}
      </div>
    </div>
  );
};

export default PankhGoldLogo;
