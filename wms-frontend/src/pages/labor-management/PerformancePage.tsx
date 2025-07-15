import React from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { ProgressBar } from 'primereact/progressbar';

interface WorkerPerformance {
  id: string;
  name: string;
  role: string;
  efficiency: number;
  accuracy: number;
  productivity: number;
  attendance: number;
  status: 'excellent' | 'good' | 'average' | 'needs_improvement';
}

export const PerformancePage: React.FC = () => {
  const workers: WorkerPerformance[] = [
    {
      id: '1',
      name: 'Mike Davis',
      role: 'Picker',
      efficiency: 95,
      accuracy: 98,
      productivity: 92,
      attendance: 100,
      status: 'excellent',
    },
    {
      id: '2',
      name: 'Sarah Wilson',
      role: 'Packer',
      efficiency: 88,
      accuracy: 95,
      productivity: 85,
      attendance: 95,
      status: 'good',
    },
    {
      id: '3',
      name: 'John Smith',
      role: 'Picker',
      efficiency: 75,
      accuracy: 82,
      productivity: 78,
      attendance: 90,
      status: 'average',
    },
    {
      id: '4',
      name: 'Lisa Johnson',
      role: 'Packer',
      efficiency: 65,
      accuracy: 70,
      productivity: 68,
      attendance: 85,
      status: 'needs_improvement',
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'excellent':
        return 'success';
      case 'good':
        return 'info';
      case 'average':
        return 'warning';
      case 'needs_improvement':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const efficiencyTemplate = (rowData: WorkerPerformance) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.efficiency} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.efficiency}%</span>
    </div>
  );

  const accuracyTemplate = (rowData: WorkerPerformance) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.accuracy} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.accuracy}%</span>
    </div>
  );

  const productivityTemplate = (rowData: WorkerPerformance) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.productivity} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.productivity}%</span>
    </div>
  );

  const attendanceTemplate = (rowData: WorkerPerformance) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.attendance} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.attendance}%</span>
    </div>
  );

  const statusTemplate = (rowData: WorkerPerformance) => (
    <Tag 
      value={rowData.status.replace('_', ' ')} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Worker Performance</h2>
      
      <Card>
        <DataTable 
          value={workers}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="name" header="Worker Name" sortable />
          <Column field="role" header="Role" sortable />
          <Column field="efficiency" header="Efficiency (%)" body={efficiencyTemplate} sortable />
          <Column field="accuracy" header="Accuracy (%)" body={accuracyTemplate} sortable />
          <Column field="productivity" header="Productivity (%)" body={productivityTemplate} sortable />
          <Column field="attendance" header="Attendance (%)" body={attendanceTemplate} sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable />
        </DataTable>
      </Card>
    </div>
  );
}; 