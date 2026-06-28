import React, { useEffect, useRef, useState } from 'react';
import { ShieldCheck, Sun, Moon, Globe, ChevronDown } from 'lucide-react';
import { useSettings } from '../../context/SettingsContext';

export default function TopNav({ activeTab, setActiveTab, tabs }) {
  const { theme, toggleTheme, language, setLanguage, t } = useSettings();
  const [langOpen, setLangOpen] = useState(false);
  const activeTabRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll the active bottom tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिन्दी' },
    { code: 'mr', label: 'मराठी' }
  ];

  const currentLangLabel = languages.find(l => l.code === language)?.label || 'English';

  return (
    <>
      {/* ── Top bar (logo + desktop nav) ── */}
      <div className="w-full glass border-b border-slate-200/10 dark:border-white/5 sticky top-0 z-[1000] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-500 flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-emerald-500 dark:from-blue-400 dark:to-emerald-300">
                Geo Shield
              </h1>
              {/* Hide subtitle on very small screens */}
              <p className="hidden sm:block text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-widest font-semibold">
                AI Flood &amp; Landslide Defense
              </p>
            </div>
          </div>

          {/* Right side navigation & settings controls */}
          <div className="flex items-center gap-4">
            {/* Desktop tab nav — hidden on mobile */}
            <nav className="hidden md:flex items-center gap-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                // Get dynamic localized label
                const label = t(tab.id === 'map' ? 'mapExplorer' : tab.id === 'search' ? 'searchGps' : tab.id === 'dual' ? 'dualMaps' : tab.id === 'manual' ? 'manualTest' : 'evacuation');
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    <Icon size={15} className={isActive ? 'text-blue-500' : 'text-slate-500'} />
                    {label}
                  </button>
                );
              })}
            </nav>

            <div className="h-6 w-px bg-slate-300/30 dark:bg-slate-700/50 hidden md:block" />

            {/* Language & Theme Controls */}
            <div className="flex items-center gap-2">
              {/* Language Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/50 transition-colors"
                >
                  <Globe size={13} className="text-slate-500" />
                  <span>{currentLangLabel}</span>
                  <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
                </button>

                {langOpen && (
                  <div className="absolute right-0 mt-1.5 w-32 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl z-[1010] py-1 animate-in fade-in slide-in-from-top-1 duration-100">
                    {languages.map(lang => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setLangOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ${
                          language === lang.code ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/50 dark:bg-blue-950/20' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {lang.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                title={theme === 'dark' ? t('themeLight') : t('themeDark')}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-700 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 border border-slate-300/30 dark:border-slate-700/50 transition-colors shrink-0"
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile bottom tab bar — fixed at bottom, thumb-friendly ── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-[1000] glass border-t border-slate-200/10 dark:border-white/5"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            // Localized mobile label
            const label = t(tab.id === 'map' ? 'mapExplorer' : tab.id === 'search' ? 'searchGps' : tab.id === 'dual' ? 'dualMaps' : tab.id === 'manual' ? 'manualTest' : 'evacuation');
            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 px-1 py-2 transition-all duration-200 relative ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                {/* Active indicator bar at top */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                )}
                <Icon size={19} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[9px] font-bold leading-none truncate max-w-full px-0.5">
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
