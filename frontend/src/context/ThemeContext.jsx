import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const themes = [
  {
    id: 'default',
    name: 'Classic Taupe',
    colors: {
      brand50: '#F7F5F0',
      brand500: '#8C7A6B',
      brand600: '#6E5D50',
      brand700: '#524337',
    }
  },
  {
    id: 'crimson_ruby',
    name: 'Crimson Ruby',
    colors: {
      brand50: '#FFF5F5',
      brand500: '#A81C2E',
      brand600: '#85101E',
      brand700: '#630B14',
    }
  },
  {
    id: 'royal_emerald',
    name: 'Royal Emerald',
    colors: {
      brand50: '#F4FAF6',
      brand500: '#15803D',
      brand600: '#166534',
      brand700: '#14532D',
    }
  },
  {
    id: 'sapphire_blue',
    name: 'Sapphire Blue',
    colors: {
      brand50: '#F0F7FF',
      brand500: '#1D4ED8',
      brand600: '#1E40AF',
      brand700: '#1E3A8A',
    }
  },
  {
    id: 'imperial_amber',
    name: 'Imperial Amber',
    colors: {
      brand50: '#FFFBEB',
      brand500: '#B45309',
      brand600: '#92400E',
      brand700: '#78350F',
    }
  },
  {
    id: 'amethyst_purple',
    name: 'Amethyst Purple',
    colors: {
      brand50: '#FAF5FF',
      brand500: '#7E22CE',
      brand600: '#6B21A8',
      brand700: '#581C87',
    }
  },
  {
    id: 'teal_forest',
    name: 'Teal Forest',
    colors: {
      brand50: '#F0FDFD',
      brand500: '#0F766E',
      brand600: '#115E59',
      brand700: '#134E4A',
    }
  },
  {
    id: 'rose_quartz',
    name: 'Rose Quartz',
    colors: {
      brand50: '#FFF5F7',
      brand500: '#BE185D',
      brand600: '#9D174D',
      brand700: '#831843',
    }
  },
  {
    id: 'slate_charcoal',
    name: 'Slate Charcoal',
    colors: {
      brand50: '#F8FAFC',
      brand500: '#475569',
      brand600: '#334155',
      brand700: '#1E293B',
    }
  },
  {
    id: 'midnight_navy',
    name: 'Midnight Navy',
    colors: {
      brand50: '#F0F4F8',
      brand500: '#0F172A',
      brand600: '#1E293B',
      brand700: '#0F172A',
    }
  }
];

export const ThemeProvider = ({ children }) => {
  const [darkMode, setDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme ? savedTheme === 'dark' : true; 
  });

  const [currentTheme, setAccentTheme] = useState(() => {
    return localStorage.getItem('accent-theme') || 'rose_quartz';
  });

  // Handle dark mode toggle
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (darkMode) {
      root.classList.add('dark');
      body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Handle accent theme color application
  useEffect(() => {
    const root = document.documentElement;
    const selected = themes.find((t) => t.id === currentTheme) || themes[0];
    
    root.style.setProperty('--color-brand-50', selected.colors.brand50);
    root.style.setProperty('--color-brand-500', selected.colors.brand500);
    root.style.setProperty('--color-brand-600', selected.colors.brand600);
    root.style.setProperty('--color-brand-700', selected.colors.brand700);
    
    localStorage.setItem('accent-theme', currentTheme);
  }, [currentTheme]);

  const toggleTheme = () => setDarkMode(!darkMode);

  return (
    <ThemeContext.Provider value={{ darkMode, toggleTheme, currentTheme, setAccentTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
