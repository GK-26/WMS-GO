import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Dropdown } from 'primereact/dropdown';
import { Calendar } from 'primereact/calendar';
import { useInventoryReport } from '../../services/api';

interface InventoryReportData {
  category: string;
  totalItems: number;
  lowStock: number;
  outOfStock: number;
  value: number;
  status: 'normal' | 'alert' | 'critical';
}

export const InventoryReportsPage: React.FC = () => {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([null, null]);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // API hooks
  const { data: reportResponse, isLoading, error, refetch } = useInventoryReport({
    dateFrom: dateRange[0]?.toISOString(),
    dateTo: dateRange[1]?.toISOString(),
    category: categoryFilter === 'all' ? undefined : categoryFilter,
  });

  const inventoryData: InventoryReportData[] = (reportResponse?.data as any)?.data || [];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'critical':
        return 'danger';
      case 'alert':
        return 'warning';
      case 'normal':
        return 'success';
      default:
        return 'secondary';
    }
  };

  const valueTemplate = (rowData: InventoryReportData) => (
    <span>${rowData.value.toLocaleString()}</span>
  );

  const statusTemplate = (rowData: InventoryReportData) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const actionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-eye" size="small" text severity="info" />
      <Button icon="pi pi-download" size="small" text severity="secondary" />
    </div>
  );

  const categoryOptions = [
    { label: 'All Categories', value: 'all' },
    { label: 'Electronics', value: 'electronics' },
    { label: 'Clothing', value: 'clothing' },
    { label: 'Books', value: 'books' },
    { label: 'Home & Garden', value: 'home_garden' },
    { label: 'Sports', value: 'sports' },
  ];

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Exporting inventory report...');
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Inventory Reports</h2>
        <Message 
          severity="error" 
          text="Failed to load inventory report data. Please try again." 
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
        <h2 className="text-2xl font-bold">Inventory Reports</h2>
        <Button 
          label="Export Report" 
          icon="pi pi-download" 
          onClick={handleExport}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Date Range</label>
            <Calendar
              value={dateRange}
              onChange={(e) => setDateRange(e.value as [Date | null, Date | null])}
              selectionMode="range"
              showIcon
              placeholder="Select date range"
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <Dropdown
              value={categoryFilter}
              options={categoryOptions}
              onChange={(e) => setCategoryFilter(e.value)}
              placeholder="Select Category"
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button 
              label="Apply Filters" 
              icon="pi pi-filter" 
              onClick={() => refetch()}
              className="w-full"
            />
          </div>
        </div>
      </Card>

      {/* Report Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {inventoryData.reduce((sum, item) => sum + item.totalItems, 0)}
            </div>
            <div className="text-sm text-gray-500">Total Items</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {inventoryData.reduce((sum, item) => sum + item.lowStock, 0)}
            </div>
            <div className="text-sm text-gray-500">Low Stock Items</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {inventoryData.reduce((sum, item) => sum + item.outOfStock, 0)}
            </div>
            <div className="text-sm text-gray-500">Out of Stock</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              ${inventoryData.reduce((sum, item) => sum + item.value, 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">Total Value</div>
          </div>
        </Card>
      </div>

      {/* Report Table */}
      <Card>
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">Inventory Summary by Category</h3>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable 
            value={inventoryData}
            stripedRows
            showGridlines
            className="w-full"
          >
            <Column field="category" header="Category" sortable />
            <Column field="totalItems" header="Total Items" sortable />
            <Column field="lowStock" header="Low Stock" sortable />
            <Column field="outOfStock" header="Out of Stock" sortable />
            <Column field="value" header="Total Value" body={valueTemplate} sortable />
            <Column field="status" header="Status" body={statusTemplate} sortable />
            <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
          </DataTable>
        )}
      </Card>
    </div>
  );
}; 