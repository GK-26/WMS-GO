import React from 'react';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ProgressBar } from 'primereact/progressbar';

interface PerformanceReport {
  workerId: string;
  workerName: string;
  department: string;
  efficiency: number;
  accuracy: number;
  productivity: number;
  attendance: number;
  overallScore: number;
}

export const PerformanceReportsPage: React.FC = () => {
  const performanceData: PerformanceReport[] = [
    {
      workerId: 'EMP-001',
      workerName: 'John Smith',
      department: 'Picking',
      efficiency: 95,
      accuracy: 98,
      productivity: 92,
      attendance: 100,
      overallScore: 96,
    },
    {
      workerId: 'EMP-002',
      workerName: 'Sarah Johnson',
      department: 'Receiving',
      efficiency: 88,
      accuracy: 95,
      productivity: 85,
      attendance: 95,
      overallScore: 91,
    },
    {
      workerId: 'EMP-003',
      workerName: 'Mike Davis',
      department: 'Shipping',
      efficiency: 75,
      accuracy: 82,
      productivity: 78,
      attendance: 90,
      overallScore: 81,
    },
  ];

  const efficiencyTemplate = (rowData: PerformanceReport) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.efficiency} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.efficiency}%</span>
    </div>
  );

  const accuracyTemplate = (rowData: PerformanceReport) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.accuracy} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.accuracy}%</span>
    </div>
  );

  const productivityTemplate = (rowData: PerformanceReport) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.productivity} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.productivity}%</span>
    </div>
  );

  const attendanceTemplate = (rowData: PerformanceReport) => (
    <div className="flex items-center gap-2">
      <ProgressBar 
        value={rowData.attendance} 
        style={{ flexGrow: 1, height: '8px' }}
      />
      <span className="text-sm min-w-[35px]">{rowData.attendance}%</span>
    </div>
  );

  const overallScoreTemplate = (rowData: PerformanceReport) => (
    <div className="font-semibold text-lg">{rowData.overallScore}%</div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Performance Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="text-center">
          <div className="text-3xl font-bold text-blue-600">89%</div>
          <div className="text-sm text-gray-600">Average Efficiency</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-green-600">92%</div>
          <div className="text-sm text-gray-600">Average Accuracy</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-orange-600">85%</div>
          <div className="text-sm text-gray-600">Average Productivity</div>
        </Card>
        <Card className="text-center">
          <div className="text-3xl font-bold text-purple-600">95%</div>
          <div className="text-sm text-gray-600">Average Attendance</div>
        </Card>
      </div>

      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Worker Performance</h3>
          <div className="flex gap-2">
            <Button label="Export CSV" icon="pi pi-download" size="small" outlined />
            <Button label="Generate Report" icon="pi pi-file-pdf" size="small" />
          </div>
        </div>
        <DataTable 
          value={performanceData}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="workerId" header="Worker ID" sortable />
          <Column field="workerName" header="Worker Name" sortable />
          <Column field="department" header="Department" sortable />
          <Column field="efficiency" header="Efficiency" body={efficiencyTemplate} sortable />
          <Column field="accuracy" header="Accuracy" body={accuracyTemplate} sortable />
          <Column field="productivity" header="Productivity" body={productivityTemplate} sortable />
          <Column field="attendance" header="Attendance" body={attendanceTemplate} sortable />
          <Column field="overallScore" header="Overall Score" body={overallScoreTemplate} sortable />
        </DataTable>
      </Card>
    </div>
  );
}; 