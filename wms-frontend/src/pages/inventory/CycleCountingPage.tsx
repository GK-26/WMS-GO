import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';


interface CycleCount {
  id: string;
  sku: string;
  name: string;
  location: string;
  expectedQuantity: number;
  actualQuantity: number;
  variance: number;
  status: 'pending' | 'in_progress' | 'completed' | 'discrepancy';
  assignedTo: string;
  scheduledDate: Date;
  completedDate?: Date;
}

export const CycleCountingPage: React.FC = () => {
  const [cycleCounts] = useState<CycleCount[]>([
    {
      id: '1',
      sku: 'ABC-123',
      name: 'Laptop Computer',
      location: 'A1-B2-C3',
      expectedQuantity: 45,
      actualQuantity: 0,
      variance: -45,
      status: 'pending',
      assignedTo: 'John Smith',
      scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      sku: 'XYZ-789',
      name: 'Wireless Mouse',
      location: 'A1-B2-C4',
      expectedQuantity: 5,
      actualQuantity: 5,
      variance: 0,
      status: 'completed',
      assignedTo: 'Sarah Johnson',
      scheduledDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: '3',
      sku: 'DEF-456',
      name: 'Office Chair',
      location: 'B1-C2-D3',
      expectedQuantity: 0,
      actualQuantity: 2,
      variance: 2,
      status: 'discrepancy',
      assignedTo: 'Mike Davis',
      scheduledDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
      completedDate: new Date(Date.now() - 3 * 60 * 60 * 1000),
    },
    {
      id: '4',
      sku: 'GHI-789',
      name: 'Desk Lamp',
      location: 'B1-C2-D4',
      expectedQuantity: 120,
      actualQuantity: 0,
      variance: -120,
      status: 'in_progress',
      assignedTo: 'Lisa Wilson',
      scheduledDate: new Date(Date.now()),
    },
  ]);

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'discrepancy': return 'danger';
      default: return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'in_progress': return 'In Progress';
      case 'completed': return 'Completed';
      case 'discrepancy': return 'Discrepancy';
      default: return status;
    }
  };

  const varianceTemplate = (rowData: CycleCount) => {
    const color = rowData.variance === 0 ? '#10b981' : rowData.variance > 0 ? '#3b82f6' : '#ef4444';
    return (
      <span style={{ color, fontWeight: 'bold' }}>
        {rowData.variance > 0 ? '+' : ''}{rowData.variance}
      </span>
    );
  };

  const statusTemplate = (rowData: CycleCount) => (
    <Tag value={getStatusLabel(rowData.status)} severity={getStatusSeverity(rowData.status) as any} />
  );

  const actionTemplate = (rowData: CycleCount) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {rowData.status === 'pending' && (
        <Button icon="pi pi-play" size="small" text tooltip="Start Count" />
      )}
      {rowData.status === 'in_progress' && (
        <Button icon="pi pi-check" size="small" text tooltip="Complete Count" />
      )}
      <Button icon="pi pi-eye" size="small" text tooltip="View Details" />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Cycle Counting</h2>
        <Button label="Create Count" icon="pi pi-plus" />
      </div>

      <Card>
        <DataTable
          value={cycleCounts}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No cycle counts found."
        >
          <Column field="sku" header="SKU" sortable style={{ width: '120px' }} />
          <Column field="name" header="Product Name" sortable />
          <Column field="location" header="Location" sortable style={{ width: '120px' }} />
          <Column field="expectedQuantity" header="Expected" sortable style={{ width: '100px' }} />
          <Column field="actualQuantity" header="Actual" sortable style={{ width: '100px' }} />
          <Column header="Variance" body={varianceTemplate} sortable style={{ width: '100px' }} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column field="assignedTo" header="Assigned To" sortable style={{ width: '120px' }} />
          <Column field="scheduledDate" header="Scheduled" sortable style={{ width: '120px' }}
                  body={(rowData) => rowData.scheduledDate.toLocaleDateString()} />
          <Column header="Actions" body={actionTemplate} style={{ width: '100px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 