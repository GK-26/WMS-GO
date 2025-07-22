import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { TabView, TabPanel } from 'primereact/tabview';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  useEmailNotifications, 
  useEmailTemplates, 
  useEmailStats, 
  useSendEmail, 
  useSendTemplatedEmail, 
  useCreateEmailTemplate 
} from '../services/api';
import { formatDate } from '../utils/formatters';
import { EmailNotification, EmailTemplate, EmailStats } from '../types';

const EmailNotifications: React.FC = () => {
  const [sendEmailDialogVisible, setSendEmailDialogVisible] = useState(false);
  const [templateDialogVisible, setTemplateDialogVisible] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [emailForm, setEmailForm] = useState({
    to: '',
    subject: '',
    body: '',
    type: '',
  });
  const [templateForm, setTemplateForm] = useState({
    name: '',
    subject: '',
    body: '',
    type: '',
  });
  const toast = useRef<Toast>(null);
  const queryClient = useQueryClient();

  // Fetch email notifications
  const { data: notificationsData, isLoading: notificationsLoading } = useEmailNotifications({
    status: selectedStatus || undefined,
    type: selectedType || undefined,
    page: 1,
    limit: 100
  });

  // Fetch email templates
  const { data: templates, isLoading: templatesLoading } = useEmailTemplates();

  // Fetch email stats
  const { data: stats, isLoading: statsLoading } = useEmailStats();

  // Send email mutation
  const sendEmailMutation = useSendEmail();

  // Send templated email mutation
  const sendTemplatedEmailMutation = useSendTemplatedEmail();

  // Create template mutation
  const createTemplateMutation = useCreateEmailTemplate();

  const handleSendEmail = () => {
    if (!emailForm.to || !emailForm.subject || !emailForm.body) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    sendEmailMutation.mutate(emailForm);
  };

  const handleSendTemplatedEmail = (template: EmailTemplate) => {
    setEmailForm({
      to: '',
      subject: template.subject,
      body: template.body,
      type: template.type,
    });
    setSendEmailDialogVisible(true);
  };

  const handleCreateTemplate = () => {
    if (!templateForm.name || !templateForm.subject || !templateForm.body) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please fill in all required fields',
      });
      return;
    }

    createTemplateMutation.mutate(templateForm);
  };

  const statusBodyTemplate = (rowData: EmailNotification) => {
    const severity = rowData.status === 'sent' ? 'success' : 
                    rowData.status === 'failed' ? 'danger' : 'warning';
    return <Tag value={rowData.status} severity={severity} />;
  };

  const dateBodyTemplate = (rowData: EmailNotification) => {
    return formatDate(rowData.createdAt);
  };

  const sentDateBodyTemplate = (rowData: EmailNotification) => {
    return rowData.sentAt ? formatDate(rowData.sentAt) : '-';
  };

  const templateActionsBodyTemplate = (rowData: EmailTemplate) => {
    return (
      <div className="flex gap-2">
        <Button
          label="Use Template"
          icon="pi pi-send"
          className="p-button-sm p-button-outlined"
          onClick={() => handleSendTemplatedEmail(rowData)}
        />
      </div>
    );
  };

  const typeOptions = [
    { label: 'All Types', value: '' },
    { label: 'Order Notification', value: 'order' },
    { label: 'Task Assignment', value: 'task' },
    { label: 'System Alert', value: 'alert' },
    { label: 'General', value: 'general' },
  ];

  const statusOptions = [
    { label: 'All Statuses', value: '' },
    { label: 'Pending', value: 'pending' },
    { label: 'Sent', value: 'sent' },
    { label: 'Failed', value: 'failed' },
  ];

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Email Notifications</h1>
          <p className="text-gray-600 mt-2">Manage email templates and send notifications</p>
        </div>
        <div className="flex gap-2">
          <Button
            label="Send Email"
            icon="pi pi-send"
            onClick={() => setSendEmailDialogVisible(true)}
            className="p-button-primary"
          />
          <Button
            label="Create Template"
            icon="pi pi-plus"
            onClick={() => setTemplateDialogVisible(true)}
            className="p-button-outlined"
          />
        </div>
      </div>

      {/* Stats Cards */}
      {!statsLoading && stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.data.total}</div>
              <div className="text-sm text-gray-600">Total Emails</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{stats.data.sent}</div>
              <div className="text-sm text-gray-600">Sent</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{stats.data.failed}</div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
          </Card>
          <Card>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.data.pending}</div>
              <div className="text-sm text-gray-600">Pending</div>
            </div>
          </Card>
        </div>
      )}

      <TabView>
        <TabPanel header="Email History">
          {/* Filters */}
          <Card className="mb-6">
            <div className="flex gap-4 items-center">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <Dropdown
                  value={selectedStatus}
                  options={statusOptions}
                  onChange={(e) => setSelectedStatus(e.value)}
                  placeholder="Select status"
                  className="w-full"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <Dropdown
                  value={selectedType}
                  options={typeOptions}
                  onChange={(e) => setSelectedType(e.value)}
                  placeholder="Select type"
                  className="w-full"
                />
              </div>
              <div className="flex items-end">
                <Button
                  label="Clear Filters"
                  icon="pi pi-times"
                  className="p-button-outlined"
                  onClick={() => {
                    setSelectedStatus('');
                    setSelectedType('');
                  }}
                />
              </div>
            </div>
          </Card>

          {/* Notifications Table */}
          <Card>
            {notificationsLoading ? (
              <div className="flex justify-center items-center h-64">
                <ProgressSpinner />
              </div>
            ) : (
              <DataTable
                value={notificationsData?.data?.data || []}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                className="p-datatable-sm"
                emptyMessage="No email notifications found"
              >
                <Column field="to" header="To" />
                <Column field="subject" header="Subject" />
                <Column field="type" header="Type" />
                <Column field="status" header="Status" body={statusBodyTemplate} />
                <Column field="createdAt" header="Created" body={dateBodyTemplate} sortable />
                <Column field="sentAt" header="Sent" body={sentDateBodyTemplate} sortable />
                <Column field="error" header="Error" />
              </DataTable>
            )}
          </Card>
        </TabPanel>

        <TabPanel header="Email Templates">
          <Card>
            {templatesLoading ? (
              <div className="flex justify-center items-center h-64">
                <ProgressSpinner />
              </div>
            ) : (
              <DataTable
                value={templates?.data || []}
                paginator
                rows={10}
                rowsPerPageOptions={[10, 20, 50]}
                className="p-datatable-sm"
                emptyMessage="No email templates found"
              >
                <Column field="name" header="Template Name" />
                <Column field="subject" header="Subject" />
                <Column field="type" header="Type" />
                <Column field="isActive" header="Active" body={(rowData) => (
                  <Tag value={rowData.isActive ? 'Active' : 'Inactive'} 
                       severity={rowData.isActive ? 'success' : 'secondary'} />
                )} />
                <Column header="Actions" body={templateActionsBodyTemplate} style={{ width: '150px' }} />
              </DataTable>
            )}
          </Card>
        </TabPanel>
      </TabView>

      {/* Send Email Dialog */}
      <Dialog
        header="Send Email"
        visible={sendEmailDialogVisible}
        onHide={() => setSendEmailDialogVisible(false)}
        style={{ width: '600px' }}
        modal
        className="p-fluid"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To Email *
            </label>
            <InputText
              value={emailForm.to}
              onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
              placeholder="recipient@example.com"
              type="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <InputText
              value={emailForm.subject}
              onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Dropdown
              value={emailForm.type}
              options={typeOptions.slice(1)} // Remove "All Types"
              onChange={(e) => setEmailForm({ ...emailForm, type: e.value })}
              placeholder="Select type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <InputTextarea
              value={emailForm.body}
              onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
              placeholder="Email message"
              rows={8}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={() => setSendEmailDialogVisible(false)}
            className="p-button-outlined"
          />
          <Button
            label="Send Email"
            icon="pi pi-send"
            onClick={handleSendEmail}
            loading={sendEmailMutation.isPending}
            disabled={sendEmailMutation.isPending}
          />
        </div>
      </Dialog>

      {/* Create Template Dialog */}
      <Dialog
        header="Create Email Template"
        visible={templateDialogVisible}
        onHide={() => setTemplateDialogVisible(false)}
        style={{ width: '600px' }}
        modal
        className="p-fluid"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <InputText
              value={templateForm.name}
              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
              placeholder="Template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <InputText
              value={templateForm.subject}
              onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
              placeholder="Email subject"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Dropdown
              value={templateForm.type}
              options={typeOptions.slice(1)} // Remove "All Types"
              onChange={(e) => setTemplateForm({ ...templateForm, type: e.value })}
              placeholder="Select type"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Body *
            </label>
            <InputTextarea
              value={templateForm.body}
              onChange={(e) => setTemplateForm({ ...templateForm, body: e.target.value })}
              placeholder="Email template body (use {{variable}} for placeholders)"
              rows={8}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={() => setTemplateDialogVisible(false)}
            className="p-button-outlined"
          />
          <Button
            label="Create Template"
            icon="pi pi-plus"
            onClick={handleCreateTemplate}
            loading={createTemplateMutation.isPending}
            disabled={createTemplateMutation.isPending}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default EmailNotifications; 