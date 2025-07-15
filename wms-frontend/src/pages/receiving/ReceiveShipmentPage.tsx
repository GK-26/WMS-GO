import React, { useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { Tag } from 'primereact/tag';
import { Card } from 'primereact/card';
import { Dropdown } from 'primereact/dropdown';

interface ReceivedItem {
  sku: string;
  name: string;
  expectedQty: number;
  receivedQty: number;
  status: 'pending' | 'received' | 'short' | 'over';
}

export const ReceiveShipmentPage: React.FC = () => {
  const [asnNumber, setAsnNumber] = useState('');
  const [dockDoor, setDockDoor] = useState('');
  const [scannedItems, setScannedItems] = useState<ReceivedItem[]>([
    {
      sku: 'ABC-123',
      name: 'Laptop Computer',
      expectedQty: 50,
      receivedQty: 0,
      status: 'pending',
    },
    {
      sku: 'XYZ-789',
      name: 'Wireless Mouse',
      expectedQty: 100,
      receivedQty: 0,
      status: 'pending',
    },
  ]);

  const handleScan = () => {
    // TODO: Implement barcode scanning
    console.log('Scanning item...');
  };

  const handleReceive = () => {
    // TODO: Implement receive functionality
    console.log('Receiving shipment...');
  };

  const getItemStatus = (item: ReceivedItem) => {
    if (item.receivedQty === 0) return 'pending';
    if (item.receivedQty === item.expectedQty) return 'received';
    if (item.receivedQty < item.expectedQty) return 'short';
    return 'over';
  };

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'received':
        return 'success';
      case 'short':
        return 'warning';
      case 'over':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const receivedQtyTemplate = (rowData: ReceivedItem) => (
    <InputNumber
      value={rowData.receivedQty}
      onValueChange={(e) => {
        const newQty = e.value || 0;
        setScannedItems(prev =>
          prev.map(i =>
            i.sku === rowData.sku
              ? { ...i, receivedQty: newQty }
              : i
          )
        );
      }}
      min={0}
      max={rowData.expectedQty * 2}
      showButtons
      buttonLayout="horizontal"
      style={{ width: '100px' }}
      decrementButtonClassName="p-button-secondary"
      incrementButtonClassName="p-button-secondary"
    />
  );

  const statusTemplate = (rowData: ReceivedItem) => {
    const status = getItemStatus(rowData);
    return (
      <Tag 
        value={status} 
        severity={getStatusSeverity(status)}
      />
    );
  };

  const actionsTemplate = (rowData: ReceivedItem) => (
    <Button
      label="Receive All"
      size="small"
      outlined
      onClick={() => {
        setScannedItems(prev =>
          prev.map(i =>
            i.sku === rowData.sku
              ? { ...i, receivedQty: rowData.expectedQty }
              : i
          )
        );
      }}
    />
  );

  const dockDoorOptions = [
    { label: 'Dock 1', value: 'dock1' },
    { label: 'Dock 2', value: 'dock2' },
    { label: 'Dock 3', value: 'dock3' },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Receive Shipment</h2>

      <Card className="p-4">
        <h3 className="text-lg font-semibold mb-4">Shipment Details</h3>
        <div className="flex gap-4 flex-wrap items-end">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">ASN Number</label>
            <InputText
              value={asnNumber}
              onChange={(e) => setAsnNumber(e.target.value)}
              placeholder="Enter ASN Number"
              className="w-48"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Dock Door</label>
            <Dropdown
              value={dockDoor}
              options={dockDoorOptions}
              onChange={(e) => setDockDoor(e.value)}
              placeholder="Select Dock Door"
              className="w-48"
            />
          </div>
          <Button
            label="Scan Item"
            icon="pi pi-qrcode"
            onClick={handleScan}
          />
        </div>
      </Card>

      <Card>
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Items to Receive</h3>
        </div>
        <DataTable 
          value={scannedItems}
          stripedRows
          showGridlines
          className="w-full"
        >
          <Column field="sku" header="SKU" sortable />
          <Column field="name" header="Product Name" sortable />
          <Column field="expectedQty" header="Expected Qty" sortable />
          <Column field="receivedQty" header="Received Qty" body={receivedQtyTemplate} />
          <Column field="status" header="Status" body={statusTemplate} />
          <Column header="Actions" body={actionsTemplate} style={{ width: '120px' }} />
        </DataTable>
      </Card>

      <div className="flex justify-end gap-2">
        <Button label="Save Draft" outlined />
        <Button
          label="Complete Receipt"
          onClick={handleReceive}
          disabled={scannedItems.some(item => item.receivedQty === 0)}
        />
      </div>
    </div>
  );
}; 