import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../utils/translations';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  // Read persisted theme or default to dark
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('geoshield-theme');
    return saved === 'light' ? 'light' : 'dark';
  });

  // Read persisted language or default to English
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('geoshield-lang');
    return ['en', 'hi', 'mr'].includes(saved) ? saved : 'en';
  });

  // Effect to update DOM classes on change
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
      body.classList.add('light-theme');
      body.classList.remove('dark-theme');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
      body.classList.remove('light-theme');
      body.classList.add('dark-theme');
    }
    localStorage.setItem('geoshield-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('geoshield-lang', language);
  }, [language]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Translation helper function
  const t = (key) => {
    const langDict = translations[language] || translations['en'];
    return langDict[key] || translations['en'][key] || key;
  };

  return (
    <SettingsContext.Provider value={{ theme, toggleTheme, language, setLanguage, t }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
