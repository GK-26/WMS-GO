import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'picking' | 'packing' | 'shipped' | 'delivered';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalItems: number;
  totalValue: number;
  assignedTo?: string;
  estimatedShipDate: Date;
}

export const OrderListPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const orders: Order[] = [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'John Smith',
      orderDate: new Date(Date.now() - 2 * 60 * 60 * 1000),
      status: 'processing',
      priority: 'high',
      totalItems: 5,
      totalValue: 1250.00,
      assignedTo: 'Mike Davis',
      estimatedShipDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      customerName: 'Sarah Johnson',
      orderDate: new Date(Date.now() - 4 * 60 * 60 * 1000),
      status: 'picking',
      priority: 'medium',
      totalItems: 3,
      totalValue: 450.00,
      assignedTo: 'Lisa Wilson',
      estimatedShipDate: new Date(Date.now() + 12 * 60 * 60 * 1000),
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      customerName: 'David Brown',
      orderDate: new Date(Date.now() - 6 * 60 * 60 * 1000),
      status: 'packing',
      priority: 'low',
      totalItems: 8,
      totalValue: 890.00,
      assignedTo: 'John Smith',
      estimatedShipDate: new Date(Date.now() + 6 * 60 * 60 * 1000),
    },
    {
      id: '4',
      orderNumber: 'ORD-004',
      customerName: 'Emily Davis',
      orderDate: new Date(Date.now() - 1 * 60 * 60 * 1000),
      status: 'pending',
      priority: 'urgent',
      totalItems: 2,
      totalValue: 320.00,
      estimatedShipDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    },
  ];

  const statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Picking', value: 'picking' },
    { label: 'Packing', value: 'packing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'picking': return 'primary';
      case 'packing': return 'secondary';
      case 'shipped': return 'success';
      case 'delivered': return 'success';
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

  const statusTemplate = (rowData: Order) => (
    <Tag value={rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1)} 
         severity={getStatusSeverity(rowData.status) as any} />
  );

  const priorityTemplate = (rowData: Order) => (
    <Tag value={rowData.priority.charAt(0).toUpperCase() + rowData.priority.slice(1)} 
         severity={getPrioritySeverity(rowData.priority) as any} />
  );

  const valueTemplate = (rowData: Order) => (
    <span>${rowData.totalValue.toFixed(2)}</span>
  );

  const actionTemplate = (rowData: Order) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button icon="pi pi-eye" size="small" text tooltip="View Order" />
      <Button icon="pi pi-pencil" size="small" text tooltip="Edit Order" />
      {rowData.status === 'pending' && (
        <Button icon="pi pi-play" size="small" text severity="success" tooltip="Start Processing" />
      )}
    </div>
  );

  const filteredOrders = statusFilter 
    ? orders.filter(order => order.status === statusFilter)
    : orders;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Order List</h2>
        <Button label="Create Order" icon="pi pi-plus" />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
          <span className="p-input-icon-left" style={{ width: '300px' }}>
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by order number or customer..."
              style={{ width: '100%' }}
            />
          </span>
          <Dropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => setStatusFilter(e.value)}
            placeholder="Filter by Status"
            style={{ width: '200px' }}
          />
        </div>

        <DataTable
          value={filteredOrders}
          globalFilter={globalFilter}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No orders found."
        >
          <Column field="orderNumber" header="Order #" sortable style={{ width: '120px' }} />
          <Column field="customerName" header="Customer" sortable />
          <Column field="orderDate" header="Order Date" sortable style={{ width: '120px' }}
                  body={(rowData) => rowData.orderDate.toLocaleDateString()} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column field="priority" header="Priority" body={priorityTemplate} sortable style={{ width: '100px' }} />
          <Column field="totalItems" header="Items" sortable style={{ width: '80px' }} />
          <Column field="totalValue" header="Total Value" body={valueTemplate} sortable style={{ width: '120px' }} />
          <Column field="assignedTo" header="Assigned To" sortable style={{ width: '120px' }} />
          <Column field="estimatedShipDate" header="Est. Ship Date" sortable style={{ width: '120px' }}
                  body={(rowData) => rowData.estimatedShipDate.toLocaleDateString()} />
          <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 