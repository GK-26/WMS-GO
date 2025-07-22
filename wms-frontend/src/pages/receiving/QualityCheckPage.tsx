import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useQualityChecks, useUpdateQualityCheck } from '../../services/api';
import { QualityCheck } from '../../types';

export const QualityCheckPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<QualityCheck | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  // API hooks
  const { data: qualityResponse, isLoading, error, refetch } = useQualityChecks();
  const updateQualityCheckMutation = useUpdateQualityCheck();

  const qualityItems = qualityResponse?.data?.data || [];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'passed':
        return 'success';
      case 'failed':
        return 'danger';
      case 'quarantine':
        return 'warning';
      case 'in_progress':
        return 'info';
      default:
        return 'secondary';
    }
  };

  const handleInspect = (item: QualityCheck) => {
    setSelectedItem(item);
    setInspectionNotes(item.result?.notes || '');
    setOpenDialog(true);
  };

  const handleApprove = async () => {
    if (selectedItem) {
      try {
        await updateQualityCheckMutation.mutateAsync({
          id: selectedItem.id,
          data: {
            status: 'passed',
            result: {
              passed: true,
              defects: [],
              notes: inspectionNotes,
            },
          },
        });
        console.log('Quality check approved for:', selectedItem.checkNumber);
        setOpenDialog(false);
        refetch();
      } catch (error) {
        console.error('Failed to approve quality check:', error);
      }
    }
  };

  const handleReject = async () => {
    if (selectedItem) {
      try {
        await updateQualityCheckMutation.mutateAsync({
          id: selectedItem.id,
          data: {
            status: 'failed',
            result: {
              passed: false,
              defects: ['Quality standards not met'],
              notes: inspectionNotes,
            },
          },
        });
        console.log('Quality check rejected for:', selectedItem.checkNumber);
        setOpenDialog(false);
        refetch();
      } catch (error) {
        console.error('Failed to reject quality check:', error);
      }
    }
  };

  const handleQuarantine = async () => {
    if (selectedItem) {
      try {
        await updateQualityCheckMutation.mutateAsync({
          id: selectedItem.id,
          data: {
            status: 'quarantine',
            result: {
              passed: false,
              defects: ['Item quarantined for further inspection'],
              notes: inspectionNotes,
            },
          },
        });
        console.log('Quality check quarantined for:', selectedItem.checkNumber);
        setOpenDialog(false);
        refetch();
      } catch (error) {
        console.error('Failed to quarantine quality check:', error);
      }
    }
  };

  const statusTemplate = (rowData: QualityCheck) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const actionsTemplate = (rowData: QualityCheck) => (
    <Button
      label={rowData.status === 'pending' ? 'Inspect' : 'View Details'}
      size="small"
      outlined
      onClick={() => handleInspect(rowData)}
    />
  );

  const dialogFooter = (
    <div className="flex gap-2">
      <Button label="Cancel" outlined onClick={() => setOpenDialog(false)} />
      {selectedItem?.status === 'pending' && (
        <>
          <Button
            label="Quarantine"
            outlined
            severity="warning"
            onClick={handleQuarantine}
            loading={updateQualityCheckMutation.isPending}
          />
          <Button
            label="Reject"
            outlined
            severity="danger"
            icon="pi pi-times"
            onClick={handleReject}
            loading={updateQualityCheckMutation.isPending}
          />
          <Button
            label="Approve"
            severity="success"
            icon="pi pi-check"
            onClick={handleApprove}
            loading={updateQualityCheckMutation.isPending}
          />
        </>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Quality Check</h2>
        <Message 
          severity="error" 
          text="Failed to load quality check data. Please try again." 
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
      <h2 className="text-2xl font-bold">Quality Check</h2>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <DataTable 
            value={qualityItems}
            stripedRows
            showGridlines
            className="w-full"
          >
            <Column field="checkNumber" header="Check #" sortable />
            <Column 
              field="productId" 
              header="Product" 
              body={(rowData) => rowData.product?.name || rowData.productId}
              sortable 
            />
            <Column 
              field="asnId" 
              header="ASN #" 
              body={(rowData) => rowData.asnId || '-'}
              sortable 
            />
            <Column field="type" header="Type" sortable />
            <Column field="status" header="Status" body={statusTemplate} sortable />
            <Column 
              field="inspectorId" 
              header="Inspector" 
              body={(rowData) => rowData.inspectorId || '-'}
              sortable 
            />
            <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
          </DataTable>
        )}
      </Card>

      {/* Inspection Dialog */}
      <Dialog 
        visible={openDialog} 
        onHide={() => setOpenDialog(false)} 
        header={`Quality Inspection - ${selectedItem?.product?.name || selectedItem?.checkNumber}`}
        footer={dialogFooter}
        style={{ width: '50vw' }}
        modal
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Check #:</label>
              <div className="text-sm">{selectedItem?.checkNumber}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Product:</label>
              <div className="text-sm">{selectedItem?.product?.name || selectedItem?.productId}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Type:</label>
              <div className="text-sm">{selectedItem?.type}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Status:</label>
              <div className="text-sm">{selectedItem?.status}</div>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium block mb-2">Inspection Notes</label>
            <InputTextarea
              value={inspectionNotes}
              onChange={(e) => setInspectionNotes(e.target.value)}
              rows={4}
              className="w-full"
              placeholder="Enter inspection notes..."
            />
          </div>
        </div>
      </Dialog>
    </div>
  );
}; 