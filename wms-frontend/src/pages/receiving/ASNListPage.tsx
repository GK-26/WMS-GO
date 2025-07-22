import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';
import { Paginator } from 'primereact/paginator';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Message } from 'primereact/message';
import { useASNs, useReceiveASNItem } from '../../services/api';
import { ASN } from '../../types';

export const ASNListPage: React.FC = () => {
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // API hooks
  const { data: asnResponse, isLoading, error, refetch } = useASNs({
    page: currentPage,
    limit: rows,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const receiveASNItemMutation = useReceiveASNItem();

  const asns = asnResponse?.data?.data || [];
  const totalRecords = asnResponse?.data?.pagination?.total || 0;

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'pending':
        return 'info';
      case 'received':
        return 'success';
      case 'partial':
        return 'warning';
      case 'overdue':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const handleReceive = async (asn: ASN) => {
    try {
      await receiveASNItemMutation.mutateAsync({
        id: asn.id,
        data: {
          itemId: '', // This would need to be implemented with item selection
          quantity: 0, // This would need to be implemented with quantity input
        }
      });
      console.log(`ASN ${asn.asnNumber} received successfully`);
      refetch();
    } catch (error) {
      console.error('Failed to receive ASN');
      console.error('Error receiving ASN:', error);
    }
  };

  const handleQualityCheck = (asn: ASN) => {
    // TODO: Navigate to quality check page
    console.log('Quality check for ASN:', asn.asnNumber);
  };

  const expectedDateTemplate = (rowData: ASN) => (
    <div>
      <div>{new Date(rowData.expectedArrivalDate).toLocaleDateString()}</div>
      {new Date(rowData.expectedArrivalDate) < new Date() && rowData.status !== 'received' && (
        <div className="text-red-500 text-sm">Overdue</div>
      )}
    </div>
  );

  const statusTemplate = (rowData: ASN) => (
    <Tag 
      value={rowData.status} 
      severity={getStatusSeverity(rowData.status)}
    />
  );

  const progressTemplate = (rowData: ASN) => (
    <div>
      <div>{rowData.receivedItems} / {rowData.totalItems}</div>
      <div className="text-sm text-gray-500">
        {Math.round((rowData.receivedItems / rowData.totalItems) * 100)}%
      </div>
    </div>
  );

  const actionsTemplate = (rowData: ASN) => (
    <div className="flex gap-2">
      <Button 
        icon="pi pi-check" 
        size="small" 
        text 
        severity="success"
        disabled={rowData.status === 'received' || receiveASNItemMutation.isPending}
        loading={receiveASNItemMutation.isPending}
        onClick={() => handleReceive(rowData)}
      />
      <Button 
        icon="pi pi-exclamation-triangle" 
        size="small" 
        text 
        severity="warning"
        onClick={() => handleQualityCheck(rowData)}
      />
      <Button icon="pi pi-eye" size="small" text severity="info" />
    </div>
  );

  const statusOptions = [
    { label: 'All Status', value: 'all' },
    { label: 'Pending', value: 'pending' },
    { label: 'Received', value: 'received' },
    { label: 'Partial', value: 'partial' },
    { label: 'Overdue', value: 'overdue' },
  ];

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setCurrentPage(Math.floor(event.first / event.rows) + 1);
  };

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Advance Shipping Notices (ASN)</h2>
        <Message 
          severity="error" 
          text="Failed to load ASN data. Please try again." 
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
        <h2 className="text-2xl font-bold">Advance Shipping Notices (ASN)</h2>
        <Dropdown
          value={statusFilter}
          options={statusOptions}
          onChange={(e) => setStatusFilter(e.value)}
          placeholder="Select Status"
          className="w-48"
        />
      </div>

      <Card>
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <ProgressSpinner />
          </div>
        ) : (
          <>
            <DataTable 
              value={asns}
              paginator={false}
              stripedRows
              showGridlines
              className="w-full"
            >
              <Column field="asnNumber" header="ASN #" sortable />
              <Column field="supplierId" header="Supplier" sortable />
              <Column field="expectedArrivalDate" header="Expected Date" body={expectedDateTemplate} sortable />
              <Column field="status" header="Status" body={statusTemplate} sortable />
              <Column field="receivedItems" header="Progress" body={progressTemplate} sortable />
              <Column 
                field="notes" 
                header="Notes" 
                body={(rowData) => rowData.notes || 'No notes'}
                sortable 
              />
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