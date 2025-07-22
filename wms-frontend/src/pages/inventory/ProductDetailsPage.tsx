import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '../../services/api';
import { Product } from '../../types';
import { toast } from 'react-toastify';

interface ProductFormData {
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
  unitOfMeasure: string;
  minQuantity: number;
  maxQuantity: number;
  reorderPoint: number;
  cost: number;
  price: number;
  isActive: boolean;
  isHazardous: boolean;
  requiresRefrigeration: boolean;
  lotTracking: boolean;
  serialTracking: boolean;
}

export const ProductDetailsPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>({
    sku: '',
    name: '',
    description: '',
    category: '',
    brand: '',
    dimensions: { length: 0, width: 0, height: 0, weight: 0 },
    unitOfMeasure: '',
    minQuantity: 0,
    maxQuantity: 0,
    reorderPoint: 0,
    cost: 0,
    price: 0,
    isActive: true,
    isHazardous: false,
    requiresRefrigeration: false,
    lotTracking: false,
    serialTracking: false,
  });

  // API hooks
  const { data: productsResponse, isLoading, error } = useProducts();
  const createProductMutation = useCreateProduct();
  const updateProductMutation = useUpdateProduct();
  const deleteProductMutation = useDeleteProduct();

  const products = productsResponse?.data?.data || [];

  const categoryOptions = [
    { label: 'Electronics', value: 'Electronics' },
    { label: 'Furniture', value: 'Furniture' },
    { label: 'Clothing', value: 'Clothing' },
    { label: 'Books', value: 'Books' },
    { label: 'Food & Beverage', value: 'Food & Beverage' },
    { label: 'Automotive', value: 'Automotive' },
    { label: 'Health & Beauty', value: 'Health & Beauty' },
    { label: 'Sports & Outdoors', value: 'Sports & Outdoors' },
    { label: 'Tools & Hardware', value: 'Tools & Hardware' },
    { label: 'Other', value: 'Other' },
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

  const actionTemplate = (rowData: Product) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button 
        icon="pi pi-eye" 
        size="small" 
        text 
        tooltip="View Details"
        onClick={() => {
          // TODO: Navigate to detailed view
          toast.info(`Viewing details for ${rowData.name}`);
        }}
      />
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        text 
        tooltip="Edit Product"
        onClick={() => handleEdit(rowData)}
      />
      <Button 
        icon="pi pi-trash" 
        size="small" 
        text 
        severity="danger" 
        tooltip="Delete Product"
        onClick={() => handleDelete(rowData)}
      />
    </div>
  );

  const handleAdd = () => {
    setFormData({
      sku: '',
      name: '',
      description: '',
      category: '',
      brand: '',
      dimensions: { length: 0, width: 0, height: 0, weight: 0 },
      unitOfMeasure: '',
      minQuantity: 0,
      maxQuantity: 0,
      reorderPoint: 0,
      cost: 0,
      price: 0,
      isActive: true,
      isHazardous: false,
      requiresRefrigeration: false,
      lotTracking: false,
      serialTracking: false,
    });
    setShowAddDialog(true);
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      sku: product.sku,
      name: product.name,
      description: product.description,
      category: product.category,
      brand: product.brand,
      dimensions: product.dimensions,
      unitOfMeasure: product.unitOfMeasure,
      minQuantity: product.minQuantity,
      maxQuantity: product.maxQuantity,
      reorderPoint: product.reorderPoint,
      cost: product.cost,
      price: product.price,
      isActive: product.isActive,
      isHazardous: product.isHazardous,
      requiresRefrigeration: product.requiresRefrigeration,
      lotTracking: product.lotTracking,
      serialTracking: product.serialTracking,
    });
    setShowEditDialog(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      if (showAddDialog) {
        await createProductMutation.mutateAsync(formData);
        toast.success('Product created successfully');
        setShowAddDialog(false);
      } else if (showEditDialog && selectedProduct) {
        await updateProductMutation.mutateAsync({ id: selectedProduct.id, data: formData });
        toast.success('Product updated successfully');
        setShowEditDialog(false);
      }
    } catch (error) {
      toast.error('Failed to save product');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedProduct) return;
    
    try {
      await deleteProductMutation.mutateAsync(selectedProduct.id);
      toast.success('Product deleted successfully');
      setShowDeleteDialog(false);
      setSelectedProduct(null);
    } catch (error) {
      toast.error('Failed to delete product');
    }
  };

  const renderForm = () => (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
      <div>
        <label htmlFor="sku" className="block text-sm font-medium mb-1">SKU *</label>
        <InputText
          id="sku"
          value={formData.sku}
          onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
          placeholder="Enter SKU"
          className="w-full"
        />
      </div>
      
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Product Name *</label>
        <InputText
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter product name"
          className="w-full"
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
        <InputText
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Enter description"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="category" className="block text-sm font-medium mb-1">Category</label>
        <Dropdown
          id="category"
          value={formData.category}
          options={categoryOptions}
          onChange={(e) => setFormData({ ...formData, category: e.value })}
          placeholder="Select category"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="brand" className="block text-sm font-medium mb-1">Brand</label>
        <InputText
          id="brand"
          value={formData.brand}
          onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
          placeholder="Enter brand"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="unitOfMeasure" className="block text-sm font-medium mb-1">Unit of Measure</label>
        <InputText
          id="unitOfMeasure"
          value={formData.unitOfMeasure}
          onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
          placeholder="Enter unit of measure"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="cost" className="block text-sm font-medium mb-1">Cost</label>
        <InputNumber
          id="cost"
          value={formData.cost}
          onValueChange={(e) => setFormData({ ...formData, cost: e.value || 0 })}
          placeholder="Cost"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="price" className="block text-sm font-medium mb-1">Price</label>
        <InputNumber
          id="price"
          value={formData.price}
          onValueChange={(e) => setFormData({ ...formData, price: e.value || 0 })}
          placeholder="Price"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="minQuantity" className="block text-sm font-medium mb-1">Min Quantity</label>
        <InputNumber
          id="minQuantity"
          value={formData.minQuantity}
          onValueChange={(e) => setFormData({ ...formData, minQuantity: e.value || 0 })}
          placeholder="Minimum quantity"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="maxQuantity" className="block text-sm font-medium mb-1">Max Quantity</label>
        <InputNumber
          id="maxQuantity"
          value={formData.maxQuantity}
          onValueChange={(e) => setFormData({ ...formData, maxQuantity: e.value || 0 })}
          placeholder="Maximum quantity"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="reorderPoint" className="block text-sm font-medium mb-1">Reorder Point</label>
        <InputNumber
          id="reorderPoint"
          value={formData.reorderPoint}
          onValueChange={(e) => setFormData({ ...formData, reorderPoint: e.value || 0 })}
          placeholder="Reorder point"
          className="w-full"
        />
      </div>

      <div style={{ gridColumn: '1 / -1' }}>
        <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox
              id="isActive"
              checked={!!formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.checked || false })}
            />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox
              id="isHazardous"
              checked={!!formData.isHazardous}
              onChange={(e) => setFormData({ ...formData, isHazardous: e.checked || false })}
            />
            <label htmlFor="isHazardous" className="text-sm">Hazardous</label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox
              id="requiresRefrigeration"
              checked={!!formData.requiresRefrigeration}
              onChange={(e) => setFormData({ ...formData, requiresRefrigeration: e.checked || false })}
            />
            <label htmlFor="requiresRefrigeration" className="text-sm">Refrigerated</label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox
              id="lotTracking"
              checked={!!formData.lotTracking}
              onChange={(e) => setFormData({ ...formData, lotTracking: e.checked || false })}
            />
            <label htmlFor="lotTracking" className="text-sm">Lot Tracking</label>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Checkbox
              id="serialTracking"
              checked={!!formData.serialTracking}
              onChange={(e) => setFormData({ ...formData, serialTracking: e.checked || false })}
            />
            <label htmlFor="serialTracking" className="text-sm">Serial Tracking</label>
          </div>
        </div>
      </div>

      <div>
        <label htmlFor="length" className="block text-sm font-medium mb-1">Length (cm)</label>
        <InputNumber
          id="length"
          value={formData.dimensions.length}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            dimensions: { ...formData.dimensions, length: e.value || 0 }
          })}
          placeholder="Length"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="width" className="block text-sm font-medium mb-1">Width (cm)</label>
        <InputNumber
          id="width"
          value={formData.dimensions.width}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            dimensions: { ...formData.dimensions, width: e.value || 0 }
          })}
          placeholder="Width"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="height" className="block text-sm font-medium mb-1">Height (cm)</label>
        <InputNumber
          id="height"
          value={formData.dimensions.height}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            dimensions: { ...formData.dimensions, height: e.value || 0 }
          })}
          placeholder="Height"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="weight" className="block text-sm font-medium mb-1">Weight (kg)</label>
        <InputNumber
          id="weight"
          value={formData.dimensions.weight}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            dimensions: { ...formData.dimensions, weight: e.value || 0 }
          })}
          placeholder="Weight"
          className="w-full"
        />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Products</h2>
        <p>Failed to load product data. Please try again later.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Product Details</h2>
        <Button label="Add Product" icon="pi pi-plus" onClick={handleAdd} />
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
          emptyMessage={isLoading ? "Loading products..." : "No products found."}
          loading={isLoading}
        >
          <Column field="sku" header="SKU" sortable style={{ width: '120px' }} />
          <Column field="name" header="Product Name" sortable />
          <Column field="category" header="Category" sortable style={{ width: '120px' }} />
          <Column field="brand" header="Brand" sortable style={{ width: '120px' }} />
          <Column field="unitOfMeasure" header="Unit of Measure" sortable style={{ width: '120px' }} />
          <Column header="Dimensions" body={dimensionsTemplate} style={{ width: '120px' }} />
          <Column header="Tracking" body={trackingTemplate} style={{ width: '100px' }} />
          <Column header="Special Handling" body={specialHandlingTemplate} style={{ width: '150px' }} />
          <Column field="minQuantity" header="Min Quantity" sortable style={{ width: '100px' }} />
          <Column field="maxQuantity" header="Max Quantity" sortable style={{ width: '100px' }} />
          <Column field="cost" header="Cost" sortable style={{ width: '100px' }} />
          <Column field="price" header="Price" sortable style={{ width: '100px' }} />
          <Column field="isActive" header="Active" sortable style={{ width: '100px' }} />
          <Column field="updatedAt" header="Last Updated" sortable style={{ width: '120px' }}
                  body={(rowData) => new Date(rowData.updatedAt).toLocaleDateString()} />
          <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        visible={showAddDialog || showEditDialog}
        header={showAddDialog ? "Add New Product" : "Edit Product"}
        onHide={() => {
          setShowAddDialog(false);
          setShowEditDialog(false);
        }}
        style={{ width: '800px' }}
        footer={
          <div>
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => {
                setShowAddDialog(false);
                setShowEditDialog(false);
              }} 
              className="p-button-text" 
            />
            <Button 
              label="Save" 
              icon="pi pi-check" 
              onClick={handleSave}
              loading={createProductMutation.isPending || updateProductMutation.isPending}
            />
          </div>
        }
      >
        {renderForm()}
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        visible={showDeleteDialog}
        header="Confirm Delete"
        onHide={() => setShowDeleteDialog(false)}
        footer={
          <div>
            <Button 
              label="Cancel" 
              icon="pi pi-times" 
              onClick={() => setShowDeleteDialog(false)} 
              className="p-button-text" 
            />
            <Button 
              label="Delete" 
              icon="pi pi-trash" 
              severity="danger"
              onClick={handleConfirmDelete}
              loading={deleteProductMutation.isPending}
            />
          </div>
        }
      >
        <p>Are you sure you want to delete the product "{selectedProduct?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Dialog>
    </div>
  );
}; 