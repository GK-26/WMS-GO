import React from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import {
  CheckCircle as HealthyIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Storage as DatabaseIcon,
  Memory as MemoryIcon,
  Speed as CpuIcon,
  Storage as DiskIcon,
} from '@mui/icons-material';

interface SystemMetric {
  name: string;
  value: string;
  status: 'healthy' | 'warning' | 'error';
  icon: React.ReactNode;
}

interface ServiceStatus {
  name: string;
  status: 'running' | 'stopped' | 'error';
  uptime: string;
  lastCheck: Date;
}

export const SystemStatusPage: React.FC = () => {
  // Mock system metrics
  const systemMetrics: SystemMetric[] = [
    {
      name: 'Database',
      value: 'Connected',
      status: 'healthy',
      icon: <DatabaseIcon />,
    },
    {
      name: 'Memory Usage',
      value: '67%',
      status: 'warning',
      icon: <MemoryIcon />,
    },
    {
      name: 'CPU Usage',
      value: '45%',
      status: 'healthy',
      icon: <CpuIcon />,
    },
    {
      name: 'Disk Space',
      value: '82%',
      status: 'warning',
      icon: <DiskIcon />,
    },
  ];

  // Mock service status
  const services: ServiceStatus[] = [
    {
      name: 'Web Server',
      status: 'running',
      uptime: '15 days, 3 hours',
      lastCheck: new Date(),
    },
    {
      name: 'Database Server',
      status: 'running',
      uptime: '30 days, 12 hours',
      lastCheck: new Date(),
    },
    {
      name: 'Background Jobs',
      status: 'running',
      uptime: '5 days, 8 hours',
      lastCheck: new Date(),
    },
    {
      name: 'Email Service',
      status: 'error',
      uptime: '0 days, 0 hours',
      lastCheck: new Date(Date.now() - 10 * 60 * 1000), // 10 minutes ago
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return 'success';
      case 'warning':
        return 'warning';
      case 'error':
      case 'stopped':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <HealthyIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
      case 'stopped':
        return <ErrorIcon color="error" />;
      default:
        return <ErrorIcon color="action" />;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        System Status
      </Typography>
      
      {/* System Metrics */}
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
        {systemMetrics.map((metric, index) => (
          <Card key={index} sx={{ flex: '1 1 250px', minWidth: 250 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography color="textSecondary" gutterBottom variant="body2">
                    {metric.name}
                  </Typography>
                  <Typography variant="h6">
                    {metric.value}
                  </Typography>
                </Box>
                <Box sx={{ color: `${getStatusColor(metric.status)}.main` }}>
                  {metric.icon}
                </Box>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={metric.status}
                  color={getStatusColor(metric.status) as any}
                  size="small"
                />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Box>

      {/* Service Status */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6">Service Status</Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Service Name</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Uptime</TableCell>
                <TableCell>Last Check</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {services.map((service, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                      {service.name}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getStatusIcon(service.status)}
                      <Chip
                        label={service.status}
                        color={getStatusColor(service.status) as any}
                        size="small"
                      />
                    </Box>
                  </TableCell>
                  <TableCell>{service.uptime}</TableCell>
                  <TableCell>{service.lastCheck.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}; 