import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

interface OrderReport {
  orderNumber: string;
  customer: string;
  orderDate: Date;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  totalAmount: number;
  items: number;
  priority: 'low' | 'medium' | 'high';
}

export const OrderReportsPage: React.FC = () => {
  const orderData: OrderReport[] = [
    {
      orderNumber: 'ORD-001',
      customer: 'John Smith',
      orderDate: new Date(),
      status: 'shipped',
      totalAmount: 1250.00,
      items: 3,
      priority: 'high',
    },
    {
      orderNumber: 'ORD-002',
      customer: 'Sarah Johnson',
      orderDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: 'processing',
      totalAmount: 450.00,
      items: 2,
      priority: 'medium',
    },
    {
      orderNumber: 'ORD-003',
      customer: 'Mike Davis',
      orderDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: 'delivered',
      totalAmount: 890.00,
      items: 1,
      priority: 'low',
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
        return 'success';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getPrioritySeverity = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const statusTemplate = (rowData: OrderReport) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const priorityTemplate = (rowData: OrderReport) => (
    <Tag 
      value={rowData.priority} 
      severity={getPrioritySeverity(rowData.priority)}
    />
  );

  const amountTemplate = (rowData: OrderReport) => (
    <span className="font-semibold">${rowData.totalAmount.toFixed(2)}</span>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Order Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">1,234</div>
          <div className="text-sm text-gray-600">Total Orders</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">$45,678</div>
          <div className="text-sm text-gray-600">Total Revenue</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">23</div>
          <div className="text-sm text-gray-600">Pending Orders</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">89%</div>
          <div className="text-sm text-gray-600">On-Time Delivery</div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Order Summary</h3>
          <div className="flex gap-2">
            <Button label="Export CSV" icon="pi pi-download" size="small" outlined />
            <Button label="Generate Report" icon="pi pi-file-pdf" size="small" />
          </div>
        </div>
        <DataTable 
          value={orderData}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="orderNumber" header="Order #" sortable />
          <Column field="customer" header="Customer" sortable />
          <Column 
            field="orderDate" 
            header="Order Date" 
            body={(rowData) => rowData.orderDate.toLocaleDateString()}
            sortable 
          />
          <Column field="status" header="Status" body={statusTemplate} sortable />
          <Column field="totalAmount" header="Total Amount" body={amountTemplate} sortable />
          <Column field="items" header="Items" sortable />
          <Column field="priority" header="Priority" body={priorityTemplate} sortable />
        </DataTable>
      </Card>
    </div>
  );
}; 