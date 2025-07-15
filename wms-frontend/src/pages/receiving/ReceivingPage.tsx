import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { ASNListPage } from './ASNListPage';
import { ReceiveShipmentPage } from './ReceiveShipmentPage';
import { QualityCheckPage } from './QualityCheckPage';

export const ReceivingPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Receiving</h1>
      
      <TabView 
        activeIndex={activeIndex} 
        onTabChange={(e) => setActiveIndex(e.index)}
        className="w-full"
      >
        <TabPanel header="ASN List">
          <ASNListPage />
        </TabPanel>
        <TabPanel header="Receive Shipment">
          <ReceiveShipmentPage />
        </TabPanel>
        <TabPanel header="Quality Check">
          <QualityCheckPage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 