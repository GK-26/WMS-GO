import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useWorkers } from '../../services/api';
import { Worker } from '../../types';

export const WorkerManagementPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // API hooks
  const { data: workerResponse, isLoading, error, refetch } = useWorkers({
    page: currentPage,
    limit: rows,
    search: searchTerm || undefined,
  });

  const workers = workerResponse?.data?.data || [];
  const totalRecords = workerResponse?.data?.pagination?.total || 0;

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
      value={rowData.isActive ? 'active' : 'inactive'} 
      severity={getStatusSeverity(rowData.isActive ? 'active' : 'inactive')}
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
    setCurrentPage(Math.floor(event.first / event.rows) + 1);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Worker Management</h2>
        <Message 
          severity="error" 
          text="Failed to load worker data. Please try again." 
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
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <>
            <DataTable 
              value={workers}
              paginator={false}
              stripedRows
              showGridlines
              className="w-full"
            >
              <Column field="employeeId" header="Employee ID" sortable />
              <Column field="firstName" header="Name" body={nameTemplate} sortable />
              <Column field="department" header="Department" sortable />
              <Column field="position" header="Position" sortable />
              <Column field="isActive" header="Status" body={statusTemplate} sortable />
              <Column 
                field="hireDate" 
                header="Hire Date" 
                body={(rowData) => new Date(rowData.hireDate).toLocaleDateString()}
                sortable 
              />
              <Column field="skills" header="Skills" body={skillsTemplate} />
              <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
            </DataTable>
            
            <Paginator
              first={first}
              rows={rows}
              totalRecords={totalRecords}
              rowsPerPageOptions={[5, 10, 25]}
              onPageChange={onPageChange}
            />
          </>
        )}
      </Card>
    </div>
  );
}; 