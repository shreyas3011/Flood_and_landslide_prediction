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
      <div className="h-full w-full" style={{ display: activeTab === 'map'    ? 'block' : 'none' }}><TabMapExplorer /></div>
      <div className="h-full w-full" style={{ display: activeTab === 'search' ? 'block' : 'none' }}><TabSearchGPS /></div>
      <div className="h-full w-full" style={{ display: activeTab === 'dual'   ? 'block' : 'none' }}><TabDualMaps /></div>
      <div className="h-full w-full" style={{ display: activeTab === 'manual' ? 'block' : 'none' }}><TabManualTest /></div>
      <div className="h-full w-full" style={{ display: activeTab === 'evac'   ? 'block' : 'none' }}><TabEvacuation /></div>
    </AppShell>
  );
}
