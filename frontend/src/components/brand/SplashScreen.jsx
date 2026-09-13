import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BRAND_CONFIG } from '../../config/branding';
import { PankhGoldLogo } from './PankhGoldLogo';

export const SplashScreen = ({ onFinish = () => {}, minDuration = 2400 }) => {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(10);

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 98) {
          clearInterval(progressTimer);
          return 100;
        }
        return prev + Math.floor(Math.random() * 22) + 8;
      });
    }, 180);

    const finishTimer = setTimeout(() => {
      setVisible(false);
      setTimeout(onFinish, 600); // Allow exit animation to complete
    }, minDuration);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(finishTimer);
    };
  }, [minDuration, onFinish]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 bg-gradient-to-b from-[#060b18] via-[#0b1329] to-[#040813] text-white select-none overflow-hidden"
        >
          {/* Subtle Ambient Gold Particle Orbs */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none" />
          <div className="absolute bottom-10 right-10 w-72 h-72 rounded-full bg-yellow-600/5 blur-[90px] pointer-events-none" />

          {/* Top subtle edition label */}
          <div className="text-center pt-4">
            <span className="text-[10px] font-mono tracking-widest text-amber-400/70 uppercase border border-amber-500/20 px-3 py-1 rounded-full bg-amber-500/5">
              {BRAND_CONFIG.edition}
            </span>
          </div>

          {/* Center Brand Hero */}
          <div className="flex flex-col items-center justify-center text-center space-y-6 max-w-md my-auto">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative"
            >
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-b from-slate-800 to-slate-900/90 border border-amber-500/40 p-4 flex items-center justify-center shadow-2xl shadow-amber-500/20">
                <PankhGoldLogo variant="icon" size="xl" />
              </div>
            </motion.div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-2"
            >
              <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-500 uppercase">
                {BRAND_CONFIG.productName}
              </h1>
              <p className="text-xs sm:text-sm font-medium text-slate-300 tracking-wide">
                {BRAND_CONFIG.tagline}
              </p>
            </motion.div>

            {/* Loading progress bar */}
            <div className="w-64 sm:w-72 space-y-2 pt-4">
              <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-amber-500/20 p-0.5">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500 rounded-full shadow-lg shadow-amber-400/50"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                  transition={{ ease: "easeOut" }}
                />
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
                <span>Initializing Core Engine...</span>
                <span className="text-amber-400 font-bold">{Math.min(progress, 100)}%</span>
              </div>
            </div>
          </div>

          {/* Footer information */}
          <div className="text-center space-y-1 pb-2">
            <p className="text-[11px] font-semibold text-slate-400">
              Developed by <strong className="text-amber-400 font-bold">{BRAND_CONFIG.companyName}</strong>
            </p>
            <p className="text-[9px] text-slate-500 font-mono">
              {BRAND_CONFIG.version} • Build {BRAND_CONFIG.buildNumber} • {BRAND_CONFIG.copyright}
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SplashScreen;
