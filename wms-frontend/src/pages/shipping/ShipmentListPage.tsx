import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';

interface Shipment {
  id: string;
  shipmentNumber: string;
  orderNumber: string;
  carrier: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  shipDate: Date;
  deliveryDate?: Date;
  destination: string;
}

export const ShipmentListPage: React.FC = () => {
  // Mock data
  const shipments: Shipment[] = [
    {
      id: '1',
      shipmentNumber: 'SHIP-001',
      orderNumber: 'ORD-001',
      carrier: 'FedEx',
      status: 'pending',
      shipDate: new Date(),
      destination: 'New York, NY',
    },
    {
      id: '2',
      shipmentNumber: 'SHIP-002',
      orderNumber: 'ORD-002',
      carrier: 'UPS',
      status: 'in_transit',
      shipDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      destination: 'Los Angeles, CA',
    },
    {
      id: '3',
      shipmentNumber: 'SHIP-003',
      orderNumber: 'ORD-003',
      carrier: 'DHL',
      status: 'delivered',
      shipDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      deliveryDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      destination: 'Chicago, IL',
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'in_transit':
        return 'info';
      case 'delivered':
        return 'success';
      case 'cancelled':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const statusTemplate = (rowData: Shipment) => (
    <Tag 
      value={rowData.status.replace('_', ' ')} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const deliveryDateTemplate = (rowData: Shipment) => (
    rowData.deliveryDate ? rowData.deliveryDate.toLocaleDateString() : '-'
  );

  const actionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-eye" size="small" text severity="info" />
      <Button icon="pi pi-print" size="small" text severity="secondary" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shipment List</h2>
        <Button label="Create Shipment" icon="pi pi-truck" />
      </div>
      
      <Card>
        <DataTable 
          value={shipments}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="shipmentNumber" header="Shipment #" sortable />
          <Column field="orderNumber" header="Order #" sortable />
          <Column field="carrier" header="Carrier" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable />
          <Column 
            field="shipDate" 
            header="Ship Date" 
            body={(rowData) => rowData.shipDate.toLocaleDateString()}
            sortable 
          />
          <Column field="deliveryDate" header="Delivery Date" body={deliveryDateTemplate} sortable />
          <Column field="destination" header="Destination" sortable />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 