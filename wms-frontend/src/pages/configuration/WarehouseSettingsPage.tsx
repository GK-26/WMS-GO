import React, { useState } from 'react';
import { InputText } from 'primereact/inputtext';
import { InputNumber } from 'primereact/inputnumber';
import { InputTextarea } from 'primereact/inputtextarea';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { InputSwitch } from 'primereact/inputswitch';

export const WarehouseSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    warehouseName: 'Main Warehouse',
    warehouseCode: 'WH001',
    address: '123 Warehouse St, City, State 12345',
    contactPhone: '+1-555-123-4567',
    contactEmail: 'warehouse@wms.com',
    operatingHours: '24/7',
    timezone: 'EST',
    enableBarcodeScanning: true,
    enableRFID: false,
    enableVoicePicking: true,
    defaultPickingMethod: 'batch',
    enableCycleCounting: true,
    cycleCountFrequency: 'weekly',
    enableQualityControl: true,
    enableCrossDocking: false,
    maxPickingTasksPerWorker: 10,
    maxPackingTasksPerWorker: 15,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    console.log('Saving warehouse settings:', settings);
    // TODO: Implement save functionality
  };

  const timezoneOptions = [
    { label: 'Eastern Time', value: 'EST' },
    { label: 'Pacific Time', value: 'PST' },
    { label: 'Central Time', value: 'CST' },
    { label: 'Mountain Time', value: 'MST' },
  ];

  const pickingMethodOptions = [
    { label: 'Batch Picking', value: 'batch' },
    { label: 'Wave Picking', value: 'wave' },
    { label: 'Zone Picking', value: 'zone' },
    { label: 'Discrete Picking', value: 'discrete' },
  ];

  const cycleCountFrequencyOptions = [
    { label: 'Daily', value: 'daily' },
    { label: 'Weekly', value: 'weekly' },
    { label: 'Monthly', value: 'monthly' },
    { label: 'Quarterly', value: 'quarterly' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Warehouse Settings</h2>
        <Button label="Save Settings" icon="pi pi-save" onClick={handleSave} />
      </div>

      <div className="space-y-4">
        {/* Basic Information */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Basic Information</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Warehouse Name</label>
              <InputText
                value={settings.warehouseName}
                onChange={(e) => handleSettingChange('warehouseName', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Warehouse Code</label>
              <InputText
                value={settings.warehouseCode}
                onChange={(e) => handleSettingChange('warehouseCode', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Address</label>
              <InputTextarea
                value={settings.address}
                onChange={(e) => handleSettingChange('address', e.target.value)}
                rows={2}
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Contact Phone</label>
                <InputText
                  value={settings.contactPhone}
                  onChange={(e) => handleSettingChange('contactPhone', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Contact Email</label>
                <InputText
                  value={settings.contactEmail}
                  onChange={(e) => handleSettingChange('contactEmail', e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Operating Hours</label>
                <InputText
                  value={settings.operatingHours}
                  onChange={(e) => handleSettingChange('operatingHours', e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Timezone</label>
                <Dropdown
                  value={settings.timezone}
                  options={timezoneOptions}
                  onChange={(e) => handleSettingChange('timezone', e.value)}
                  placeholder="Select Timezone"
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Technology Settings */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Technology Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Barcode Scanning</label>
              <InputSwitch
                checked={settings.enableBarcodeScanning}
                onChange={(e) => handleSettingChange('enableBarcodeScanning', e.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable RFID Technology</label>
              <InputSwitch
                checked={settings.enableRFID}
                onChange={(e) => handleSettingChange('enableRFID', e.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Voice Picking</label>
              <InputSwitch
                checked={settings.enableVoicePicking}
                onChange={(e) => handleSettingChange('enableVoicePicking', e.value)}
              />
            </div>
          </div>
        </Card>

        {/* Operations Settings */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Operations Settings</h3>
          <div className="space-y-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Default Picking Method</label>
              <Dropdown
                value={settings.defaultPickingMethod}
                options={pickingMethodOptions}
                onChange={(e) => handleSettingChange('defaultPickingMethod', e.value)}
                placeholder="Select Picking Method"
                className="w-full"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Max Picking Tasks per Worker</label>
                <InputNumber
                  value={settings.maxPickingTasksPerWorker}
                  onValueChange={(e) => handleSettingChange('maxPickingTasksPerWorker', e.value)}
                  min={1}
                  max={50}
                  className="w-full"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium">Max Packing Tasks per Worker</label>
                <InputNumber
                  value={settings.maxPackingTasksPerWorker}
                  onValueChange={(e) => handleSettingChange('maxPackingTasksPerWorker', e.value)}
                  min={1}
                  max={50}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Quality & Inventory Settings */}
        <Card className="p-4">
          <h3 className="text-lg font-semibold mb-4">Quality & Inventory Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Cycle Counting</label>
              <InputSwitch
                checked={settings.enableCycleCounting}
                onChange={(e) => handleSettingChange('enableCycleCounting', e.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Cycle Count Frequency</label>
              <Dropdown
                value={settings.cycleCountFrequency}
                options={cycleCountFrequencyOptions}
                onChange={(e) => handleSettingChange('cycleCountFrequency', e.value)}
                placeholder="Select Frequency"
                className="w-full"
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Quality Control</label>
              <InputSwitch
                checked={settings.enableQualityControl}
                onChange={(e) => handleSettingChange('enableQualityControl', e.value)}
              />
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Enable Cross-Docking</label>
              <InputSwitch
                checked={settings.enableCrossDocking}
                onChange={(e) => handleSettingChange('enableCrossDocking', e.value)}
              />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}; 