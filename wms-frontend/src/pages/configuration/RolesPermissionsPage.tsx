import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { useGet, usePost, usePut, useDelete } from '../../services/api';
import { Role } from '../../types';

export const RolesPermissionsPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editRole, setEditRole] = useState<Role | null>(null);
  const [showDelete, setShowDelete] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });

  // Fetch roles from backend
  const { data: rolesResp, isLoading } = useGet<Role[]>('/roles');
  const roles = rolesResp?.data || [];

  // Mutations
  const createRole = usePost<Role>('/roles');
  const updateRole = usePut<Role>(editRole ? `/roles/${editRole.id}` : '/roles');
  const deleteRole = useDelete<Role>(editRole ? `/roles/${editRole.id}` : '/roles');

  // Mock permissions structure (in a real app, this would come from backend)
  const permissions: { resource: string; actions: string[] }[] = [
    { resource: 'inventory', actions: ['read', 'write', 'delete'] },
    { resource: 'orders', actions: ['read', 'write', 'delete'] },
    { resource: 'receiving', actions: ['read', 'write'] },
    { resource: 'shipping', actions: ['read', 'write'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'configuration', actions: ['read', 'write'] },
  ];

  const permissionsTemplate = (rowData: Role) => (
    <div className="flex flex-wrap gap-1">
      {rowData.permissions?.slice(0, 3).map((permission, index) => (
        <Tag key={index} value={permission} severity="info" />
      ))}
      {rowData.permissions && rowData.permissions.length > 3 && (
        <Tag value={`+${rowData.permissions.length - 3}`} severity="secondary" />
      )}
    </div>
  );

  const typeTemplate = (rowData: Role) => (
    <Tag value={rowData.name === 'admin' ? 'System' : 'Custom'} severity={rowData.name === 'admin' ? 'info' : 'secondary'} />
  );

  const actionsTemplate = (rowData: Role) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" size="small" text severity="info" onClick={() => { setEditRole(rowData); setShowModal(true); }} />
      {rowData.name !== 'admin' && (
        <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => setShowDelete({ open: true, role: rowData })} />
      )}
    </div>
  );

  // Form state
  const [form, setForm] = useState<Partial<Role>>({});
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const openAddModal = () => {
    setEditRole(null);
    setForm({});
    setSelectedPermissions([]);
    setShowModal(true);
  };

  const handleModalHide = () => {
    setShowModal(false);
    setEditRole(null);
    setForm({});
    setSelectedPermissions([]);
  };

  const handleFormChange = (field: keyof Role, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handlePermissionChange = (resource: string, action: string, checked: boolean) => {
    const permString = `${resource}:${action}`;
    if (checked) {
      setSelectedPermissions(prev => [...prev, permString]);
    } else {
      setSelectedPermissions(prev => prev.filter(p => p !== permString));
    }
  };

  const handleSave = async () => {
    const payload = { ...form, permissions: selectedPermissions };
    if (editRole) {
      await updateRole.mutateAsync(payload);
    } else {
      await createRole.mutateAsync(payload);
    }
    handleModalHide();
  };

  const handleDelete = async () => {
    if (showDelete.role) {
      await deleteRole.mutateAsync();
      setShowDelete({ open: false, role: null });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Roles & Permissions</h2>
        <Button label="Create Role" icon="pi pi-plus" onClick={openAddModal} />
      </div>
      <Card className="mb-4">
        <DataTable value={roles} stripedRows showGridlines className="w-full" loading={isLoading}>
          <Column field="name" header="Role Name" sortable />
          <Column field="description" header="Description" sortable />
          <Column field="permissions" header="Permissions" body={permissionsTemplate} />
          <Column field="name" header="Type" body={typeTemplate} />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
      <Card>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2"><i className="pi pi-shield"></i>Permissions Matrix</h3>
        <Accordion multiple>
          {permissions.map((permission) => (
            <AccordionTab key={permission.resource} header={permission.resource.charAt(0).toUpperCase() + permission.resource.slice(1)}>
              <div className="flex flex-wrap gap-4">
                {permission.actions.map((action) => (
                  <div key={action} className="flex items-center gap-2">
                    <Checkbox 
                      inputId={`${permission.resource}-${action}`} 
                      checked={selectedPermissions.some(p => p.startsWith(`${permission.resource}:`))}
                      onChange={(e) => handlePermissionChange(permission.resource, action, e.checked || false)}
                    />
                    <label htmlFor={`${permission.resource}-${action}`}>{action.charAt(0).toUpperCase() + action.slice(1)}</label>
                  </div>
                ))}
              </div>
            </AccordionTab>
          ))}
        </Accordion>
      </Card>

      {/* Add/Edit Role Modal */}
      <Dialog header={editRole ? 'Edit Role' : 'Create Role'} visible={showModal} style={{ width: '500px' }} onHide={handleModalHide}>
        <div className="space-y-3">
          <InputText className="w-full" placeholder="Role Name" value={form.name || ''} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleFormChange('name', e.target.value)} />
          <InputTextarea className="w-full" placeholder="Description" value={form.description || ''} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleFormChange('description', e.target.value)} rows={3} />
          <div className="flex justify-end gap-2">
            <Button label="Cancel" text onClick={handleModalHide} />
            <Button label={editRole ? 'Update' : 'Create'} onClick={handleSave} loading={createRole.isPending || updateRole.isPending} />
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog header="Confirm Delete" visible={showDelete.open} style={{ width: '350px' }} onHide={() => setShowDelete({ open: false, role: null })}>
        <div className="space-y-4">
          <p>Are you sure you want to delete role <b>{showDelete.role?.name}</b>?</p>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" text onClick={() => setShowDelete({ open: false, role: null })} />
            <Button label="Delete" severity="danger" onClick={handleDelete} loading={deleteRole.isPending} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}; 