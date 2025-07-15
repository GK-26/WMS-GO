import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dialog } from 'primereact/dialog';
import { InputTextarea } from 'primereact/inputtextarea';

interface QualityItem {
  id: string;
  sku: string;
  name: string;
  asnNumber: string;
  receivedQty: number;
  status: 'pending' | 'approved' | 'rejected' | 'quarantine';
  inspector?: string;
  notes?: string;
}

export const QualityCheckPage: React.FC = () => {
  const [selectedItem, setSelectedItem] = useState<QualityItem | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [inspectionNotes, setInspectionNotes] = useState('');

  const mockQualityItems: QualityItem[] = [
    {
      id: '1',
      sku: 'ABC-123',
      name: 'Laptop Computer',
      asnNumber: 'ASN-001',
      receivedQty: 50,
      status: 'pending',
    },
    {
      id: '2',
      sku: 'XYZ-789',
      name: 'Wireless Mouse',
      asnNumber: 'ASN-001',
      receivedQty: 100,
      status: 'pending',
    },
    {
      id: '3',
      sku: 'DEF-456',
      name: 'Office Chair',
      asnNumber: 'ASN-002',
      receivedQty: 25,
      status: 'approved',
      inspector: 'John Doe',
      notes: 'All items in good condition',
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      case 'quarantine':
        return 'warning';
      default:
        return 'secondary';
    }
  };

  const handleInspect = (item: QualityItem) => {
    setSelectedItem(item);
    setInspectionNotes(item.notes || '');
    setOpenDialog(true);
  };

  const handleApprove = () => {
    if (selectedItem) {
      // TODO: Implement approve functionality
      console.log('Approving item:', selectedItem.sku);
    }
    setOpenDialog(false);
  };

  const handleReject = () => {
    if (selectedItem) {
      // TODO: Implement reject functionality
      console.log('Rejecting item:', selectedItem.sku);
    }
    setOpenDialog(false);
  };

  const handleQuarantine = () => {
    if (selectedItem) {
      // TODO: Implement quarantine functionality
      console.log('Quarantining item:', selectedItem.sku);
    }
    setOpenDialog(false);
  };

  const statusTemplate = (rowData: QualityItem) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const actionsTemplate = (rowData: QualityItem) => (
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
          />
          <Button
            label="Reject"
            outlined
            severity="danger"
            icon="pi pi-times"
            onClick={handleReject}
          />
          <Button
            label="Approve"
            severity="success"
            icon="pi pi-check"
            onClick={handleApprove}
          />
        </>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Quality Check</h2>

      <Card>
        <DataTable 
          value={mockQualityItems}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="sku" header="SKU" sortable />
          <Column field="name" header="Product Name" sortable />
          <Column field="asnNumber" header="ASN #" sortable />
          <Column field="receivedQty" header="Received Qty" sortable />
          <Column field="status" header="Status" body={statusTemplate} sortable />
          <Column 
            field="inspector" 
            header="Inspector" 
            body={(rowData) => rowData.inspector || '-'}
            sortable 
          />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      {/* Inspection Dialog */}
      <Dialog 
        visible={openDialog} 
        onHide={() => setOpenDialog(false)} 
        header={`Quality Inspection - ${selectedItem?.name}`}
        footer={dialogFooter}
        style={{ width: '50vw' }}
        modal
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">SKU:</label>
              <div className="text-sm">{selectedItem?.sku}</div>
            </div>
            <div>
              <label className="text-sm font-medium">ASN:</label>
              <div className="text-sm">{selectedItem?.asnNumber}</div>
            </div>
            <div>
              <label className="text-sm font-medium">Quantity:</label>
              <div className="text-sm">{selectedItem?.receivedQty}</div>
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