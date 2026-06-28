import React from 'react';
import TopNav from './TopNav';
import { Map, Search, Crosshair, SlidersHorizontal, Hospital } from 'lucide-react';

const TABS = [
  { id: 'map',       label: 'Map Explorer', icon: Map },
  { id: 'search',    label: 'Search & GPS', icon: Search },
  { id: 'dual',      label: 'Dual Maps',    icon: Crosshair },
  { id: 'manual',    label: 'Manual Test',  icon: SlidersHorizontal },
  { id: 'evac',      label: 'Evacuation',   icon: Hospital },
];

export default function AppShell({ activeTab, setActiveTab, children }) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-blue-500/30 flex flex-col">
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-900/10 blur-[120px]" />
      </div>
      
      <TopNav activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
      
      {/* Desktop: fixed full-height; Mobile: scrollable with bottom padding for fixed nav */}
      <main className="relative z-10 w-full max-w-[1600px] mx-auto px-3 sm:px-4 md:px-6 py-3 md:py-4
        md:h-[calc(100vh-64px)] md:overflow-hidden
        flex-1 flex flex-col overflow-y-auto
        pb-20 md:pb-4">
        {children}
      </main>
    </div>
  );
}
