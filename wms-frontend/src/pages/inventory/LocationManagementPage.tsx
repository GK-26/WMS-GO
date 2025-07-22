import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputNumber } from 'primereact/inputnumber';
import { Dropdown } from 'primereact/dropdown';
import { Checkbox } from 'primereact/checkbox';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '../../services/api';
import { Location } from '../../types';
import { toast } from 'react-toastify';

interface LocationFormData {
  name: string;
  type: import('../../types').Location['type'];
  warehouseId: string;
  parentLocationId?: string;
  capacity: number;
  isActive: boolean;
  coordinates?: {
    x: number;
    y: number;
    z: number;
  };
}

export const LocationManagementPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [formData, setFormData] = useState<LocationFormData>({
    name: '',
    type: 'zone',
    warehouseId: '',
    parentLocationId: '',
    capacity: 0,
    isActive: true,
    coordinates: { x: 0, y: 0, z: 0 },
  });

  // API hooks
  const { data: locationsResponse, isLoading, error } = useLocations();
  const createLocationMutation = useCreateLocation();
  const updateLocationMutation = useUpdateLocation();
  const deleteLocationMutation = useDeleteLocation();

  const locations = locationsResponse?.data?.data || [];

  const typeOptions = [
    { label: 'Zone', value: 'zone' },
    { label: 'Aisle', value: 'aisle' },
    { label: 'Rack', value: 'rack' },
    { label: 'Bin', value: 'bin' },
    { label: 'Shelf', value: 'shelf' },
    { label: 'Pallet Position', value: 'pallet_position' },
    { label: 'Dock', value: 'dock' },
    { label: 'Staging Area', value: 'staging_area' },
  ];

  const parentLocationOptions = [
    { label: 'No Parent', value: '' },
    ...locations.map((loc: Location) => ({
      label: loc.name,
      value: loc.id,
    })),
  ];

  // Mock warehouse options - in a real app, this would come from an API
  const warehouseOptions = [
    { label: 'Main Warehouse', value: 'main_warehouse' },
    { label: 'Secondary Warehouse', value: 'secondary_warehouse' },
    { label: 'Cold Storage', value: 'cold_storage' },
  ];

  const getTypeSeverity = (type: string) => {
    switch (type) {
      case 'zone': return 'info';
      case 'aisle': return 'warning';
      case 'rack': return 'success';
      case 'bin': return 'secondary';
      case 'shelf': return 'help';
      case 'pallet_position': return 'danger';
      case 'dock': return 'primary';
      case 'staging_area': return 'info';
      default: return 'info';
    }
  };

  const typeTemplate = (rowData: Location) => (
    <Tag value={rowData.type} severity={getTypeSeverity(rowData.type) as any} />
  );

  const statusTemplate = (rowData: Location) => (
    <Tag value={rowData.isActive ? 'Active' : 'Inactive'} severity={rowData.isActive ? 'success' : 'danger'} />
  );

  const coordinatesTemplate = (rowData: Location) => {
    if (!rowData.coordinates) return '-';
    return `${rowData.coordinates.x}, ${rowData.coordinates.y}, ${rowData.coordinates.z}`;
  };

  const parentTemplate = (rowData: Location) => {
    if (!rowData.parentLocationId) return '-';
    const parent = locations.find((loc: Location) => loc.id === rowData.parentLocationId);
    return parent ? parent.name : 'Unknown';
  };

  const actionTemplate = (rowData: Location) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        text 
        tooltip="Edit Location"
        onClick={() => handleEdit(rowData)}
      />
      <Button 
        icon="pi pi-trash" 
        size="small" 
        text 
        severity="danger" 
        tooltip="Delete Location"
        onClick={() => handleDelete(rowData)}
      />
    </div>
  );

  const handleAdd = () => {
    setFormData({
      name: '',
      type: 'zone',
      warehouseId: '',
      parentLocationId: '',
      capacity: 0,
      isActive: true,
      coordinates: { x: 0, y: 0, z: 0 },
    });
    setShowAddDialog(true);
  };

  const handleEdit = (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      type: location.type,
      warehouseId: location.warehouseId,
      parentLocationId: location.parentLocationId || '',
      capacity: location.capacity,
      isActive: location.isActive,
      coordinates: location.coordinates || { x: 0, y: 0, z: 0 },
    });
    setShowEditDialog(true);
  };

  const handleDelete = (location: Location) => {
    setSelectedLocation(location);
    setShowDeleteDialog(true);
  };

  const handleSave = async () => {
    try {
      if (showAddDialog) {
        await createLocationMutation.mutateAsync(formData);
        toast.success('Location created successfully');
        setShowAddDialog(false);
      } else if (showEditDialog && selectedLocation) {
        await updateLocationMutation.mutateAsync({ id: selectedLocation.id, data: formData });
        toast.success('Location updated successfully');
        setShowEditDialog(false);
      }
    } catch (error) {
      toast.error('Failed to save location');
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedLocation) return;
    
    try {
      await deleteLocationMutation.mutateAsync(selectedLocation.id);
      toast.success('Location deleted successfully');
      setShowDeleteDialog(false);
      setSelectedLocation(null);
    } catch (error) {
      toast.error('Failed to delete location');
    }
  };

  const renderForm = () => (
    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr 1fr' }}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium mb-1">Location Name *</label>
        <InputText
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter location name"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="type" className="block text-sm font-medium mb-1">Location Type *</label>
        <Dropdown
          id="type"
          value={formData.type}
          options={typeOptions}
          onChange={(e) => setFormData({ ...formData, type: e.value })}
          placeholder="Select type"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="warehouseId" className="block text-sm font-medium mb-1">Warehouse *</label>
        <Dropdown
          id="warehouseId"
          value={formData.warehouseId}
          options={warehouseOptions}
          onChange={(e) => setFormData({ ...formData, warehouseId: e.value })}
          placeholder="Select warehouse"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="parentLocationId" className="block text-sm font-medium mb-1">Parent Location</label>
        <Dropdown
          id="parentLocationId"
          value={formData.parentLocationId}
          options={parentLocationOptions}
          onChange={(e) => setFormData({ ...formData, parentLocationId: e.value })}
          placeholder="Select parent location"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="capacity" className="block text-sm font-medium mb-1">Capacity</label>
        <InputNumber
          id="capacity"
          value={formData.capacity}
          onValueChange={(e) => setFormData({ ...formData, capacity: e.value || 0 })}
          placeholder="Enter capacity"
          className="w-full"
          min={0}
        />
      </div>

      <div>
        <label htmlFor="isActive" className="block text-sm font-medium mb-1">Status</label>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
          <Checkbox
            id="isActive"
            checked={!!formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.checked || false })}
          />
          <label htmlFor="isActive" className="text-sm">Active</label>
        </div>
      </div>

      <div>
        <label htmlFor="x" className="block text-sm font-medium mb-1">X Coordinate</label>
        <InputNumber
          id="x"
          value={formData.coordinates?.x || 0}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            coordinates: { ...formData.coordinates!, x: e.value || 0 }
          })}
          placeholder="X coordinate"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="y" className="block text-sm font-medium mb-1">Y Coordinate</label>
        <InputNumber
          id="y"
          value={formData.coordinates?.y || 0}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            coordinates: { ...formData.coordinates!, y: e.value || 0 }
          })}
          placeholder="Y coordinate"
          className="w-full"
        />
      </div>

      <div>
        <label htmlFor="z" className="block text-sm font-medium mb-1">Z Coordinate</label>
        <InputNumber
          id="z"
          value={formData.coordinates?.z || 0}
          onValueChange={(e) => setFormData({ 
            ...formData, 
            coordinates: { ...formData.coordinates!, z: e.value || 0 }
          })}
          placeholder="Z coordinate"
          className="w-full"
        />
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="error-container">
        <h2>Error Loading Locations</h2>
        <p>Failed to load location data. Please try again later.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Location Management</h2>
        <Button label="Add Location" icon="pi pi-plus" onClick={handleAdd} />
      </div>

      <Card>
        <div style={{ marginBottom: '1rem' }}>
          <span className="p-input-icon-left" style={{ width: '300px' }}>
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search locations..."
              style={{ width: '100%' }}
            />
          </span>
        </div>

        <DataTable
          value={locations}
          globalFilter={globalFilter}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage={isLoading ? "Loading locations..." : "No locations found."}
          loading={isLoading}
        >
          <Column field="name" header="Location Name" sortable />
          <Column field="type" header="Type" body={typeTemplate} sortable style={{ width: '120px' }} />
          <Column field="parentLocationId" header="Parent Location" body={parentTemplate} sortable style={{ width: '150px' }} />
          <Column field="capacity" header="Capacity" sortable style={{ width: '100px' }} />
          <Column field="coordinates" header="Coordinates" body={coordinatesTemplate} style={{ width: '150px' }} />
          <Column field="isActive" header="Status" body={statusTemplate} sortable style={{ width: '100px' }} />
          <Column field="createdAt" header="Created" sortable style={{ width: '120px' }}
                  body={(rowData) => new Date(rowData.createdAt).toLocaleDateString()} />
          <Column header="Actions" body={actionTemplate} style={{ width: '100px' }} />
        </DataTable>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        visible={showAddDialog || showEditDialog}
        header={showAddDialog ? "Add New Location" : "Edit Location"}
        onHide={() => {
          setShowAddDialog(false);
          setShowEditDialog(false);
        }}
        style={{ width: '700px' }}
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
              loading={createLocationMutation.isPending || updateLocationMutation.isPending}
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
              loading={deleteLocationMutation.isPending}
            />
          </div>
        }
      >
        <p>Are you sure you want to delete the location "{selectedLocation?.name}"?</p>
        <p>This action cannot be undone.</p>
      </Dialog>
    </div>
  );
}; 