import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';

interface StockItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  location: string;
  quantity: number;
  minQuantity: number;
  maxQuantity: number;
  status: 'in_stock' | 'low_stock' | 'out_of_stock' | 'overstock';
  lastUpdated: Date;
}

export const StockOverviewPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');

  const stockItems: StockItem[] = [
    {
      id: '1',
      sku: 'ABC-123',
      name: 'Laptop Computer',
      category: 'Electronics',
      location: 'A1-B2-C3',
      quantity: 45,
      minQuantity: 10,
      maxQuantity: 100,
      status: 'in_stock',
      lastUpdated: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      id: '2',
      sku: 'XYZ-789',
      name: 'Wireless Mouse',
      category: 'Electronics',
      location: 'A1-B2-C4',
      quantity: 5,
      minQuantity: 10,
      maxQuantity: 50,
      status: 'low_stock',
      lastUpdated: new Date(Date.now() - 1 * 60 * 60 * 1000),
    },
    {
      id: '3',
      sku: 'DEF-456',
      name: 'Office Chair',
      category: 'Furniture',
      location: 'B1-C2-D3',
      quantity: 0,
      minQuantity: 5,
      maxQuantity: 25,
      status: 'out_of_stock',
      lastUpdated: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '4',
      sku: 'GHI-789',
      name: 'Desk Lamp',
      category: 'Furniture',
      location: 'B1-C2-D4',
      quantity: 120,
      minQuantity: 20,
      maxQuantity: 100,
      status: 'overstock',
      lastUpdated: new Date(Date.now() - 4 * 60 * 60 * 1000),
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'in_stock': return 'success';
      case 'low_stock': return 'warn';
      case 'out_of_stock': return 'danger';
      case 'overstock': return 'info';
      default: return 'info';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'in_stock': return 'In Stock';
      case 'low_stock': return 'Low Stock';
      case 'out_of_stock': return 'Out of Stock';
      case 'overstock': return 'Overstock';
      default: return status;
    }
  };

  const stockLevelTemplate = (rowData: StockItem) => {
    const percentage = (rowData.quantity / rowData.maxQuantity) * 100;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar value={percentage} style={{ flex: 1, height: '8px' }} />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {rowData.quantity}/{rowData.maxQuantity}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData: StockItem) => (
    <Tag value={getStatusLabel(rowData.status)} severity={getStatusSeverity(rowData.status) as any} />
  );

  const actionTemplate = () => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button icon="pi pi-eye" size="small" text />
      <Button icon="pi pi-pencil" size="small" text />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Stock Overview</h2>
        <Button label="Add Item" icon="pi pi-plus" />
      </div>

      <Card>
        <div style={{ marginBottom: '1rem' }}>
          <span className="p-input-icon-left" style={{ width: '300px' }}>
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by SKU, name, or category..."
              style={{ width: '100%' }}
            />
          </span>
        </div>

        <DataTable
          value={stockItems}
          globalFilter={globalFilter}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No stock items found."
        >
          <Column field="sku" header="SKU" sortable style={{ width: '120px' }} />
          <Column field="name" header="Product Name" sortable />
          <Column field="category" header="Category" sortable style={{ width: '120px' }} />
          <Column field="location" header="Location" sortable style={{ width: '120px' }} />
          <Column header="Stock Level" body={stockLevelTemplate} style={{ width: '200px' }} />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column field="lastUpdated" header="Last Updated" sortable style={{ width: '150px' }}
                  body={(rowData) => rowData.lastUpdated.toLocaleDateString()} />
          <Column header="Actions" body={actionTemplate} style={{ width: '100px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 