import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';

export const CreateShipmentPage: React.FC = () => {
  const [orderNumber, setOrderNumber] = useState('');
  const [carrier, setCarrier] = useState('');
  const [destination, setDestination] = useState('');

  // Mock carrier options
  const carriers = ['FedEx', 'UPS', 'DHL', 'USPS'];

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Create Shipment
      </Typography>
      <Paper sx={{ p: 3, maxWidth: 500 }}>
        <Box component="form" display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Order Number"
            value={orderNumber}
            onChange={e => setOrderNumber(e.target.value)}
            required
          />
          <FormControl required>
            <InputLabel>Carrier</InputLabel>
            <Select
              value={carrier}
              label="Carrier"
              onChange={e => setCarrier(e.target.value)}
            >
              {carriers.map(c => (
                <MenuItem key={c} value={c}>{c}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Destination"
            value={destination}
            onChange={e => setDestination(e.target.value)}
            required
          />
          <Button variant="contained" color="primary" type="submit" onClick={e => { e.preventDefault(); alert('Shipment created (mock)!'); }}>
            Create Shipment
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}; 