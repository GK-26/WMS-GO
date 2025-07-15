import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { WorkerManagementPage } from './WorkerManagementPage';
import { ShiftSchedulingPage } from './ShiftSchedulingPage';
import { PerformancePage } from './PerformancePage';

export const LaborManagementPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Labor Management</h1>
      
      <TabView 
        activeIndex={activeIndex} 
        onTabChange={(e) => setActiveIndex(e.index)}
        className="w-full"
      >
        <TabPanel header="Worker Management">
          <WorkerManagementPage />
        </TabPanel>
        <TabPanel header="Shift Scheduling">
          <ShiftSchedulingPage />
        </TabPanel>
        <TabPanel header="Performance">
          <PerformancePage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 