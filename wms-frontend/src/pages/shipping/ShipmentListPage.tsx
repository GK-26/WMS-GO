import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { Paginator } from 'primereact/paginator';
import { useShipments } from '../../services/api';
import { Shipment } from '../../types';

export const ShipmentListPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // API hooks
  const { data: shipmentResponse, isLoading, error, refetch } = useShipments({
    page: currentPage,
    limit: rows,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const shipments = shipmentResponse?.data?.data || [];
  const totalRecords = shipmentResponse?.data?.pagination?.total || 0;

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'info';
      case 'shipped':
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
    rowData.actualDeliveryDate ? new Date(rowData.actualDeliveryDate).toLocaleDateString() : '-'
  );

  const destinationTemplate = (rowData: Shipment) => (
    <div>
      <div>{rowData.toAddress.name}</div>
      <div className="text-sm text-gray-500">
        {rowData.toAddress.city}, {rowData.toAddress.state}
      </div>
    </div>
  );

  const actionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-eye" size="small" text severity="info" />
      <Button icon="pi pi-print" size="small" text severity="secondary" />
    </div>
  );

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Processing', value: 'processing' },
    { label: 'Shipped', value: 'shipped' },
    { label: 'Delivered', value: 'delivered' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setCurrentPage(Math.floor(event.first / event.rows) + 1);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Shipment List</h2>
        <Message 
          severity="error" 
          text="Failed to load shipment data. Please try again." 
        />
        <Button 
          label="Retry" 
          icon="pi pi-refresh" 
          onClick={() => refetch()} 
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shipment List</h2>
        <div className="flex gap-2">
          <Dropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => setStatusFilter(e.value)}
            placeholder="Select Status"
            className="w-48"
          />
          <Button label="Create Shipment" icon="pi pi-truck" />
        </div>
      </div>
      
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <>
            <DataTable 
              value={shipments}
              paginator={false}
              stripedRows
              showGridlines
              className="w-full"
            >
              <Column field="shipmentNumber" header="Shipment #" sortable />
              <Column 
                field="orderId" 
                header="Order #" 
                body={(rowData) => rowData.orderId || '-'}
                sortable 
              />
              <Column 
                field="carrierId" 
                header="Carrier" 
                body={(rowData) => rowData.carrier?.name || rowData.carrierId}
                sortable 
              />
              <Column field="status" header="Status" body={statusTemplate} sortable />
              <Column 
                field="shippingDate" 
                header="Ship Date" 
                body={(rowData) => new Date(rowData.shippingDate).toLocaleDateString()}
                sortable 
              />
              <Column field="actualDeliveryDate" header="Delivery Date" body={deliveryDateTemplate} sortable />
              <Column field="toAddress" header="Destination" body={destinationTemplate} sortable />
              <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
            </DataTable>
            
            <Paginator
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Card>
    </div>
  );
}; 