import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { StockOverviewPage } from './StockOverviewPage';
import { CycleCountingPage } from './CycleCountingPage';
import { ProductDetailsPage } from './ProductDetailsPage';

export const InventoryPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="page-container">
      <div className="page-header">
        <h1>Inventory Management</h1>
        <p className="text-muted">Manage your warehouse inventory, stock levels, and product information</p>
      </div>
      
      <div className="dashboard-card">
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
          <TabPanel header="Stock Overview">
            <StockOverviewPage />
          </TabPanel>
          <TabPanel header="Cycle Counting">
            <CycleCountingPage />
          </TabPanel>
          <TabPanel header="Product Details">
            <ProductDetailsPage />
          </TabPanel>
        </TabView>
      </div>
    </div>
  );
}; 