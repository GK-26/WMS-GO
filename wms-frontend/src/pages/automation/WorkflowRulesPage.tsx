import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { useWorkflowRules, useCreateWorkflowRule, useUpdateWorkflowRule, useDeleteWorkflowRule } from '../../services/api';
import { WorkflowRule } from '../../types';

export const WorkflowRulesPage: React.FC = () => {
  const [selectedRule, setSelectedRule] = useState<WorkflowRule | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    trigger: '',
    conditions: {} as Record<string, any>,
    actions: [] as Record<string, any>[],
    priority: 1,
  });

  // API hooks
  const { data: rulesResponse, isLoading, error, refetch } = useWorkflowRules();
  const createRuleMutation = useCreateWorkflowRule();
  const updateRuleMutation = useUpdateWorkflowRule();
  const deleteRuleMutation = useDeleteWorkflowRule();

  const workflowRules = rulesResponse?.data?.data || [];

  const getPrioritySeverity = (priority: number) => {
    if (priority >= 8) return 'danger';
    if (priority >= 5) return 'warning';
    return 'info';
  };

  const getStatusSeverity = (isActive: boolean) => {
    return isActive ? 'success' : 'secondary';
  };

  const priorityTemplate = (rowData: WorkflowRule) => (
    <Tag 
      value={`Priority ${rowData.priority}`} 
      severity={getPrioritySeverity(rowData.priority)}
    />
  );

  const statusTemplate = (rowData: WorkflowRule) => (
    <Tag 
      value={rowData.isActive ? 'Active' : 'Inactive'} 
      severity={getStatusSeverity(rowData.isActive)}
    />
  );

  const actionsTemplate = (rowData: WorkflowRule) => (
    <div className="flex gap-2">
      <Button 
        icon="pi pi-pencil" 
        size="small" 
        text 
        severity="secondary"
        onClick={() => handleEdit(rowData)}
      />
      <Button 
        icon={rowData.isActive ? "pi pi-pause" : "pi pi-play"} 
        size="small" 
        text 
        severity={rowData.isActive ? "warning" : "success"}
        onClick={() => handleToggleStatus(rowData)}
      />
      <Button 
        icon="pi pi-trash" 
        size="small" 
        text 
        severity="danger"
        onClick={() => handleDelete(rowData)}
      />
    </div>
  );

  const handleCreate = () => {
    setIsEditMode(false);
    setFormData({
      name: '',
      description: '',
      trigger: '',
      conditions: {},
      actions: [],
      priority: 1,
    });
    setOpenDialog(true);
  };

  const handleEdit = (rule: WorkflowRule) => {
    setIsEditMode(true);
    setSelectedRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description,
      trigger: rule.trigger,
      conditions: rule.conditions,
      actions: rule.actions,
      priority: rule.priority,
    });
    setOpenDialog(true);
  };

  const handleToggleStatus = async (rule: WorkflowRule) => {
    try {
      await updateRuleMutation.mutateAsync({
        id: rule.id,
        data: { isActive: !rule.isActive },
      });
      console.log(`Rule ${rule.name} ${rule.isActive ? 'deactivated' : 'activated'}`);
      refetch();
    } catch (error) {
      console.error('Failed to toggle rule status:', error);
    }
  };

  const handleDelete = async (rule: WorkflowRule) => {
    if (window.confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      try {
        await deleteRuleMutation.mutateAsync(rule.id);
        console.log(`Rule ${rule.name} deleted`);
        refetch();
      } catch (error) {
        console.error('Failed to delete rule:', error);
      }
    }
  };

  const handleSave = async () => {
    try {
      if (isEditMode && selectedRule) {
        await updateRuleMutation.mutateAsync({
          id: selectedRule.id,
          data: formData,
        });
        console.log(`Rule ${formData.name} updated`);
      } else {
        await createRuleMutation.mutateAsync(formData);
        console.log(`Rule ${formData.name} created`);
      }
      setOpenDialog(false);
      refetch();
    } catch (error) {
      console.error('Failed to save rule:', error);
    }
  };

  const priorityOptions = [
    { label: 'Low (1)', value: 1 },
    { label: 'Medium (5)', value: 5 },
    { label: 'High (8)', value: 8 },
    { label: 'Critical (10)', value: 10 },
  ];

  const triggerOptions = [
    { label: 'Inventory Level Below Threshold', value: 'inventory_low' },
    { label: 'New Order Created', value: 'order_created' },
    { label: 'Shipment Received', value: 'shipment_received' },
    { label: 'Task Completed', value: 'task_completed' },
    { label: 'Worker Available', value: 'worker_available' },
  ];

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Workflow Rules</h2>
        <Message 
          severity="error" 
          text="Failed to load workflow rules. Please try again." 
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
        <h2 className="text-2xl font-bold">Workflow Rules</h2>
        <Button 
          label="Create Rule" 
          icon="pi pi-plus" 
          onClick={handleCreate}
        />
      </div>
      
      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable 
            value={workflowRules}
            stripedRows
            showGridlines
            className="w-full"
          >
            <Column field="name" header="Rule Name" sortable />
            <Column field="description" header="Description" sortable />
            <Column field="trigger" header="Trigger" sortable />
            <Column field="priority" header="Priority" body={priorityTemplate} sortable />
            <Column field="isActive" header="Status" body={statusTemplate} sortable />
            <Column header="Actions" body={actionsTemplate} style={{ width: '150px' }} />
          </DataTable>
        )}
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog 
        visible={openDialog} 
        onHide={() => setOpenDialog(false)} 
        header={isEditMode ? "Edit Workflow Rule" : "Create Workflow Rule"}
        style={{ width: '50vw' }}
        modal
        footer={
          <div className="flex gap-2">
            <Button label="Cancel" outlined onClick={() => setOpenDialog(false)} />
            <Button 
              label="Save" 
              onClick={handleSave}
              loading={createRuleMutation.isPending || updateRuleMutation.isPending}
            />
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Rule Name</label>
            <InputText
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full"
              placeholder="Enter rule name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <InputTextarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full"
              placeholder="Enter rule description"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Trigger</label>
            <Dropdown
              value={formData.trigger}
              options={triggerOptions}
              onChange={(e) => setFormData({ ...formData, trigger: e.value })}
              placeholder="Select trigger"
              className="w-full"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <Dropdown
              value={formData.priority}
              options={priorityOptions}
              onChange={(e) => setFormData({ ...formData, priority: e.value })}
              placeholder="Select priority"
              className="w-full"
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}; 