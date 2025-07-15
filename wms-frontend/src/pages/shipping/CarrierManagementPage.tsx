import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  LocalShipping as CarrierIcon,
} from '@mui/icons-material';

interface Carrier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  status: 'active' | 'inactive';
}

export const CarrierManagementPage: React.FC = () => {
  // Mock data
  const carriers: Carrier[] = [
    {
      id: '1',
      name: 'FedEx',
      contact: 'Alice Smith',
      phone: '(555) 123-4567',
      status: 'active',
    },
    {
      id: '2',
      name: 'UPS',
      contact: 'Bob Johnson',
      phone: '(555) 234-5678',
      status: 'active',
    },
    {
      id: '3',
      name: 'DHL',
      contact: 'Carol Lee',
      phone: '(555) 345-6789',
      status: 'inactive',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Carrier Management</Typography>
        <Button variant="contained" startIcon={<CarrierIcon />}>Add Carrier</Button>
      </Box>
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {carriers.map((carrier) => (
                <TableRow key={carrier.id} hover>
                  <TableCell>{carrier.name}</TableCell>
                  <TableCell>{carrier.contact}</TableCell>
                  <TableCell>{carrier.phone}</TableCell>
                  <TableCell>
                    <Chip
                      label={carrier.status}
                      color={carrier.status === 'active' ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}; 