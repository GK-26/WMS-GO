import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Checkbox } from 'primereact/checkbox';
import { Accordion, AccordionTab } from 'primereact/accordion';

interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
  isSystem: boolean;
}

interface Permission {
  resource: string;
  actions: string[];
}

export const RolesPermissionsPage: React.FC = () => {
  // Mock roles data
  const roles: Role[] = [
    {
      id: '1',
      name: 'System Administrator',
      description: 'Full access to all system features and configurations',
      userCount: 1,
      permissions: ['inventory:read', 'inventory:write', 'orders:read', 'orders:write', 'reports:read', 'configuration:read'],
      isSystem: true,
    },
    {
      id: '2',
      name: 'Warehouse Manager',
      description: 'Manage warehouse operations and oversee workers',
      userCount: 2,
      permissions: ['inventory:read', 'inventory:write', 'orders:read', 'orders:write', 'reports:read'],
      isSystem: false,
    },
    {
      id: '3',
      name: 'Warehouse Worker',
      description: 'Basic warehouse operations and order fulfillment',
      userCount: 5,
      permissions: ['inventory:read', 'orders:read'],
      isSystem: false,
    },
  ];

  // Mock permissions structure
  const permissions: Permission[] = [
    { resource: 'inventory', actions: ['read', 'write', 'delete'] },
    { resource: 'orders', actions: ['read', 'write', 'delete'] },
    { resource: 'receiving', actions: ['read', 'write'] },
    { resource: 'shipping', actions: ['read', 'write'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'configuration', actions: ['read', 'write'] },
  ];

  const permissionsTemplate = (rowData: Role) => (
    <div className="flex flex-wrap gap-1">
      {rowData.permissions.slice(0, 3).map((permission, index) => (
        <Tag key={index} value={permission} severity="info" />
      ))}
      {rowData.permissions.length > 3 && (
        <Tag value={`+${rowData.permissions.length - 3}`} severity="secondary" />
      )}
    </div>
  );

  const typeTemplate = (rowData: Role) => (
    <Tag value={rowData.isSystem ? 'System' : 'Custom'} severity={rowData.isSystem ? 'info' : 'secondary'} />
  );

  const actionsTemplate = (rowData: Role) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" size="small" text severity="info" />
      {!rowData.isSystem && (
        <Button icon="pi pi-trash" size="small" text severity="danger" />
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Roles & Permissions</h2>
        <Button label="Create Role" icon="pi pi-plus" onClick={() => console.log('Create new role')} />
      </div>
      <Card className="mb-4">
        <DataTable value={roles} stripedRows showGridlines className="w-full">
          <Column field="name" header="Role Name" sortable />
          <Column field="description" header="Description" sortable />
          <Column field="userCount" header="Users" sortable />
          <Column field="permissions" header="Permissions" body={permissionsTemplate} />
          <Column field="isSystem" header="Type" body={typeTemplate} />
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
                    <Checkbox inputId={`${permission.resource}-${action}`} checked={false} />
                    <label htmlFor={`${permission.resource}-${action}`}>{action.charAt(0).toUpperCase() + action.slice(1)}</label>
                  </div>
                ))}
              </div>
            </AccordionTab>
          ))}
        </Accordion>
      </Card>
    </div>
  );
}; 