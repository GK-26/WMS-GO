import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useOrders, useCustomers } from '../../services/api';
import { Order, Customer } from '../../types';
import { toast } from 'react-toastify';

interface OrderDisplay {
  id: string;
  orderNumber: string;
  customerName: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'picking' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  totalItems: number;
  totalValue: number;
  assignedTo?: string;
  estimatedShipDate: Date;
}

export const OrderListPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // API hooks
  const { data: ordersResponse, isLoading: ordersLoading, error: ordersError } = useOrders({
    include: 'customer,items'
  });
  const { data: customersResponse } = useCustomers();

  const orders = ordersResponse?.data?.data || [];
  const customers = customersResponse?.data?.data || [];

  // Create a map for quick lookups
  const customerMap = new Map(customers.map((c: Customer) => [c.id, c]));

  // Transform orders to display format
  const orderDisplays: OrderDisplay[] = orders.map((order: Order) => {
    const customer = customerMap.get(order.customerId);
    const totalItems = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: customer?.name || 'Unknown Customer',
      orderDate: new Date(order.orderDate),
      status: order.status,
      priority: order.priority,
      totalItems,
      totalValue: order.totalAmount,
      assignedTo: undefined, // TODO: Add assignment tracking
      estimatedShipDate: new Date(order.requiredDate),
    };
  });

  const statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Picking', value: 'picking' },
    { label: 'Packing', value: 'packing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const priorityOptions = [
    { label: 'All Priorities', value: null },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'processing': return 'info';
      case 'picking': return 'primary';
      case 'packing': return 'secondary';
      case 'shipped': return 'success';
      case 'delivered': return 'success';
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

  const statusTemplate = (rowData: OrderDisplay) => (
    <Tag value={rowData.status.charAt(0).toUpperCase() + rowData.status.slice(1)} 
         severity={getStatusSeverity(rowData.status) as any} />
  );

  const priorityTemplate = (rowData: OrderDisplay) => (
    <Tag value={rowData.priority.charAt(0).toUpperCase() + rowData.priority.slice(1)} 
         severity={getPrioritySeverity(rowData.priority) as any} />
  );

  const valueTemplate = (rowData: OrderDisplay) => (
    <span>${rowData.totalValue.toFixed(2)}</span>
  );

  const actionTemplate = (rowData: OrderDisplay) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button 
        icon="pi pi-eye" 
        size="small" 
        text 
        tooltip="View Order"
        onClick={() => {
          // TODO: Navigate to order details
          toast.info(`Viewing order ${rowData.orderNumber}`);
        }}
      />
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        text 
        tooltip="Edit Order"
        onClick={() => {
          // TODO: Open edit modal
          toast.info(`Editing order ${rowData.orderNumber}`);
        }}
      />
      {rowData.status === 'pending' && (
        <Button 
          icon="pi pi-play" 
          size="small" 
          text 
          severity="success" 
          tooltip="Start Processing"
          onClick={() => {
            // TODO: Start order processing
            toast.info(`Starting processing for order ${rowData.orderNumber}`);
          }}
        />
      )}
    </div>
  );

  const filteredOrders = orderDisplays.filter(order => {
    const matchesStatus = !statusFilter || order.status === statusFilter;
    const matchesPriority = !priorityFilter || order.priority === priorityFilter;
    const matchesSearch = !globalFilter || 
      order.orderNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
      order.customerName.toLowerCase().includes(globalFilter.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (ordersError) {
    return (
      <div className="error-container">
        <h2>Error Loading Orders</h2>
        <p>Failed to load order data. Please try again later.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Order List</h2>
        <Button 
          label="Create Order" 
          icon="pi pi-plus" 
          onClick={() => {
            // TODO: Open create order modal
            toast.info('Create order functionality coming soon');
          }}
        />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
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
          <Dropdown
            value={priorityFilter}
            options={priorityOptions}
            onChange={(e) => setPriorityFilter(e.value)}
            placeholder="Filter by Priority"
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
          emptyMessage={ordersLoading ? "Loading orders..." : "No orders found."}
          loading={ordersLoading}
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