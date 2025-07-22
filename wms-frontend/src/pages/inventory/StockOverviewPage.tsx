import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { Dropdown } from 'primereact/dropdown';
import { useInventoryItems, useProducts, useLocations } from '../../services/api';
import { InventoryItem, Product, Location } from '../../types';
import { toast } from 'react-toastify';

interface StockItemDisplay {
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
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState<string | null>(null);

  // API hooks
  const { data: inventoryResponse, isLoading: inventoryLoading, error: inventoryError } = useInventoryItems({
    include: 'product,location'
  });
  const { data: productsResponse } = useProducts();
  const { data: locationsResponse } = useLocations();

  const inventoryItems = inventoryResponse?.data?.data || [];
  const products = productsResponse?.data?.data || [];
  const locations = locationsResponse?.data?.data || [];

  // Create a map for quick lookups
  const productMap = new Map(products.map((p: Product) => [p.id, p]));
  const locationMap = new Map(locations.map((l: Location) => [l.id, l]));

  // Transform inventory items to display format
  const stockItems: StockItemDisplay[] = inventoryItems.map((item: InventoryItem) => {
    const product = productMap.get(item.productId);
    const location = locationMap.get(item.locationId);
    
    let status: StockItemDisplay['status'] = 'in_stock';
    if (item.quantity === 0) {
      status = 'out_of_stock';
    } else if (item.quantity <= (product?.minQuantity || 0)) {
      status = 'low_stock';
    } else if (item.quantity >= (product?.maxQuantity || 0)) {
      status = 'overstock';
    }

    return {
      id: item.id,
      sku: product?.sku || 'N/A',
      name: product?.name || 'Unknown Product',
      category: product?.category || 'Unknown',
      location: location?.name || 'Unknown Location',
      quantity: item.quantity,
      minQuantity: product?.minQuantity || 0,
      maxQuantity: product?.maxQuantity || 0,
      status,
      lastUpdated: new Date(item.updatedAt),
    };
  });

  // Filter options
  const categoryOptions = [
    { label: 'All Categories', value: null },
    ...Array.from(new Set(products.map((p: Product) => p.category))).map(cat => ({
      label: cat,
      value: cat
    }))
  ];

  const locationOptions = [
    { label: 'All Locations', value: null },
    ...locations.map((loc: Location) => ({
      label: loc.name,
      value: loc.id
    }))
  ];

  // Apply filters
  const filteredItems = stockItems.filter(item => {
    const matchesCategory = !categoryFilter || item.category === categoryFilter;
    const matchesLocation = !locationFilter || locationMap.get(locationFilter)?.name === item.location;
    const matchesSearch = !globalFilter || 
      item.sku.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.name.toLowerCase().includes(globalFilter.toLowerCase()) ||
      item.category.toLowerCase().includes(globalFilter.toLowerCase());
    
    return matchesCategory && matchesLocation && matchesSearch;
  });

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

  const stockLevelTemplate = (rowData: StockItemDisplay) => {
    const percentage = rowData.maxQuantity > 0 ? (rowData.quantity / rowData.maxQuantity) * 100 : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar value={percentage} style={{ flex: 1, height: '8px' }} />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {rowData.quantity}/{rowData.maxQuantity}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData: StockItemDisplay) => (
    <Tag value={getStatusLabel(rowData.status)} severity={getStatusSeverity(rowData.status) as any} />
  );

  const actionTemplate = (rowData: StockItemDisplay) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button 
        icon="pi pi-eye" 
        size="small" 
        text 
        tooltip="View Details"
        onClick={() => {
          // TODO: Navigate to product details
          toast.info(`Viewing details for ${rowData.name}`);
        }}
      />
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        text 
        tooltip="Edit Item"
        onClick={() => {
          // TODO: Open edit modal
          toast.info(`Editing ${rowData.name}`);
        }}
      />
    </div>
  );

  if (inventoryError) {
    return (
      <div className="error-container">
        <h2>Error Loading Inventory</h2>
        <p>Failed to load inventory data. Please try again later.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Stock Overview</h2>
        <Button 
          label="Add Item" 
          icon="pi pi-plus" 
          onClick={() => {
            // TODO: Open add item modal
            toast.info('Add item functionality coming soon');
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
              placeholder="Search by SKU, name, or category..."
              style={{ width: '100%' }}
            />
          </span>
          <Dropdown
            value={categoryFilter}
            options={categoryOptions}
            onChange={(e) => setCategoryFilter(e.value)}
            placeholder="Filter by Category"
            style={{ width: '200px' }}
          />
          <Dropdown
            value={locationFilter}
            options={locationOptions}
            onChange={(e) => setLocationFilter(e.value)}
            placeholder="Filter by Location"
            style={{ width: '200px' }}
          />
        </div>

        <DataTable
          value={filteredItems}
          globalFilter={globalFilter}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage={inventoryLoading ? "Loading inventory..." : "No stock items found."}
          loading={inventoryLoading}
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