import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';

interface PackingTask {
  id: string;
  taskNumber: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  totalItems: number;
  packedItems: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
  packagingType: string;
}

export const PackingStationPage: React.FC = () => {
  const [packingTasks] = useState<PackingTask[]>([
    {
      id: '1',
      taskNumber: 'PACK-001',
      orderNumber: 'ORD-001',
      customerName: 'John Smith',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Mike Davis',
      totalItems: 5,
      packedItems: 3,
      startTime: new Date(Date.now() - 20 * 60 * 1000),
      estimatedCompletion: new Date(Date.now() + 20 * 60 * 1000),
      packagingType: 'Standard Box',
    },
    {
      id: '2',
      taskNumber: 'PACK-002',
      orderNumber: 'ORD-002',
      customerName: 'Sarah Johnson',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Lisa Wilson',
      totalItems: 3,
      packedItems: 0,
      estimatedCompletion: new Date(Date.now() + 45 * 60 * 1000),
      packagingType: 'Bubble Mailer',
    },
    {
      id: '3',
      taskNumber: 'PACK-003',
      orderNumber: 'ORD-003',
      customerName: 'David Brown',
      status: 'completed',
      priority: 'low',
      assignedTo: 'John Smith',
      totalItems: 8,
      packedItems: 8,
      startTime: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      actualCompletion: new Date(Date.now() - 30 * 60 * 1000),
      packagingType: 'Large Box',
    },
    {
      id: '4',
      taskNumber: 'PACK-004',
      orderNumber: 'ORD-004',
      customerName: 'Emily Davis',
      status: 'pending',
      priority: 'urgent',
      assignedTo: 'Mike Davis',
      totalItems: 2,
      packedItems: 0,
      estimatedCompletion: new Date(Date.now() + 10 * 60 * 1000),
      packagingType: 'Small Box',
    },
  ]);

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  const getPrioritySeverity = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'danger';
      default: return 'info';
    }
  };

  const progressTemplate = (rowData: PackingTask) => {
    const percentage = (rowData.packedItems / rowData.totalItems) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar value={percentage} style={{ flex: 1, height: '8px' }} />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {rowData.packedItems}/{rowData.totalItems}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData: PackingTask) => (
    <Tag value={rowData.status.replace('_', ' ').charAt(0).toUpperCase() + rowData.status.replace('_', ' ').slice(1)} 
         severity={getStatusSeverity(rowData.status) as any} />
  );

  const priorityTemplate = (rowData: PackingTask) => (
    <Tag value={rowData.priority.charAt(0).toUpperCase() + rowData.priority.slice(1)} 
         severity={getPrioritySeverity(rowData.priority) as any} />
  );

  const actionTemplate = (rowData: PackingTask) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {rowData.status === 'pending' && (
        <Button icon="pi pi-play" size="small" text severity="success" tooltip="Start Packing" />
      )}
      {rowData.status === 'in_progress' && (
        <Button icon="pi pi-check" size="small" text severity="success" tooltip="Complete Packing" />
      )}
      <Button icon="pi pi-eye" size="small" text tooltip="View Details" />
      <Button icon="pi pi-pencil" size="small" text tooltip="Edit Task" />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Packing Station</h2>
        <Button label="Create Task" icon="pi pi-plus" />
      </div>

      <Card>
        <DataTable
          value={packingTasks}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No packing tasks found."
        >
          <Column field="taskNumber" header="Task #" sortable style={{ width: '120px' }} />
          <Column field="orderNumber" header="Order #" sortable style={{ width: '120px' }} />
          <Column field="customerName" header="Customer" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column field="priority" header="Priority" body={priorityTemplate} sortable style={{ width: '100px' }} />
          <Column field="assignedTo" header="Assigned To" sortable style={{ width: '120px' }} />
          <Column header="Progress" body={progressTemplate} style={{ width: '150px' }} />
          <Column field="packagingType" header="Packaging" sortable style={{ width: '120px' }} />
          <Column field="estimatedCompletion" header="Est. Completion" sortable style={{ width: '140px' }}
                  body={(rowData) => rowData.estimatedCompletion?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 