import React from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';

interface KPICard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
}

interface Alert {
  id: string;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export const DashboardPage: React.FC = () => {
  // Mock KPI data
  const kpiData: KPICard[] = [
    {
      title: 'Total Orders',
      value: '1,234',
      change: '+12.5%',
      trend: 'up',
      icon: 'pi pi-shopping-cart',
      color: '#3b82f6',
    },
    {
      title: 'Inventory Items',
      value: '5,678',
      change: '+3.2%',
      trend: 'up',
      icon: 'pi pi-box',
      color: '#10b981',
    },
    {
      title: 'Pending Shipments',
      value: '89',
      change: '-5.1%',
      trend: 'down',
      icon: 'pi pi-truck',
      color: '#f59e0b',
    },
    {
      title: 'Active Workers',
      value: '45',
      change: '+2.3%',
      trend: 'up',
      icon: 'pi pi-users',
      color: '#8b5cf6',
    },
  ];

  // Mock recent activity data
  const recentActivity: RecentActivity[] = [
    {
      id: '1',
      type: 'Order',
      description: 'Order #12345 completed and shipped',
      timestamp: new Date(Date.now() - 5 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '2',
      type: 'Inventory',
      description: 'Low stock alert for Product ABC-123',
      timestamp: new Date(Date.now() - 15 * 60 * 1000),
      status: 'pending',
    },
    {
      id: '3',
      type: 'Shipment',
      description: 'Shipment #78910 arrived at warehouse',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
      status: 'completed',
    },
    {
      id: '4',
      type: 'Worker',
      description: 'Worker John Smith completed shift',
      timestamp: new Date(Date.now() - 45 * 60 * 1000),
      status: 'completed',
    },
  ];

  // Mock alerts data
  const alerts: Alert[] = [
    {
      id: '1',
      type: 'warning',
      message: 'Low inventory levels detected for 5 items',
      timestamp: new Date(Date.now() - 10 * 60 * 1000),
    },
    {
      id: '2',
      type: 'info',
      message: 'System maintenance scheduled for tonight at 2 AM',
      timestamp: new Date(Date.now() - 30 * 60 * 1000),
    },
    {
      id: '3',
      type: 'success',
      message: 'Daily backup completed successfully',
      timestamp: new Date(Date.now() - 60 * 60 * 1000),
    },
  ];

  const getStatusSeverity = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'danger';
      default: return 'info';
    }
  };

  const getAlertSeverity = (type: string) => {
    switch (type) {
      case 'success': return 'success';
      case 'warning': return 'warn';
      case 'error': return 'error';
      case 'info': return 'info';
      default: return 'info';
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const activityTypeTemplate = (rowData: RecentActivity) => (
    <Tag value={rowData.type} severity="info" />
  );

  const activityStatusTemplate = (rowData: RecentActivity) => (
    <Tag value={rowData.status} severity={getStatusSeverity(rowData.status) as any} />
  );

  const activityTimeTemplate = (rowData: RecentActivity) => (
    <span>{formatTime(rowData.timestamp)}</span>
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p className="text-muted">Welcome back! Here's what's happening in your warehouse today.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4 mb-4">
        {kpiData.map((kpi, index) => (
          <div key={index} className="dashboard-card kpi-card">
            <div className="kpi-header">
              <div className="kpi-info">
                <h3 className="kpi-value" style={{ color: kpi.color }}>
                  {kpi.value}
                </h3>
                <p className="kpi-title">{kpi.title}</p>
              </div>
              <div className="kpi-icon" style={{ backgroundColor: `${kpi.color}20` }}>
                <i className={kpi.icon} style={{ color: kpi.color }}></i>
              </div>
            </div>
            <div className="kpi-trend">
              <i className={`pi ${kpi.trend === 'up' ? 'pi-arrow-up' : kpi.trend === 'down' ? 'pi-arrow-down' : 'pi-minus'}`} 
                 style={{ color: kpi.trend === 'up' ? '#10b981' : kpi.trend === 'down' ? '#ef4444' : '#6b7280' }}></i>
              <span className={`trend-value ${kpi.trend === 'up' ? 'trend-up' : kpi.trend === 'down' ? 'trend-down' : 'trend-stable'}`}>
                {kpi.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-2">
        {/* Recent Activity */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>Recent Activity</h3>
            <span className="card-subtitle">Latest warehouse operations</span>
          </div>
          <DataTable value={recentActivity} showGridlines className="data-table">
            <Column field="type" header="Type" body={activityTypeTemplate} style={{ width: '100px' }} />
            <Column field="description" header="Description" />
            <Column field="status" header="Status" body={activityStatusTemplate} style={{ width: '120px' }} />
            <Column field="timestamp" header="Time" body={activityTimeTemplate} style={{ width: '100px' }} />
          </DataTable>
        </div>

        {/* Alerts */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>System Alerts</h3>
            <span className="card-subtitle">Important notifications</span>
          </div>
          <div className="alerts-container">
            {alerts.map((alert) => (
              <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                <div className="alert-header">
                  <i className={`pi ${alert.type === 'success' ? 'pi-check-circle' : alert.type === 'warning' ? 'pi-exclamation-triangle' : alert.type === 'error' ? 'pi-times-circle' : 'pi-info-circle'}`}></i>
                  <Tag value={alert.type.toUpperCase()} severity={getAlertSeverity(alert.type) as any} />
                </div>
                <p className="alert-message">
                  {alert.message}
                </p>
                <small className="alert-time">
                  {formatTime(alert.timestamp)}
                </small>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}; 