import React, { useEffect, useRef } from 'react';
import { ShieldCheck } from 'lucide-react';

export default function TopNav({ activeTab, setActiveTab, tabs }) {
  const activeTabRef = useRef(null);

  // Auto-scroll the active bottom tab into view on mobile
  useEffect(() => {
    if (activeTabRef.current) {
      activeTabRef.current.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  }, [activeTab]);

  return (
    <>
      {/* ── Top bar (logo + desktop nav) ── */}
      <div className="w-full glass border-b border-white/10 sticky top-0 z-[1000]">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/30 shrink-0">
              <ShieldCheck size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-300">
                Geo Shield
              </h1>
              {/* Hide subtitle on very small screens */}
              <p className="hidden sm:block text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                AI Flood &amp; Landslide Defense
              </p>
            </div>
          </div>

          {/* Desktop tab nav — hidden on mobile */}
          <nav className="hidden md:flex items-center gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20 shadow-inner'
                      : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-blue-400' : 'text-slate-500'} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* ── Mobile bottom tab bar — fixed at bottom, thumb-friendly ── */}
      <div
        className="md:hidden fixed bottom-0 inset-x-0 z-[1000] glass border-t border-white/10"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="flex items-stretch h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                ref={isActive ? activeTabRef : null}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center gap-1 px-1 py-2 transition-all duration-200 relative ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-500 active:text-slate-300'
                }`}
              >
                {/* Active indicator bar at top */}
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-blue-400" />
                )}
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className="text-[10px] font-semibold leading-none truncate max-w-full px-0.5">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
