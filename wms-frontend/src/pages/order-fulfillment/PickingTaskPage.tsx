import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';

interface PickingTask {
  id: string;
  taskNumber: string;
  orderNumber: string;
  customerName: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  totalItems: number;
  pickedItems: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}

export const PickingTaskPage: React.FC = () => {
  const [pickingTasks] = useState<PickingTask[]>([
    {
      id: '1',
      taskNumber: 'PICK-001',
      orderNumber: 'ORD-001',
      customerName: 'John Smith',
      status: 'in_progress',
      priority: 'high',
      assignedTo: 'Mike Davis',
      totalItems: 5,
      pickedItems: 3,
      startTime: new Date(Date.now() - 30 * 60 * 1000),
      estimatedCompletion: new Date(Date.now() + 30 * 60 * 1000),
    },
    {
      id: '2',
      taskNumber: 'PICK-002',
      orderNumber: 'ORD-002',
      customerName: 'Sarah Johnson',
      status: 'assigned',
      priority: 'medium',
      assignedTo: 'Lisa Wilson',
      totalItems: 3,
      pickedItems: 0,
      estimatedCompletion: new Date(Date.now() + 60 * 60 * 1000),
    },
    {
      id: '3',
      taskNumber: 'PICK-003',
      orderNumber: 'ORD-003',
      customerName: 'David Brown',
      status: 'completed',
      priority: 'low',
      assignedTo: 'John Smith',
      totalItems: 8,
      pickedItems: 8,
      startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      actualCompletion: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: '4',
      taskNumber: 'PICK-004',
      orderNumber: 'ORD-004',
      customerName: 'Emily Davis',
      status: 'assigned',
      priority: 'urgent',
      assignedTo: 'Mike Davis',
      totalItems: 2,
      pickedItems: 0,
      estimatedCompletion: new Date(Date.now() + 15 * 60 * 1000),
    },
  ]);

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'assigned': return 'warning';
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

  const progressTemplate = (rowData: PickingTask) => {
    const percentage = (rowData.pickedItems / rowData.totalItems) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar value={percentage} style={{ flex: 1, height: '8px' }} />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {rowData.pickedItems}/{rowData.totalItems}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData: PickingTask) => (
    <Tag value={rowData.status.replace('_', ' ').charAt(0).toUpperCase() + rowData.status.replace('_', ' ').slice(1)} 
         severity={getStatusSeverity(rowData.status) as any} />
  );

  const priorityTemplate = (rowData: PickingTask) => (
    <Tag value={rowData.priority.charAt(0).toUpperCase() + rowData.priority.slice(1)} 
         severity={getPrioritySeverity(rowData.priority) as any} />
  );

  const actionTemplate = (rowData: PickingTask) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {rowData.status === 'assigned' && (
        <Button icon="pi pi-play" size="small" text severity="success" tooltip="Start Picking" />
      )}
      {rowData.status === 'in_progress' && (
        <Button icon="pi pi-check" size="small" text severity="success" tooltip="Complete Task" />
      )}
      <Button icon="pi pi-eye" size="small" text tooltip="View Details" />
      <Button icon="pi pi-pencil" size="small" text tooltip="Edit Task" />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Picking Tasks</h2>
        <Button label="Create Task" icon="pi pi-plus" />
      </div>

      <Card>
        <DataTable
          value={pickingTasks}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No picking tasks found."
        >
          <Column field="taskNumber" header="Task #" sortable style={{ width: '120px' }} />
          <Column field="orderNumber" header="Order #" sortable style={{ width: '120px' }} />
          <Column field="customerName" header="Customer" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column field="priority" header="Priority" body={priorityTemplate} sortable style={{ width: '100px' }} />
          <Column field="assignedTo" header="Assigned To" sortable style={{ width: '120px' }} />
          <Column header="Progress" body={progressTemplate} style={{ width: '150px' }} />
          <Column field="estimatedCompletion" header="Est. Completion" sortable style={{ width: '140px' }}
                  body={(rowData) => rowData.estimatedCompletion?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 