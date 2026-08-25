import React from 'react';

const Loading = ({ size = 'md', text = 'Loading details...', fullScreen = false }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-3',
    lg: 'w-16 h-16 border-4'
  };

  const spinner = (
    <div class="flex flex-col items-center justify-center space-y-3">
      <div class="relative">
        {/* Outer glowing ring */}
        <div class={`animate-spin rounded-full border-t-brand-glow border-r-transparent border-b-transparent border-l-transparent ${sizeClasses[size]}`}></div>
        {/* Inner static base ring */}
        <div class={`absolute inset-0 rounded-full border-slate-200/20 dark:border-slate-800/40 -z-10 ${sizeClasses[size]}`}></div>
      </div>
      {text && (
        <span class="text-sm font-medium text-slate-500 dark:text-slate-400 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div class="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center">
        <div class="glass-panel p-8 max-w-xs flex flex-col items-center">
          {spinner}
        </div>
      </div>
    );
  }

  return <div class="flex items-center justify-center p-6 w-full">{spinner}</div>;
};

export default Loading;
