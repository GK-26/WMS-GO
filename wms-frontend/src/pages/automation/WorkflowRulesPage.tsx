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
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as EnableIcon,
  Stop as DisableIcon,
} from '@mui/icons-material';

interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  trigger: string;
  action: string;
  status: 'active' | 'inactive';
  priority: 'high' | 'medium' | 'low';
  lastExecuted?: Date;
}

export const WorkflowRulesPage: React.FC = () => {
  // Mock workflow rules data
  const workflowRules: WorkflowRule[] = [
    {
      id: '1',
      name: 'Low Stock Alert',
      description: 'Automatically create purchase orders when inventory falls below threshold',
      trigger: 'Inventory Level < Min Stock',
      action: 'Create Purchase Order',
      status: 'active',
      priority: 'high',
      lastExecuted: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: '2',
      name: 'Order Auto-Assignment',
      description: 'Automatically assign orders to available workers based on workload',
      trigger: 'New Order Created',
      action: 'Assign to Worker',
      status: 'active',
      priority: 'medium',
      lastExecuted: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: '3',
      name: 'Quality Check Reminder',
      description: 'Send reminders for pending quality inspections',
      trigger: 'Shipment Received',
      action: 'Send Quality Check Reminder',
      status: 'inactive',
      priority: 'low',
    },
  ];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'default';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Workflow Rules</Typography>
        <Button variant="contained" startIcon={<AddIcon />}>
          Create Rule
        </Button>
      </Box>
      
      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Rule Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Trigger</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Last Executed</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {workflowRules.map((rule) => (
                <TableRow key={rule.id} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {rule.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {rule.description}
                    </Typography>
                  </TableCell>
                  <TableCell>{rule.trigger}</TableCell>
                  <TableCell>{rule.action}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.priority}
                      color={getPriorityColor(rule.priority) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={rule.status}
                      color={getStatusColor(rule.status) as any}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {rule.lastExecuted ? rule.lastExecuted.toLocaleString() : 'Never'}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton size="small" color="primary">
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" color={rule.status === 'active' ? 'warning' : 'success'}>
                      {rule.status === 'active' ? <DisableIcon /> : <EnableIcon />}
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