import React, { useState } from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { ProgressBar } from 'primereact/progressbar';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { useTasks, useOrders, useWorkers } from '../../services/api';
import { Task, Order, Worker } from '../../types';
import { toast } from 'react-toastify';

interface PickingTaskDisplay {
  id: string;
  taskNumber: string;
  orderNumber: string;
  customerName: string;
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  totalItems: number;
  pickedItems: number;
  startTime?: Date;
  estimatedCompletion?: Date;
  actualCompletion?: Date;
}

export const PickingTaskPage: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  // API hooks
  const { data: tasksResponse, isLoading: tasksLoading, error: tasksError } = useTasks({
    type: 'picking',
    include: 'order,items'
  });
  const { data: ordersResponse } = useOrders();
  const { data: workersResponse } = useWorkers();

  const tasks = tasksResponse?.data?.data || [];
  const orders = ordersResponse?.data?.data || [];
  const workers = workersResponse?.data?.data || [];

  // Create maps for quick lookups
  const orderMap = new Map(orders.map((o: Order) => [o.id, o]));
  const workerMap = new Map(workers.map((w: Worker) => [w.id, w]));

  // Transform tasks to display format
  const pickingTasks: PickingTaskDisplay[] = tasks.map((task: Task) => {
    const order = orderMap.get(task.orderId || '');
    const worker = workerMap.get(task.assignedTo || '');
    const totalItems = task.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    const pickedItems = task.items?.reduce((sum, item) => sum + item.completedQuantity, 0) || 0;
    
    return {
      id: task.id,
      taskNumber: task.taskNumber,
      orderNumber: order?.orderNumber || 'N/A',
      customerName: order?.customer?.name || 'Unknown Customer',
      status: task.status,
      priority: task.priority,
      assignedTo: worker ? `${worker.firstName} ${worker.lastName}` : 'Unassigned',
      totalItems,
      pickedItems,
      startTime: task.startedAt ? new Date(task.startedAt) : undefined,
      estimatedCompletion: new Date(task.dueDate),
      actualCompletion: task.completedAt ? new Date(task.completedAt) : undefined,
    };
  });

  const statusOptions = [
    { label: 'All Status', value: null },
    { label: 'Pending', value: 'pending' },
    { label: 'Assigned', value: 'assigned' },
    { label: 'In Progress', value: 'in_progress' },
    { label: 'Completed', value: 'completed' },
    { label: 'Cancelled', value: 'cancelled' },
  ];

  const priorityOptions = [
    { label: 'All Priorities', value: null },
    { label: 'Low', value: 'low' },
    { label: 'Medium', value: 'medium' },
    { label: 'High', value: 'high' },
    { label: 'Urgent', value: 'urgent' },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending': return 'warning';
      case 'assigned': return 'warning';
      case 'in_progress': return 'info';
      case 'completed': return 'success';
      case 'cancelled': return 'danger';
      default: return 'info';
    }
  };

  const getPrioritySeverity = (priority: string) => {
    switch (priority) {
      case 'low': return 'success';
      case 'medium': return 'info';
      case 'high': return 'warning';
      case 'urgent': return 'danger';
      default: return 'info';
    }
  };

  const progressTemplate = (rowData: PickingTaskDisplay) => {
    const percentage = rowData.totalItems > 0 ? (rowData.pickedItems / rowData.totalItems) * 100 : 0;
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <ProgressBar value={percentage} style={{ flex: 1, height: '8px' }} />
        <span style={{ minWidth: '40px', textAlign: 'right' }}>
          {rowData.pickedItems}/{rowData.totalItems}
        </span>
      </div>
    );
  };

  const statusTemplate = (rowData: PickingTaskDisplay) => (
    <Tag value={rowData.status.replace('_', ' ').charAt(0).toUpperCase() + rowData.status.replace('_', ' ').slice(1)} 
         severity={getStatusSeverity(rowData.status) as any} />
  );

  const priorityTemplate = (rowData: PickingTaskDisplay) => (
    <Tag value={rowData.priority.charAt(0).toUpperCase() + rowData.priority.slice(1)} 
         severity={getPrioritySeverity(rowData.priority) as any} />
  );

  const actionTemplate = (rowData: PickingTaskDisplay) => (
    <div style={{ display: 'flex', gap: '0.5rem' }}>
      {rowData.status === 'assigned' && (
        <Button 
          icon="pi pi-play" 
          size="small" 
          text 
          severity="success" 
          tooltip="Start Picking"
          onClick={() => {
            // TODO: Start task
            toast.info(`Starting picking task ${rowData.taskNumber}`);
          }}
        />
      )}
      {rowData.status === 'in_progress' && (
        <Button 
          icon="pi pi-check" 
          size="small" 
          text 
          severity="success" 
          tooltip="Complete Task"
          onClick={() => {
            // TODO: Complete task
            toast.info(`Completing picking task ${rowData.taskNumber}`);
          }}
        />
      )}
      <Button 
        icon="pi pi-eye" 
        size="small" 
        text 
        tooltip="View Details"
        onClick={() => {
          // TODO: Navigate to task details
          toast.info(`Viewing task ${rowData.taskNumber}`);
        }}
      />
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        text 
        tooltip="Edit Task"
        onClick={() => {
          // TODO: Open edit modal
          toast.info(`Editing task ${rowData.taskNumber}`);
        }}
      />
    </div>
  );

  const filteredTasks = pickingTasks.filter(task => {
    const matchesStatus = !statusFilter || task.status === statusFilter;
    const matchesPriority = !priorityFilter || task.priority === priorityFilter;
    const matchesSearch = !globalFilter || 
      task.taskNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
      task.orderNumber.toLowerCase().includes(globalFilter.toLowerCase()) ||
      task.customerName.toLowerCase().includes(globalFilter.toLowerCase());
    
    return matchesStatus && matchesPriority && matchesSearch;
  });

  if (tasksError) {
    return (
      <div className="error-container">
        <h2>Error Loading Tasks</h2>
        <p>Failed to load picking task data. Please try again later.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={() => window.location.reload()} />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2 style={{ margin: 0, color: '#333' }}>Picking Tasks</h2>
        <Button 
          label="Create Task" 
          icon="pi pi-plus" 
          onClick={() => {
            // TODO: Open create task modal
            toast.info('Create task functionality coming soon');
          }}
        />
      </div>

      <Card>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="p-input-icon-left" style={{ width: '300px' }}>
            <i className="pi pi-search" />
            <InputText
              value={globalFilter}
              onChange={(e) => setGlobalFilter(e.target.value)}
              placeholder="Search by task number, order number, or customer..."
              style={{ width: '100%' }}
            />
          </span>
          <Dropdown
            value={statusFilter}
            options={statusOptions}
            onChange={(e) => setStatusFilter(e.value)}
            placeholder="Filter by Status"
            style={{ width: '200px' }}
          />
          <Dropdown
            value={priorityFilter}
            options={priorityOptions}
            onChange={(e) => setPriorityFilter(e.value)}
            placeholder="Filter by Priority"
            style={{ width: '200px' }}
          />
        </div>

        <DataTable
          value={filteredTasks}
          globalFilter={globalFilter}
          showGridlines
          paginator
          rows={10}
          rowsPerPageOptions={[5, 10, 25]}
          emptyMessage={tasksLoading ? "Loading tasks..." : "No picking tasks found."}
          loading={tasksLoading}
        >
          <Column field="taskNumber" header="Task #" sortable style={{ width: '120px' }} />
          <Column field="orderNumber" header="Order #" sortable style={{ width: '120px' }} />
          <Column field="customerName" header="Customer" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable style={{ width: '120px' }} />
          <Column field="priority" header="Priority" body={priorityTemplate} sortable style={{ width: '100px' }} />
          <Column field="assignedTo" header="Assigned To" sortable style={{ width: '120px' }} />
          <Column header="Progress" body={progressTemplate} style={{ width: '150px' }} />
          <Column field="estimatedCompletion" header="Est. Completion" sortable style={{ width: '140px' }}
                  body={(rowData) => rowData.estimatedCompletion?.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} />
          <Column header="Actions" body={actionTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>
    </div>
  );
}; 