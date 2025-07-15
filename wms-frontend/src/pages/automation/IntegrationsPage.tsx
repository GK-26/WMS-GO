import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { ProgressBar } from 'primereact/progressbar';

interface Integration {
  id: string;
  name: string;
  type: 'erp' | 'tms' | 'oms' | 'api' | 'database' | 'file';
  provider: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync: Date;
  syncFrequency: string;
  dataVolume: number;
  successRate: number;
  description: string;
}

export const IntegrationsPage: React.FC = () => {
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const integrations: Integration[] = [
    {
      id: '1',
      name: 'SAP ERP Connection',
      type: 'erp',
      provider: 'SAP',
      status: 'connected',
      lastSync: new Date('2024-01-15T14:30:00'),
      syncFrequency: 'Real-time',
      dataVolume: 1250,
      successRate: 99.8,
      description: 'Primary ERP integration for order and inventory data'
    },
    {
      id: '2',
      name: 'FedEx Shipping API',
      type: 'api',
      provider: 'FedEx',
      status: 'connected',
      lastSync: new Date('2024-01-15T15:45:00'),
      syncFrequency: 'On-demand',
      dataVolume: 89,
      successRate: 98.5,
      description: 'Shipping rate calculation and label generation'
    },
    {
      id: '3',
      name: 'UPS Tracking API',
      type: 'api',
      provider: 'UPS',
      status: 'connected',
      lastSync: new Date('2024-01-15T16:20:00'),
      syncFrequency: 'Every 15 minutes',
      dataVolume: 156,
      successRate: 97.2,
      description: 'Real-time shipment tracking and status updates'
    },
    {
      id: '4',
      name: 'Oracle Transportation Management',
      type: 'tms',
      provider: 'Oracle',
      status: 'error',
      lastSync: new Date('2024-01-15T12:15:00'),
      syncFrequency: 'Hourly',
      dataVolume: 234,
      successRate: 85.3,
      description: 'Transportation planning and route optimization'
    },
    {
      id: '5',
      name: 'Shopify Order Management',
      type: 'oms',
      provider: 'Shopify',
      status: 'connected',
      lastSync: new Date('2024-01-15T17:00:00'),
      syncFrequency: 'Real-time',
      dataVolume: 445,
      successRate: 99.1,
      description: 'E-commerce order processing and fulfillment'
    },
    {
      id: '6',
      name: 'Legacy Database Sync',
      type: 'database',
      provider: 'Internal',
      status: 'pending',
      lastSync: new Date('2024-01-15T10:00:00'),
      syncFrequency: 'Daily',
      dataVolume: 567,
      successRate: 92.7,
      description: 'Legacy system data synchronization'
    }
  ];

  const statusBodyTemplate = (rowData: Integration) => {
    const severity = rowData.status === 'connected' ? 'success' : 
                    rowData.status === 'disconnected' ? 'danger' : 
                    rowData.status === 'error' ? 'danger' : 'warning';
    return <Tag value={rowData.status.toUpperCase()} severity={severity} />;
  };

  const typeBodyTemplate = (rowData: Integration) => {
    const severity = rowData.type === 'erp' ? 'info' : 
                    rowData.type === 'tms' ? 'warning' : 
                    rowData.type === 'oms' ? 'success' : 
                    rowData.type === 'api' ? 'info' : 'secondary';
    return <Tag value={rowData.type.toUpperCase()} severity={severity} />;
  };

  const dateBodyTemplate = (rowData: Integration) => {
    return rowData.lastSync.toLocaleDateString() + ' ' + rowData.lastSync.toLocaleTimeString();
  };

  const successRateBodyTemplate = (rowData: Integration) => {
    return (
      <div className="flex align-items-center">
        <span className="mr-2">{rowData.successRate}%</span>
        <ProgressBar value={rowData.successRate} style={{ height: '8px', width: '100px' }} />
      </div>
    );
  };

  const dataVolumeBodyTemplate = (rowData: Integration) => {
    return `${rowData.dataVolume} records`;
  };

  const actionsBodyTemplate = (rowData: Integration) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-eye" 
          size="small" 
          severity="secondary"
          tooltip="View Details"
          onClick={() => {
            setSelectedIntegration(rowData);
            setDialogVisible(true);
          }}
        />
        <Button 
          icon="pi pi-pencil" 
          size="small" 
          severity="info"
          tooltip="Edit Configuration"
        />
        <Button 
          icon="pi pi-refresh" 
          size="small" 
          severity="success"
          tooltip="Sync Now"
        />
        <Button 
          icon="pi pi-power-off" 
          size="small" 
          severity={rowData.status === 'connected' ? 'danger' : 'success'}
          tooltip={rowData.status === 'connected' ? 'Disconnect' : 'Connect'}
        />
      </div>
    );
  };

  const header = (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">System Integrations</h2>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            placeholder="Search integrations..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </span>
        <Button 
          label="Add Integration" 
          icon="pi pi-plus" 
          severity="success"
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">4</div>
          <div className="text-sm text-gray-600">Connected Integrations</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-red-600">1</div>
          <div className="text-sm text-gray-600">Failed Integrations</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-blue-600">2,731</div>
          <div className="text-sm text-gray-600">Total Records Synced Today</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">95.4%</div>
          <div className="text-sm text-gray-600">Average Success Rate</div>
        </Card>
      </div>

      {/* Integrations Table */}
      <Card>
        <DataTable 
          value={integrations} 
          paginator 
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          stripedRows
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No integrations found."
        >
          <Column field="name" header="Integration Name" sortable />
          <Column field="type" header="Type" body={typeBodyTemplate} sortable />
          <Column field="provider" header="Provider" sortable />
          <Column field="status" header="Status" body={statusBodyTemplate} sortable />
          <Column field="description" header="Description" style={{ maxWidth: '200px' }} />
          <Column 
            field="lastSync" 
            header="Last Sync" 
            body={dateBodyTemplate} 
            sortable 
          />
          <Column field="syncFrequency" header="Sync Frequency" sortable />
          <Column field="dataVolume" header="Data Volume" body={dataVolumeBodyTemplate} sortable />
          <Column field="successRate" header="Success Rate" body={successRateBodyTemplate} sortable />
          <Column header="Actions" body={actionsBodyTemplate} style={{ width: '160px' }} />
        </DataTable>
      </Card>

      {/* Integration Health Monitor */}
      <Card title="Integration Health Monitor">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {integrations.map((integration) => (
            <div key={integration.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-sm">{integration.name}</h3>
                <Tag 
                  value={integration.status} 
                  severity={integration.status === 'connected' ? 'success' : 
                           integration.status === 'error' ? 'danger' : 'warning'}
                />
              </div>
              <p className="text-xs text-gray-600 mb-2">{integration.provider}</p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>Success Rate:</span>
                  <span>{integration.successRate}%</span>
                </div>
                                 <ProgressBar 
                   value={integration.successRate} 
                   style={{ height: '4px' }}
                 />
                <div className="flex justify-between text-xs">
                  <span>Last Sync:</span>
                  <span>{integration.lastSync.toLocaleTimeString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Detail Dialog */}
      <Dialog 
        visible={dialogVisible} 
        onHide={() => setDialogVisible(false)}
        header="Integration Details"
        style={{ width: '700px' }}
        modal
      >
        {selectedIntegration && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Integration Name</label>
                <InputText value={selectedIntegration.name} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provider</label>
                <InputText value={selectedIntegration.provider} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Dropdown 
                  value={selectedIntegration.type} 
                  options={['erp', 'tms', 'oms', 'api', 'database', 'file']} 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sync Frequency</label>
                <Dropdown 
                  value={selectedIntegration.syncFrequency} 
                  options={['Real-time', 'Every 15 minutes', 'Hourly', 'Daily', 'On-demand']} 
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <InputTextarea 
                value={selectedIntegration.description} 
                rows={3} 
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Endpoint</label>
                <InputText placeholder="https://api.provider.com/v1" className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <InputText type="password" placeholder="Enter API key" className="w-full" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedIntegration.status === 'connected'} />
              <label className="text-sm">Enable Integration</label>
            </div>
            <div className="flex justify-end gap-2">
              <Button 
                label="Test Connection" 
                severity="info"
              />
              <Button 
                label="Cancel" 
                severity="secondary" 
                onClick={() => setDialogVisible(false)}
              />
              <Button 
                label="Save Changes" 
                severity="success"
              />
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}; 