import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';

interface TriggerEvent {
  id: string;
  name: string;
  type: 'trigger' | 'event';
  category: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  priority: 'high' | 'medium' | 'low';
  lastExecuted: Date;
  nextExecution: Date;
  executionCount: number;
  successRate: number;
}

export const TriggersEventsPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<TriggerEvent | null>(null);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [globalFilter, setGlobalFilter] = useState('');

  const triggersEvents: TriggerEvent[] = [
    {
      id: '1',
      name: 'Low Stock Alert',
      type: 'trigger',
      category: 'Inventory',
      description: 'Triggers when inventory level falls below minimum threshold',
      status: 'active',
      priority: 'high',
      lastExecuted: new Date('2024-01-15T10:30:00'),
      nextExecution: new Date('2024-01-16T10:30:00'),
      executionCount: 45,
      successRate: 98.5
    },
    {
      id: '2',
      name: 'Order Status Update',
      type: 'event',
      category: 'Order Management',
      description: 'Event triggered when order status changes',
      status: 'active',
      priority: 'medium',
      lastExecuted: new Date('2024-01-15T14:20:00'),
      nextExecution: new Date('2024-01-15T15:20:00'),
      executionCount: 156,
      successRate: 99.2
    },
    {
      id: '3',
      name: 'Quality Check Reminder',
      type: 'trigger',
      category: 'Quality Control',
      description: 'Reminds quality control team to inspect received items',
      status: 'active',
      priority: 'medium',
      lastExecuted: new Date('2024-01-15T09:15:00'),
      nextExecution: new Date('2024-01-16T09:15:00'),
      executionCount: 23,
      successRate: 95.8
    },
    {
      id: '4',
      name: 'Performance Report Generation',
      type: 'event',
      category: 'Reporting',
      description: 'Automatically generates daily performance reports',
      status: 'active',
      priority: 'low',
      lastExecuted: new Date('2024-01-15T23:00:00'),
      nextExecution: new Date('2024-01-16T23:00:00'),
      executionCount: 1,
      successRate: 100
    },
    {
      id: '5',
      name: 'Equipment Maintenance Alert',
      type: 'trigger',
      category: 'Equipment',
      description: 'Alerts maintenance team when equipment needs service',
      status: 'inactive',
      priority: 'high',
      lastExecuted: new Date('2024-01-10T16:45:00'),
      nextExecution: new Date('2024-01-20T16:45:00'),
      executionCount: 8,
      successRate: 87.5
    }
  ];

  const statusBodyTemplate = (rowData: TriggerEvent) => {
    const severity = rowData.status === 'active' ? 'success' : 
                    rowData.status === 'inactive' ? 'danger' : 'warning';
    return <Tag value={rowData.status.toUpperCase()} severity={severity} />;
  };

  const typeBodyTemplate = (rowData: TriggerEvent) => {
    const severity = rowData.type === 'trigger' ? 'info' : 'warning';
    return <Tag value={rowData.type.toUpperCase()} severity={severity} />;
  };

  const priorityBodyTemplate = (rowData: TriggerEvent) => {
    const severity = rowData.priority === 'high' ? 'danger' : 
                    rowData.priority === 'medium' ? 'warning' : 'info';
    return <Tag value={rowData.priority.toUpperCase()} severity={severity} />;
  };

  const dateBodyTemplate = (rowData: TriggerEvent, field: keyof TriggerEvent) => {
    const date = rowData[field] as Date;
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const successRateBodyTemplate = (rowData: TriggerEvent) => {
    return (
      <div className="flex align-items-center">
        <span className="mr-2">{rowData.successRate}%</span>
        <div className="w-20 h-2 bg-gray-200 rounded">
          <div 
            className="h-full bg-green-500 rounded" 
            style={{ width: `${rowData.successRate}%` }}
          ></div>
        </div>
      </div>
    );
  };

  const actionsBodyTemplate = (rowData: TriggerEvent) => {
    return (
      <div className="flex gap-2">
        <Button 
          icon="pi pi-eye" 
          size="small" 
          severity="secondary"
          tooltip="View Details"
          onClick={() => {
            setSelectedItem(rowData);
            setDialogVisible(true);
          }}
        />
        <Button 
          icon="pi pi-pencil" 
          size="small" 
          severity="info"
          tooltip="Edit"
        />
        <Button 
          icon="pi pi-play" 
          size="small" 
          severity="success"
          tooltip="Execute Now"
        />
        <Button 
          icon="pi pi-power-off" 
          size="small" 
          severity={rowData.status === 'active' ? 'danger' : 'success'}
          tooltip={rowData.status === 'active' ? 'Deactivate' : 'Activate'}
        />
      </div>
    );
  };

  const header = (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold">Triggers & Events</h2>
      <div className="flex gap-2">
        <span className="p-input-icon-left">
          <i className="pi pi-search" />
          <InputText
            placeholder="Search triggers and events..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
          />
        </span>
        <Button 
          label="Create New" 
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
          <div className="text-2xl font-bold text-blue-600">12</div>
          <div className="text-sm text-gray-600">Active Triggers</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-green-600">8</div>
          <div className="text-sm text-gray-600">Active Events</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-purple-600">233</div>
          <div className="text-sm text-gray-600">Total Executions Today</div>
        </Card>
        <Card className="text-center">
          <div className="text-2xl font-bold text-orange-600">96.8%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </Card>
      </div>

      {/* Triggers & Events Table */}
      <Card>
        <DataTable 
          value={triggersEvents} 
          paginator 
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          className="p-datatable-sm"
          stripedRows
          globalFilter={globalFilter}
          header={header}
          emptyMessage="No triggers or events found."
        >
          <Column field="name" header="Name" sortable />
          <Column field="type" header="Type" body={typeBodyTemplate} sortable />
          <Column field="category" header="Category" sortable />
          <Column field="description" header="Description" style={{ maxWidth: '200px' }} />
          <Column field="status" header="Status" body={statusBodyTemplate} sortable />
          <Column field="priority" header="Priority" body={priorityBodyTemplate} sortable />
          <Column 
            field="lastExecuted" 
            header="Last Executed" 
            body={(rowData) => dateBodyTemplate(rowData, 'lastExecuted')} 
            sortable 
          />
          <Column 
            field="nextExecution" 
            header="Next Execution" 
            body={(rowData) => dateBodyTemplate(rowData, 'nextExecution')} 
            sortable 
          />
          <Column field="executionCount" header="Executions" sortable />
          <Column field="successRate" header="Success Rate" body={successRateBodyTemplate} sortable />
          <Column header="Actions" body={actionsBodyTemplate} style={{ width: '160px' }} />
        </DataTable>
      </Card>

      {/* Detail Dialog */}
      <Dialog 
        visible={dialogVisible} 
        onHide={() => setDialogVisible(false)}
        header="Trigger/Event Details"
        style={{ width: '600px' }}
        modal
      >
        {selectedItem && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <InputText value={selectedItem.name} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <Dropdown 
                  value={selectedItem.type} 
                  options={['trigger', 'event']} 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <InputText value={selectedItem.category} className="w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Dropdown 
                  value={selectedItem.priority} 
                  options={['high', 'medium', 'low']} 
                  className="w-full"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <InputTextarea 
                value={selectedItem.description} 
                rows={3} 
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Executed</label>
                <Calendar 
                  value={selectedItem.lastExecuted} 
                  showTime 
                  className="w-full"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Next Execution</label>
                <Calendar 
                  value={selectedItem.nextExecution} 
                  showTime 
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox checked={selectedItem.status === 'active'} />
              <label className="text-sm">Active</label>
            </div>
            <div className="flex justify-end gap-2">
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