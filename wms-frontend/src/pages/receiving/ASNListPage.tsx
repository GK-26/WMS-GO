import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Paginator } from 'primereact/paginator';

interface ASN {
  id: string;
  asnNumber: string;
  poNumber: string;
  supplier: string;
  expectedDate: Date;
  status: 'pending' | 'received' | 'partial' | 'overdue';
  totalItems: number;
  receivedItems: number;
  dockDoor?: string;
}

export const ASNListPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const mockASNs: ASN[] = [
    {
      id: '1',
      asnNumber: 'ASN-001',
      poNumber: 'PO-2024-001',
      supplier: 'Tech Supplies Inc',
      expectedDate: new Date(),
      status: 'pending',
      totalItems: 150,
      receivedItems: 0,
      dockDoor: 'Dock 1',
    },
    {
      id: '2',
      asnNumber: 'ASN-002',
      poNumber: 'PO-2024-002',
      supplier: 'Office Depot',
      expectedDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      status: 'overdue',
      totalItems: 75,
      receivedItems: 0,
    },
    {
      id: '3',
      asnNumber: 'ASN-003',
      poNumber: 'PO-2024-003',
      supplier: 'Global Electronics',
      expectedDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      status: 'pending',
      totalItems: 200,
      receivedItems: 0,
    },
  ];

  const filteredASNs = mockASNs.filter(asn =>
    statusFilter === 'all' || asn.status === statusFilter
  );

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending':
        return 'info';
      case 'received':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleReceive = (asn: ASN) => {
    // TODO: Implement receive functionality
    console.log('Receiving ASN:', asn.asnNumber);
  };

  const handleQualityCheck = (asn: ASN) => {
    // TODO: Implement quality check functionality
    console.log('Quality check for ASN:', asn.asnNumber);
  };

  const expectedDateTemplate = (rowData: ASN) => (
    <div>
      <div>{rowData.expectedDate.toLocaleDateString()}</div>
      {rowData.status === 'overdue' && (
        <div className="text-red-500 text-sm">Overdue</div>
      )}
    </div>
  );

  const statusTemplate = (rowData: ASN) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const progressTemplate = (rowData: ASN) => (
    <div>
      <div>{rowData.receivedItems} / {rowData.totalItems}</div>
      <div className="text-sm text-gray-500">
        {Math.round((rowData.receivedItems / rowData.totalItems) * 100)}%
      </div>
    </div>
  );

  const actionsTemplate = (rowData: ASN) => (
    <div className="flex gap-2">
      <Button 
        icon="pi pi-check" 
        size="small" 
        text 
        severity="success"
        disabled={rowData.status === 'received'}
        onClick={() => handleReceive(rowData)}
      />
      <Button 
        icon="pi pi-exclamation-triangle" 
        size="small" 
        text 
        severity="warning"
        onClick={() => handleQualityCheck(rowData)}
      />
      <Button icon="pi pi-eye" size="small" text severity="info" />
    </div>
  );

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Received', value: 'received' },
    { label: 'Partial', value: 'partial' },
    { label: 'Overdue', value: 'overdue' },
  ];

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Advance Shipping Notices (ASN)</h2>
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Select Status"
          className="w-48"
        />
      </div>

      <Card>
        <DataTable 
          value={filteredASNs.slice(first, first + rows)}
          paginator={false}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="asnNumber" header="ASN #" sortable />
          <Column field="poNumber" header="PO #" sortable />
          <Column field="supplier" header="Supplier" sortable />
          <Column field="expectedDate" header="Expected Date" body={expectedDateTemplate} sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable />
          <Column field="receivedItems" header="Progress" body={progressTemplate} sortable />
          <Column 
            field="dockDoor" 
            header="Dock Door" 
            body={(rowData) => rowData.dockDoor || 'Not Assigned'}
            sortable 
          />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
        
        <Paginator
          first={first}
          rows={rows}
          totalRecords={filteredASNs.length}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={onPageChange}
        />
      </Card>
    </div>
  );
}; 