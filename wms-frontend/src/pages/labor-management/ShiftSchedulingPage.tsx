import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { ProgressBar } from 'primereact/progressbar';

interface Shift {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  department: string;
  workers: string[];
  maxWorkers: number;
  isActive: boolean;
}

interface ShiftAssignment {
  id: string;
  workerId: string;
  workerName: string;
  shiftId: string;
  shiftName: string;
  date: Date;
  status: 'scheduled' | 'completed' | 'absent';
}

export const ShiftSchedulingPage: React.FC = () => {
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  // Mock data
  const shifts: Shift[] = [
    {
      id: '1',
      name: 'Morning Shift',
      startTime: '06:00',
      endTime: '14:00',
      department: 'Picking',
      workers: ['John Smith', 'Sarah Johnson'],
      maxWorkers: 5,
      isActive: true,
    },
    {
      id: '2',
      name: 'Afternoon Shift',
      startTime: '14:00',
      endTime: '22:00',
      department: 'Receiving',
      workers: ['Mike Davis'],
      maxWorkers: 3,
      isActive: true,
    },
    {
      id: '3',
      name: 'Night Shift',
      startTime: '22:00',
      endTime: '06:00',
      department: 'Shipping',
      workers: [],
      maxWorkers: 4,
      isActive: true,
    },
  ];

  const shiftAssignments: ShiftAssignment[] = [
    {
      id: '1',
      workerId: 'EMP-001',
      workerName: 'John Smith',
      shiftId: '1',
      shiftName: 'Morning Shift',
      date: new Date(),
      status: 'scheduled',
    },
    {
      id: '2',
      workerId: 'EMP-002',
      workerName: 'Sarah Johnson',
      shiftId: '1',
      shiftName: 'Morning Shift',
      date: new Date(),
      status: 'scheduled',
    },
    {
      id: '3',
      workerId: 'EMP-003',
      workerName: 'Mike Davis',
      shiftId: '2',
      shiftName: 'Afternoon Shift',
      date: new Date(),
      status: 'scheduled',
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'info';
      case 'completed':
        return 'success';
      case 'absent':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const getDayName = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  };

  const capacityTemplate = (rowData: Shift) => {
    const percentage = (rowData.workers.length / rowData.maxWorkers) * 100;
    
    return (
      <div className="flex items-center gap-2">
        <ProgressBar 
          value={percentage} 
          style={{ width: '60px', height: '8px' }}
        />
        <span className="text-sm">{Math.round(percentage)}%</span>
      </div>
    );
  };

  const statusTemplate = (rowData: Shift) => (
    <Tag 
      value={rowData.isActive ? 'Active' : 'Inactive'} 
      severity={rowData.isActive ? 'success' : 'secondary'}
    />
  );

  const shiftActionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-calendar" size="small" text severity="info" />
      <Button icon="pi pi-pencil" size="small" text severity="secondary" />
      <Button icon="pi pi-trash" size="small" text severity="danger" />
    </div>
  );

  const assignmentStatusTemplate = (rowData: ShiftAssignment) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const assignmentActionsTemplate = () => (
    <div className="flex gap-2">
      <Button icon="pi pi-pencil" size="small" text severity="secondary" />
      <Button icon="pi pi-trash" size="small" text severity="danger" />
    </div>
  );

  const departmentOptions = [
    { label: 'All Departments', value: 'all' },
    { label: 'Picking', value: 'Picking' },
    { label: 'Receiving', value: 'Receiving' },
    { label: 'Shipping', value: 'Shipping' },
  ];

  const filteredShifts = shifts.filter(shift => 
    departmentFilter === 'all' || shift.department === departmentFilter
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Shift Scheduling</h2>
        <Button 
          label="Create Shift" 
          icon="pi pi-plus" 
          onClick={() => console.log('Create new shift')}
        />
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4 items-center">
          <div className="font-semibold">
            {getDayName(new Date())} - {new Date().toLocaleDateString()}
          </div>
          <Dropdown
            value={departmentFilter}
            options={departmentOptions}
            onChange={(e) => setDepartmentFilter(e.value)}
            placeholder="Select Department"
            className="w-48"
          />
        </div>
      </Card>

      {/* Shifts Overview */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Available Shifts</h3>
        </div>
        <DataTable 
          value={filteredShifts}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="name" header="Shift Name" sortable />
          <Column 
            field="startTime" 
            header="Time" 
            body={(rowData) => `${rowData.startTime} - ${rowData.endTime}`}
            sortable 
          />
          <Column field="department" header="Department" sortable />
          <Column 
            field="workers" 
            header="Workers" 
            body={(rowData) => `${rowData.workers.length} / ${rowData.maxWorkers}`}
            sortable 
          />
          <Column field="maxWorkers" header="Capacity" body={capacityTemplate} />
          <Column field="isActive" header="Status" body={statusTemplate} />
          <Column header="Actions" body={shiftActionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      {/* Today's Assignments */}
      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Today's Assignments</h3>
        </div>
        <DataTable 
          value={shiftAssignments}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="workerName" header="Worker" sortable />
          <Column field="shiftName" header="Shift" sortable />
          <Column 
            field="shiftId" 
            header="Time" 
            body={(rowData) => {
              const shift = shifts.find(s => s.id === rowData.shiftId);
              return shift ? `${shift.startTime} - ${shift.endTime}` : '';
            }}
            sortable 
          />
          <Column field="status" header="Status" body={assignmentStatusTemplate} sortable />
          <Column header="Actions" body={assignmentActionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 