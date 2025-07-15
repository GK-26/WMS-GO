import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Paginator } from 'primereact/paginator';

interface Worker {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  department: string;
  position: string;
  status: 'active' | 'inactive' | 'on_leave';
  hireDate: Date;
  skills: string[];
}

export const WorkerManagementPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data
  const workers: Worker[] = [
    {
      id: '1',
      employeeId: 'EMP-001',
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@wms.com',
      phone: '(555) 123-4567',
      department: 'Picking',
      position: 'Picker',
      status: 'active',
      hireDate: new Date('2023-01-15'),
      skills: ['Order Picking', 'Forklift Operation', 'Inventory Management'],
    },
    {
      id: '2',
      employeeId: 'EMP-002',
      firstName: 'Sarah',
      lastName: 'Johnson',
      email: 'sarah.johnson@wms.com',
      phone: '(555) 234-5678',
      department: 'Receiving',
      position: 'Receiver',
      status: 'active',
      hireDate: new Date('2023-03-20'),
      skills: ['Receiving', 'Quality Control', 'Documentation'],
    },
    {
      id: '3',
      employeeId: 'EMP-003',
      firstName: 'Mike',
      lastName: 'Davis',
      email: 'mike.davis@wms.com',
      phone: '(555) 345-6789',
      department: 'Shipping',
      position: 'Shipper',
      status: 'on_leave',
      hireDate: new Date('2022-11-10'),
      skills: ['Shipping', 'Packaging', 'Labeling'],
    },
  ];

  const filteredWorkers = workers.filter(worker =>
    worker.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    worker.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'inactive':
        return 'danger';
      case 'on_leave':
        return 'warning';
      default:
        return 'info';
    }
  };

  const nameTemplate = (rowData: Worker) => (
    <div>
      <div className="font-semibold">{rowData.firstName} {rowData.lastName}</div>
      <div className="text-sm text-gray-500">{rowData.email}</div>
    </div>
  );

  const statusTemplate = (rowData: Worker) => (
    <Tag 
      value={rowData.status.replace('_', ' ')} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const skillsTemplate = (rowData: Worker) => (
    <div className="flex flex-wrap gap-1">
      {rowData.skills.slice(0, 2).map((skill, index) => (
        <Tag key={index} value={skill} severity="info" />
      ))}
      {rowData.skills.length > 2 && (
        <Tag value={`+${rowData.skills.length - 2}`} severity="secondary" />
      )}
    </div>
  );

  const actionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-eye" size="small" text severity="info" />
      <Button icon="pi pi-pencil" size="small" text severity="secondary" />
    </div>
  );

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Worker Management</h2>
        <Button 
          label="Add Worker" 
          icon="pi pi-plus" 
          onClick={() => console.log('Add new worker')}
        />
      </div>

      {/* Search */}
      <Card className="p-4">
        <span className="p-input-icon-left w-full">
          <i className="pi pi-user" />
          <InputText
            placeholder="Search by name, employee ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </span>
      </Card>

      {/* Workers Table */}
      <Card>
        <DataTable 
          value={filteredWorkers.slice(first, first + rows)}
          paginator={false}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="employeeId" header="Employee ID" sortable />
          <Column field="firstName" header="Name" body={nameTemplate} sortable />
          <Column field="department" header="Department" sortable />
          <Column field="position" header="Position" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable />
          <Column 
            field="hireDate" 
            header="Hire Date" 
            body={(rowData) => rowData.hireDate.toLocaleDateString()}
            sortable 
          />
          <Column field="skills" header="Skills" body={skillsTemplate} />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
        
        <Paginator
          first={first}
          rows={rows}
          totalRecords={filteredWorkers.length}
          rowsPerPageOptions={[5, 10, 25]}
          onPageChange={onPageChange}
        />
      </Card>
    </div>
  );
}; 