import React from 'react';
import { ShieldCheck } from 'lucide-react';

export default function TopNav({ activeTab, setActiveTab, tabs }) {
  return (
    <div className="w-full glass border-b border-white/10 sticky top-0 z-[1000]">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-emerald-400 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <ShieldCheck size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-300">
              Geo Shield
            </h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
              AI Flood &amp; Landslide Defense
            </p>
          </div>
        </div>
        
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
      
      {/* Mobile nav (scrollable) */}
      <div className="md:hidden flex overflow-x-auto p-2 gap-2 hide-scrollbar border-t border-white/5 bg-slate-900/50">
        {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap ${
                  isActive 
                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/20' 
                    : 'text-slate-400'
                }`}
              >
                <Icon size={14} />
                {tab.label}
              </button>
            );
        })}
      </div>
    </div>
  );
}
