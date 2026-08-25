import React, { useEffect } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-500" />,
    error: <XCircle className="w-5 h-5 text-rose-500" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />
  };

  const bgColors = {
    success: 'bg-emerald-50/90 border-emerald-200/50 dark:bg-emerald-950/40 dark:border-emerald-800/30 text-emerald-800 dark:text-emerald-300',
    error: 'bg-rose-50/90 border-rose-200/50 dark:bg-rose-950/40 dark:border-rose-800/30 text-rose-800 dark:text-rose-300',
    warning: 'bg-amber-50/90 border-amber-200/50 dark:bg-amber-950/40 dark:border-amber-800/30 text-amber-800 dark:text-amber-300',
    info: 'bg-blue-50/90 border-blue-200/50 dark:bg-blue-950/40 dark:border-blue-800/30 text-blue-800 dark:text-blue-300'
  };

  return (
    <div className={`fixed bottom-5 right-5 z-50 flex items-center justify-between space-x-4 p-4 rounded-xl border backdrop-blur-md shadow-xl animate-fade-in ${bgColors[type]}`}>
      <div className="flex items-center space-x-3">
        {icons[type]}
        <span className="text-sm font-semibold">{message}</span>
      </div>
      <button onClick={onClose} className="hover:opacity-75 transition-opacity">
        <X className="w-4 h-4 text-slate-400" />
      </button>
    </div>
  );
};

export default Toast;
