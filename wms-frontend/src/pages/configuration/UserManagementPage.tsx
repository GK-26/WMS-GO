import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
}

export const UserManagementPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock users data
  const users: User[] = [
    {
      id: '1',
      username: 'admin',
      email: 'admin@wms.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'System Administrator',
      status: 'active',
      lastLogin: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
      createdAt: new Date('2024-01-01'),
    },
    {
      id: '2',
      username: 'manager',
      email: 'manager@wms.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'Warehouse Manager',
      status: 'active',
      lastLogin: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      createdAt: new Date('2024-01-15'),
    },
    {
      id: '3',
      username: 'worker1',
      email: 'worker1@wms.com',
      firstName: 'Mike',
      lastName: 'Davis',
      role: 'Warehouse Worker',
      status: 'active',
      lastLogin: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      createdAt: new Date('2024-02-01'),
    },
    {
      id: '4',
      username: 'worker2',
      email: 'worker2@wms.com',
      firstName: 'Lisa',
      lastName: 'Wilson',
      role: 'Warehouse Worker',
      status: 'inactive',
      createdAt: new Date('2024-02-15'),
    },
  ];

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusSeverity = (status: string) => {
    return status === 'active' ? 'success' : 'secondary';
  };

  const nameTemplate = (rowData: User) => (
    <span className="font-semibold">{rowData.firstName} {rowData.lastName}</span>
  );

  const statusTemplate = (rowData: User) => (
    <Tag value={rowData.status} severity={getStatusSeverity(rowData.status)} />
  );

  const actionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" size="small" text severity="info" />
      <Button icon="pi pi-trash" size="small" text severity="danger" />
    </div>
  );

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button label="Add User" icon="pi pi-plus" onClick={() => console.log('Add new user')} />
      </div>

      {/* Search */}
      <Card className="p-4">
        <span className="p-input-icon-left w-full">
          <i className="pi pi-user" />
          <InputText
            placeholder="Search by name, username, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </span>
      </Card>

      {/* Users Table */}
      <Card>
        <DataTable 
          value={filteredUsers.slice(first, first + rows)}
          paginator={false}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="firstName" header="Name" body={nameTemplate} sortable />
          <Column field="username" header="Username" sortable />
          <Column field="email" header="Email" sortable />
          <Column field="role" header="Role" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable />
          <Column 
            field="lastLogin" 
            header="Last Login" 
            body={(rowData) => rowData.lastLogin ? rowData.lastLogin.toLocaleString() : 'Never'}
            sortable 
          />
          <Column 
            field="createdAt" 
            header="Created" 
            body={(rowData) => rowData.createdAt.toLocaleDateString()}
            sortable 
          />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
        <Paginator
          first={first}
          rows={rows}
          totalRecords={filteredUsers.length}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={onPageChange}
        />
      </Card>
    </div>
  );
}; 