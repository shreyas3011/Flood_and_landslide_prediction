import React, { useState } from 'react';
import AppShell from './components/layout/AppShell';
import TabMapExplorer from './components/tabs/TabMapExplorer';
import TabSearchGPS from './components/tabs/TabSearchGPS';
import TabDualMaps from './components/tabs/TabDualMaps';
import TabManualTest from './components/tabs/TabManualTest';
import TabEvacuation from './components/tabs/TabEvacuation';

export default function App() {
  const [activeTab, setActiveTab] = useState('map');

  return (
    <AppShell activeTab={activeTab} setActiveTab={setActiveTab}>
      {/* All tabs are always mounted to preserve state (predictions, map, inputs).
          Only the active tab is visible — inactive tabs are hidden via CSS. */}
      <div className="flex-1 flex flex-col h-full w-full" style={{ display: activeTab === 'map'    ? 'flex' : 'none' }}><TabMapExplorer /></div>
      <div className="flex-1 flex flex-col h-full w-full" style={{ display: activeTab === 'search' ? 'flex' : 'none' }}><TabSearchGPS /></div>
      <div className="flex-1 flex flex-col h-full w-full" style={{ display: activeTab === 'dual'   ? 'flex' : 'none' }}><TabDualMaps /></div>
      <div className="flex-1 flex flex-col h-full w-full" style={{ display: activeTab === 'manual' ? 'flex' : 'none' }}><TabManualTest /></div>
      <div className="flex-1 flex flex-col h-full w-full" style={{ display: activeTab === 'evac'   ? 'flex' : 'none' }}><TabEvacuation /></div>
    </AppShell>
  );
}
