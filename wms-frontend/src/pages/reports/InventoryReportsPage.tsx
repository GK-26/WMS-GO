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
  Chip,
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';

export const InventoryReportsPage: React.FC = () => {
  // Mock inventory report data
  const inventoryData = [
    {
      category: 'Electronics',
      totalItems: 1250,
      lowStock: 15,
      outOfStock: 3,
      value: '$45,000',
    },
    {
      category: 'Clothing',
      totalItems: 890,
      lowStock: 8,
      outOfStock: 1,
      value: '$12,500',
    },
    {
      category: 'Books',
      totalItems: 2340,
      lowStock: 25,
      outOfStock: 5,
      value: '$8,900',
    },
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Inventory Reports</Typography>
        <Button variant="contained" startIcon={<DownloadIcon />}>
          Export Report
        </Button>
      </Box>
      
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Inventory Summary by Category</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell align="right">Total Items</TableCell>
                <TableCell align="right">Low Stock</TableCell>
                <TableCell align="right">Out of Stock</TableCell>
                <TableCell align="right">Total Value</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {inventoryData.map((item, index) => (
                <TableRow key={index} hover>
                  <TableCell>{item.category}</TableCell>
                  <TableCell align="right">{item.totalItems}</TableCell>
                  <TableCell align="right">{item.lowStock}</TableCell>
                  <TableCell align="right">{item.outOfStock}</TableCell>
                  <TableCell align="right">{item.value}</TableCell>
                  <TableCell>
                    <Chip
                      label={item.outOfStock > 0 ? 'Alert' : 'Normal'}
                      color={item.outOfStock > 0 ? 'error' : 'success'}
                      size="small"
                    />
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