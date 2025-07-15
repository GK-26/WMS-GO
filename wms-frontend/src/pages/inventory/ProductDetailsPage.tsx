import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  category: string;
  brand: string;
  dimensions: {
    length: number;
    width: number;
    height: number;
    weight: number;
  };
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  lotTracking: boolean;
  serialTracking: boolean;
  minStockLevel: number;
  maxStockLevel: number;
  reorderPoint: number;
  createdAt: Date;
  updatedAt: Date;
}

export const ProductDetailsPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');

  const products: Product[] = [
    {
      id: '1',
      sku: 'ABC-123',
      name: 'Laptop Computer',
      description: 'High-performance laptop with latest specifications',
      category: 'Electronics',
      brand: 'TechCorp',
      dimensions: { length: 35, width: 25, height: 2, weight: 2.5 },
      isHazardous: false,
      requiresRefrigeration: false,
      lotTracking: false,
      serialTracking: true,
      minStockLevel: 10,
      maxStockLevel: 100,
      reorderPoint: 20,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-15'),
    },
    {
      id: '2',
      sku: 'XYZ-789',
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless mouse with precision tracking',
      category: 'Electronics',
      brand: 'TechCorp',
      dimensions: { length: 12, width: 6, height: 3, weight: 0.1 },
      isHazardous: false,
      requiresRefrigeration: false,
      lotTracking: false,
      serialTracking: false,
      minStockLevel: 50,
      maxStockLevel: 500,
      reorderPoint: 100,
      createdAt: new Date('2024-01-10'),
      updatedAt: new Date('2024-01-20'),
    },
    {
      id: '3',
      sku: 'DEF-456',
      name: 'Office Chair',
      description: 'Ergonomic office chair with adjustable features',
      category: 'Furniture',
      brand: 'ComfortCo',
      dimensions: { length: 60, width: 60, height: 120, weight: 15 },
      isHazardous: false,
      requiresRefrigeration: false,
      lotTracking: false,
      serialTracking: false,
      minStockLevel: 5,
      maxStockLevel: 50,
      reorderPoint: 10,
      createdAt: new Date('2024-02-01'),
      updatedAt: new Date('2024-02-10'),
    },
  ];

  const dimensionsTemplate = (rowData: Product) => (
    <span>
      {rowData.dimensions.length}×{rowData.dimensions.width}×{rowData.dimensions.height} cm
      <br />
      <small style={{ color: '#666' }}>{rowData.dimensions.weight} kg</small>
    </span>
  );

  const trackingTemplate = (rowData: Product) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {rowData.lotTracking && <Tag value="Lot" severity="info" />}
      {rowData.serialTracking && <Tag value="Serial" severity="success" />}
    </div>
  );

  const specialHandlingTemplate = (rowData: Product) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {rowData.isHazardous && <Tag value="Hazardous" severity="danger" />}
      {rowData.requiresRefrigeration && <Tag value="Refrigerated" severity="warning" />}
    </div>
  );

  const actionTemplate = () => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button icon="pi pi-eye" size="small" text tooltip="View Details" />
      <Button icon="pi pi-pencil" size="small" text tooltip="Edit Product" />
      <Button icon="pi pi-trash" size="small" text severity="danger" tooltip="Delete Product" />
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Product Details</h2>
        <Button label="Add Product" icon="pi pi-plus" />
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
          value={products}
          globalFilter={globalFilter}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage="No products found."
        >
          <Column field="sku" header="SKU" sortable style={{ width: '120px' }} />
          <Column field="name" header="Product Name" sortable />
          <Column field="category" header="Category" sortable style={{ width: '120px' }} />
          <Column field="brand" header="Brand" sortable style={{ width: '120px' }} />
          <Column header="Dimensions" body={dimensionsTemplate} style={{ width: '120px' }} />
          <Column header="Tracking" body={trackingTemplate} style={{ width: '100px' }} />
          <Column header="Special Handling" body={specialHandlingTemplate} style={{ width: '150px' }} />
          <Column field="minStockLevel" header="Min Stock" sortable style={{ width: '100px' }} />
          <Column field="maxStockLevel" header="Max Stock" sortable style={{ width: '100px' }} />
          <Column field="updatedAt" header="Last Updated" sortable style={{ width: '120px' }}
                  body={(rowData) => rowData.updatedAt.toLocaleDateString()} />
          <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 