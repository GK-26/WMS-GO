import React, { useState } from 'react';
import { TabView, TabPanel } from 'primereact/tabview';
import { WorkflowRulesPage } from './WorkflowRulesPage';
import { TriggersEventsPage } from './TriggersEventsPage';
import { IntegrationsPage } from './IntegrationsPage';
import { SystemStatusPage } from './SystemStatusPage';

export const AutomationPage: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-6">Automation</h1>
      <TabView
        activeIndex={activeIndex}
        onTabChange={(e) => setActiveIndex(e.index)}
        className="w-full"
      >
        <TabPanel header="Workflow Rules">
          <WorkflowRulesPage />
        </TabPanel>
        <TabPanel header="Triggers & Events">
          <TriggersEventsPage />
        </TabPanel>
        <TabPanel header="Integrations">
          <IntegrationsPage />
        </TabPanel>
        <TabPanel header="System Status">
          <SystemStatusPage />
        </TabPanel>
      </TabView>
    </div>
  );
}; 