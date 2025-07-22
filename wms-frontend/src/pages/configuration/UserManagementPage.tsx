import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { InputText } from 'primereact/inputtext';
import { Paginator } from 'primereact/paginator';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { useGet, usePost, usePut, useDelete } from '../../services/api';
import { Role, User } from '../../types';

export const UserManagementPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [showDelete, setShowDelete] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });

  // Fetch users and roles from backend
  const { data: userResp, isLoading } = useGet<User[]>('/users');
  const { data: rolesResp } = useGet<Role[]>('/roles');
  const users = userResp?.data || [];
  const roles = rolesResp?.data || [];

  // Mutations
  const createUser = usePost<User>('/users');
  const updateUser = usePut<User>(editUser ? `/users/${editUser.id}` : '/users');
  const deleteUser = useDelete<User>(editUser ? `/users/${editUser.id}` : '/users');

  // Filtering
  const filteredUsers = users.filter((user: User) =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.role || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusSeverity = (isActive: boolean) => (isActive ? 'success' : 'secondary');

  const nameTemplate = (rowData: User) => (
    <span className="font-semibold">{rowData.firstName} {rowData.lastName}</span>
  );

  const statusTemplate = (rowData: User) => (
    <Tag value={rowData.isActive ? 'active' : 'inactive'} severity={getStatusSeverity(rowData.isActive)} />
  );

  const rolesTemplate = (rowData: User) => (
    <span>{rowData.role}</span>
  );

  const actionsTemplate = (rowData: User) => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" size="small" text severity="info" onClick={() => { setEditUser(rowData); setShowModal(true); }} />
      <Button icon="pi pi-trash" size="small" text severity="danger" onClick={() => setShowDelete({ open: true, user: rowData })} />
    </div>
  );

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  // Form state
  const [form, setForm] = useState<Partial<User>>({});
  const [formPassword, setFormPassword] = useState('');

  const openAddModal = () => {
    setEditUser(null);
    setForm({});
    setFormPassword('');
    setShowModal(true);
  };

  const handleModalHide = () => {
    setShowModal(false);
    setEditUser(null);
    setForm({});
    setFormPassword('');
  };

  const handleFormChange = (field: keyof User, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    const payload = { ...form, password: formPassword };
    if (editUser) {
      await updateUser.mutateAsync(payload);
    } else {
      await createUser.mutateAsync(payload);
    }
    handleModalHide();
  };

  const handleDelete = async () => {
    if (showDelete.user) {
      await deleteUser.mutateAsync();
      setShowDelete({ open: false, user: null });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Button label="Add User" icon="pi pi-plus" onClick={openAddModal} />
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
          loading={isLoading}
        >
          <Column field="firstName" header="Name" body={nameTemplate} sortable />
          <Column field="username" header="Username" sortable />
          <Column field="email" header="Email" sortable />
          <Column field="role" header="Role" body={rolesTemplate} sortable />
          <Column field="isActive" header="Status" body={statusTemplate} sortable />
          <Column 
            field="lastLogin" 
            header="Last Login" 
            body={(rowData) => rowData.lastLogin ? new Date(rowData.lastLogin).toLocaleString() : 'Never'}
            sortable 
          />
          <Column 
            field="createdAt" 
            header="Created" 
            body={(rowData) => rowData.createdAt ? new Date(rowData.createdAt).toLocaleDateString() : ''}
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

      {/* Add/Edit User Modal */}
      <Dialog header={editUser ? 'Edit User' : 'Add User'} visible={showModal} style={{ width: '400px' }} onHide={handleModalHide}>
        <div className="space-y-3">
          <InputText className="w-full" placeholder="Username" value={form.username || ''} onChange={e => handleFormChange('username', e.target.value)} />
          <InputText className="w-full" placeholder="Email" value={form.email || ''} onChange={e => handleFormChange('email', e.target.value)} />
          <InputText className="w-full" placeholder="First Name" value={form.firstName || ''} onChange={e => handleFormChange('firstName', e.target.value)} />
          <InputText className="w-full" placeholder="Last Name" value={form.lastName || ''} onChange={e => handleFormChange('lastName', e.target.value)} />
          <Dropdown className="w-full" value={form.role || ''} options={roles} optionLabel="name" optionValue="name" placeholder="Select Role" onChange={e => handleFormChange('role', e.value)} />
          <InputText className="w-full" placeholder="Password" type="password" value={formPassword} onChange={e => setFormPassword(e.target.value)} />
          <Dropdown className="w-full" value={form.isActive ?? true} options={[{ label: 'Active', value: true }, { label: 'Inactive', value: false }]} onChange={e => handleFormChange('isActive', e.value)} placeholder="Status" />
          <div className="flex justify-end gap-2">
            <Button label="Cancel" text onClick={handleModalHide} />
            <Button label={editUser ? 'Update' : 'Create'} onClick={handleSave} loading={createUser.isPending || updateUser.isPending} />
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog header="Confirm Delete" visible={showDelete.open} style={{ width: '350px' }} onHide={() => setShowDelete({ open: false, user: null })}>
        <div className="space-y-4">
          <p>Are you sure you want to delete user <b>{showDelete.user?.username}</b>?</p>
          <div className="flex justify-end gap-2">
            <Button label="Cancel" text onClick={() => setShowDelete({ open: false, user: null })} />
            <Button label="Delete" severity="danger" onClick={handleDelete} loading={deleteUser.isPending} />
          </div>
        </div>
      </Dialog>
    </div>
  );
}; 