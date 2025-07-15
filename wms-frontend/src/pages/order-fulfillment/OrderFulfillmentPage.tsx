import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { OrderListPage } from './OrderListPage';
import { PickingTaskPage } from './PickingTaskPage';
import { PackingStationPage } from './PackingStationPage';

export const OrderFulfillmentPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: '#333' }}>Order Fulfillment</h1>
      
      <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)}>
        <TabPanel header="Order List">
          <OrderListPage />
        </TabPanel>
        <TabPanel header="Picking Tasks">
          <PickingTaskPage />
        </TabPanel>
        <TabPanel header="Packing Station">
          <PackingStationPage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 