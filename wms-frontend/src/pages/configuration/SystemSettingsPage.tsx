import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState({
    companyName: 'WMS System Inc.',
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY',
    timeFormat: '12h',
    language: 'en',
    enableNotifications: true,
    enableAuditLog: true,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    enableTwoFactor: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSave = () => {
    console.log('Saving settings:', settings);
    // TODO: Implement save functionality
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">System Settings</Typography>
        <Button
          variant="contained"
          startIcon={<SaveIcon />}
          onClick={handleSave}
        >
          Save Settings
        </Button>
      </Box>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {/* General Settings */}
        <Box sx={{ display: 'flex', gap: 3 }}>
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              General Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Company Name"
                value={settings.companyName}
                onChange={(e) => handleSettingChange('companyName', e.target.value)}
                fullWidth
              />
              <FormControl fullWidth>
                <InputLabel>Timezone</InputLabel>
                <Select
                  value={settings.timezone}
                  label="Timezone"
                  onChange={(e) => handleSettingChange('timezone', e.target.value)}
                >
                  <MenuItem value="UTC">UTC</MenuItem>
                  <MenuItem value="EST">Eastern Time</MenuItem>
                  <MenuItem value="PST">Pacific Time</MenuItem>
                  <MenuItem value="GMT">GMT</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Date Format</InputLabel>
                <Select
                  value={settings.dateFormat}
                  label="Date Format"
                  onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                >
                  <MenuItem value="MM/DD/YYYY">MM/DD/YYYY</MenuItem>
                  <MenuItem value="DD/MM/YYYY">DD/MM/YYYY</MenuItem>
                  <MenuItem value="YYYY-MM-DD">YYYY-MM-DD</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth>
                <InputLabel>Time Format</InputLabel>
                <Select
                  value={settings.timeFormat}
                  label="Time Format"
                  onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                >
                  <MenuItem value="12h">12-hour</MenuItem>
                  <MenuItem value="24h">24-hour</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Security Settings */}
          <Paper sx={{ p: 3, flex: 1 }}>
            <Typography variant="h6" gutterBottom>
              Security Settings
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                label="Session Timeout (minutes)"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                fullWidth
              />
              <TextField
                label="Max Login Attempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleSettingChange('maxLoginAttempts', parseInt(e.target.value))}
                fullWidth
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.enableTwoFactor}
                    onChange={(e) => handleSettingChange('enableTwoFactor', e.target.checked)}
                  />
                }
                label="Enable Two-Factor Authentication"
              />
            </Box>
          </Paper>
        </Box>

        {/* Feature Settings */}
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Feature Settings
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableNotifications}
                  onChange={(e) => handleSettingChange('enableNotifications', e.target.checked)}
                />
              }
              label="Enable Email Notifications"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={settings.enableAuditLog}
                  onChange={(e) => handleSettingChange('enableAuditLog', e.target.checked)}
                />
              }
              label="Enable Audit Logging"
            />
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}; 