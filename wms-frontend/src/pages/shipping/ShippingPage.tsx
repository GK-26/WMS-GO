import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ShipmentListPage } from './ShipmentListPage';
import { CreateShipmentPage } from './CreateShipmentPage';
import { CarrierManagementPage } from './CarrierManagementPage';

export const ShippingPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Shipping</h1>
      
      <TabView 
        activeIndex={activeIndex} 
        onTabChange={(e) => setActiveIndex(e.index)}
        className="w-full"
      >
        <TabPanel header="Shipment List">
          <ShipmentListPage />
        </TabPanel>
        <TabPanel header="Create Shipment">
          <CreateShipmentPage />
        </TabPanel>
        <TabPanel header="Carrier Management">
          <CarrierManagementPage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 