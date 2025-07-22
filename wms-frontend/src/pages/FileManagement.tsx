import React, { useState, useRef } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Dialog } from 'primereact/dialog';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { FileUpload } from 'primereact/fileupload';
import { Toast } from 'primereact/toast';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useFiles, useFileCategories, useUploadFile, useDeleteFile } from '../services/api';
import { formatBytes, formatDate } from '../utils/formatters';
import { FileUpload as FileUploadType, FileCategory } from '../types';

const FileManagement: React.FC = () => {
  const [uploadDialogVisible, setUploadDialogVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const fileUploadRef = useRef<FileUpload>(null);
  const toast = useRef<Toast>(null);

  // Fetch files
  const { data: filesData, isLoading: filesLoading, error: filesError } = useFiles({
    category: selectedCategory || undefined,
    page: 1,
    limit: 100
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useFileCategories();

  // Upload file mutation
  const uploadMutation = useUploadFile();

  // Delete file mutation
  const deleteMutation = useDeleteFile();

  const handleUpload = () => {
    if (!fileUploadRef.current?.getFiles().length) {
      toast.current?.show({
        severity: 'warn',
        summary: 'Warning',
        detail: 'Please select a file to upload',
      });
      return;
    }

    const file = fileUploadRef.current.getFiles()[0];
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', selectedCategory);
    formData.append('description', description);

    setUploading(true);
    uploadMutation.mutate(formData, {
      onSettled: () => setUploading(false),
      onSuccess: () => {
        setUploadDialogVisible(false);
        setDescription('');
        setSelectedCategory('');
        if (fileUploadRef.current) {
          fileUploadRef.current.clear();
        }
        toast.current?.show({
          severity: 'success',
          summary: 'Success',
          detail: 'File uploaded successfully',
        });
      },
      onError: (error: any) => {
        toast.current?.show({
          severity: 'error',
          summary: 'Error',
          detail: error.response?.data?.error || 'Failed to upload file',
        });
      },
    });
  };

  const handleDownload = (fileId: string, originalName: string) => {
    window.open(`http://localhost:8080/api/v1/files/${fileId}/download`, '_blank');
  };

  const handleDelete = (fileId: string) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteMutation.mutate(fileId, {
        onSuccess: () => {
          toast.current?.show({
            severity: 'success',
            summary: 'Success',
            detail: 'File deleted successfully',
          });
        },
        onError: (error: any) => {
          toast.current?.show({
            severity: 'error',
            summary: 'Error',
            detail: error.response?.data?.error || 'Failed to delete file',
          });
        },
      });
    }
  };

  const categoryOptions = categories?.data?.map((cat: FileCategory) => ({
    label: `${cat._id} (${cat.count})`,
    value: cat._id,
  })) || [];

  const statusBodyTemplate = (rowData: FileUploadType) => {
    const isImage = rowData.contentType.startsWith('image/');
    const isDocument = rowData.contentType.includes('pdf') || 
                      rowData.contentType.includes('word') || 
                      rowData.contentType.includes('excel');
    
    let icon = 'pi-file';
    if (isImage) icon = 'pi-image';
    else if (isDocument) icon = 'pi-file-pdf';

    return <i className={`pi ${icon}`} style={{ fontSize: '1.2rem' }}></i>;
  };

  const sizeBodyTemplate = (rowData: FileUploadType) => {
    return formatBytes(rowData.size);
  };

  const dateBodyTemplate = (rowData: FileUploadType) => {
    return formatDate(rowData.uploadedAt);
  };

  const categoryBodyTemplate = (rowData: FileUploadType) => {
    return <Tag value={rowData.category} severity="info" />;
  };

  const actionsBodyTemplate = (rowData: FileUploadType) => {
    return (
      <div className="flex gap-2">
        <Button
          icon="pi pi-download"
          className="p-button-sm p-button-outlined"
          onClick={() => handleDownload(rowData.id, rowData.originalName)}
          tooltip="Download"
        />
        <Button
          icon="pi pi-trash"
          className="p-button-sm p-button-outlined p-button-danger"
          onClick={() => handleDelete(rowData.id)}
          tooltip="Delete"
        />
      </div>
    );
  };

  if (filesError) {
    return (
      <div className="flex justify-center items-center h-64">
        <Card className="w-full max-w-md">
          <div className="text-center">
            <i className="pi pi-exclamation-triangle text-6xl text-red-500 mb-4"></i>
            <h2 className="text-xl font-semibold mb-2">Error Loading Files</h2>
            <p className="text-gray-600 mb-4">
              {filesError instanceof Error ? filesError.message : 'Failed to load files'}
            </p>
            <Button 
              label="Retry" 
              icon="pi pi-refresh" 
              onClick={() => window.location.reload()}
            />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Toast ref={toast} />
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
          <p className="text-gray-600 mt-2">Upload, manage, and organize your files</p>
        </div>
        <Button
          label="Upload File"
          icon="pi pi-upload"
          onClick={() => setUploadDialogVisible(true)}
          className="p-button-primary"
        />
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex gap-4 items-center">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Category
            </label>
            <Dropdown
              value={selectedCategory}
              options={[{ label: 'All Categories', value: '' }, ...categoryOptions]}
              onChange={(e) => setSelectedCategory(e.value)}
              placeholder="Select category"
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              label="Clear Filters"
              icon="pi pi-times"
              className="p-button-outlined"
              onClick={() => setSelectedCategory('')}
            />
          </div>
        </div>
      </Card>

      {/* Files Table */}
      <Card>
        {filesLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable
            value={filesData?.data?.data || []}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 20, 50]}
            className="p-datatable-sm"
            emptyMessage="No files found"
            loading={filesLoading}
          >
            <Column field="originalName" header="File Name" sortable />
            <Column field="contentType" header="Type" body={statusBodyTemplate} />
            <Column field="size" header="Size" body={sizeBodyTemplate} sortable />
            <Column field="category" header="Category" body={categoryBodyTemplate} sortable />
            <Column field="uploadedAt" header="Uploaded" body={dateBodyTemplate} sortable />
            <Column field="description" header="Description" />
            <Column header="Actions" body={actionsBodyTemplate} style={{ width: '120px' }} />
          </DataTable>
        )}
      </Card>

      {/* Upload Dialog */}
      <Dialog
        header="Upload File"
        visible={uploadDialogVisible}
        onHide={() => setUploadDialogVisible(false)}
        style={{ width: '500px' }}
        modal
        className="p-fluid"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select File
            </label>
            <FileUpload
              ref={fileUploadRef}
              name="file"
              url="/api/upload"
              accept="*/*"
              maxFileSize={32000000}
              customUpload
              uploadHandler={() => {}}
              auto
              chooseLabel="Choose File"
              cancelLabel="Cancel"
              emptyTemplate={
                <p className="m-0">Drag and drop files here to upload.</p>
              }
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <Dropdown
              value={selectedCategory}
              options={categoryOptions}
              onChange={(e) => setSelectedCategory(e.value)}
              placeholder="Select category"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <InputText
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter file description"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <Button
            label="Cancel"
            icon="pi pi-times"
            onClick={() => setUploadDialogVisible(false)}
            className="p-button-outlined"
          />
          <Button
            label="Upload"
            icon="pi pi-upload"
            onClick={handleUpload}
            loading={uploading}
            disabled={uploading}
          />
        </div>
      </Dialog>
    </div>
  );
};

export default FileManagement; 