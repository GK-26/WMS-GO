import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { UserManagementPage } from './UserManagementPage';
import { RolesPermissionsPage } from './RolesPermissionsPage';
import { SystemSettingsPage } from './SystemSettingsPage';
import { WarehouseSettingsPage } from './WarehouseSettingsPage';

export const ConfigurationPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Configuration</h1>
      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
        className="w-full"
      >
        <TabPanel header="User Management">
          <UserManagementPage />
        </TabPanel>
        <TabPanel header="Roles & Permissions">
          <RolesPermissionsPage />
        </TabPanel>
        <TabPanel header="System Settings">
          <SystemSettingsPage />
        </TabPanel>
        <TabPanel header="Warehouse Settings">
          <WarehouseSettingsPage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 