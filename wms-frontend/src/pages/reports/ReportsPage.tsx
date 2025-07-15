import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { DashboardOverviewPage } from './DashboardOverviewPage';
import { InventoryReportsPage } from './InventoryReportsPage';
import { OrderReportsPage } from './OrderReportsPage';
import { PerformanceReportsPage } from './PerformanceReportsPage';

export const ReportsPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Reports & Analytics</h1>
      
      <TabView 
        activeIndex={activeIndex} 
        onTabChange={(e) => setActiveIndex(e.index)}
        className="w-full"
      >
        <TabPanel header="Dashboard Overview">
          <DashboardOverviewPage />
        </TabPanel>
        <TabPanel header="Inventory Reports">
          <InventoryReportsPage />
        </TabPanel>
        <TabPanel header="Order Reports">
          <OrderReportsPage />
        </TabPanel>
        <TabPanel header="Performance Reports">
          <PerformanceReportsPage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 