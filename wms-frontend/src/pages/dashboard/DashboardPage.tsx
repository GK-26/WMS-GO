import React from 'react';
import { Card } from 'primereact/card';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { Button } from 'primereact/button';
import { useDashboardData, useActivities, useAlerts } from '../../services/api';
import { DashboardData, Activity, Alert } from '../../types';

interface KPICard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'stable';
  icon: string;
  color: string;
}

export const DashboardPage: React.FC = () => {
  // API hooks
  const { data: dashboardResponse, isLoading: dashboardLoading, error: dashboardError } = useDashboardData();
  const { data: activitiesResponse, isLoading: activitiesLoading } = useActivities({ limit: 10 });
  const { data: alertsResponse, isLoading: alertsLoading } = useAlerts({ limit: 5 });

  const dashboardData = dashboardResponse?.data;
  const activities = dashboardData?.recentActivities || activitiesResponse?.data?.data || [];
  const alerts = dashboardData?.alerts || alertsResponse?.data?.data || [];

  // Transform dashboard data to KPI cards
  const kpiData: KPICard[] = [
    {
      title: 'Total Orders',
      value: dashboardData?.summary?.totalOrders?.toString() || '0',
      change: '+12.5%', // TODO: Calculate from historical data
      trend: 'up',
      icon: 'pi pi-shopping-cart',
      color: '#3b82f6',
    },
    {
      title: 'Inventory Items',
      value: dashboardData?.summary?.totalProducts?.toString() || '0',
      change: '+3.2%', // TODO: Calculate from historical data
      trend: 'up',
      icon: 'pi pi-box',
      color: '#10b981',
    },
    {
      title: 'Pending Shipments',
      value: dashboardData?.summary?.totalShipments?.toString() || '0',
      change: '-5.1%', // TODO: Calculate from historical data
      trend: 'down',
      icon: 'pi pi-truck',
      color: '#f59e0b',
    },
    {
      title: 'Active Tasks',
      value: dashboardData?.summary?.activeTasks?.toString() || '0',
      change: '+2.3%', // TODO: Calculate from historical data
      trend: 'up',
      icon: 'pi pi-users',
      color: '#8b5cf6',
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

  const activityTypeTemplate = (rowData: Activity) => (
    <Tag value={rowData.type.replace('_', ' ').toUpperCase()} severity="info" />
  );

  const activityStatusTemplate = (rowData: Activity) => {
    // Determine status based on activity type
    let status = 'completed';
    if (rowData.type.includes('created') || rowData.type.includes('assigned')) {
      status = 'pending';
    }
    return <Tag value={status} severity={getStatusSeverity(status) as any} />;
  };

  const activityTimeTemplate = (rowData: Activity) => (
    <span>{formatTime(new Date(rowData.createdAt))}</span>
  );

  const alertTypeTemplate = (rowData: Alert) => (
    <Tag value={rowData.type.replace('_', ' ').toUpperCase()} severity={getAlertSeverity(rowData.type) as any} />
  );

  const alertTimeTemplate = (rowData: Alert) => (
    <span>{formatTime(new Date(rowData.createdAt))}</span>
  );

  if (dashboardError) {
    return (
      <div className="error-container">
        <h2>Error Loading Dashboard</h2>
        <p>Failed to load dashboard data. Please try again later.</p>
        <Button label="Retry" icon="pi pi-refresh" onClick={() => window.location.reload()} />
      </div>
    );
  }

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
                  {dashboardLoading ? '...' : kpi.value}
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
          <DataTable 
            value={activities} 
            showGridlines 
            className="data-table"
            loading={activitiesLoading}
            emptyMessage={activitiesLoading ? "Loading activities..." : "No recent activity"}
          >
            <Column field="type" header="Type" body={activityTypeTemplate} style={{ width: '100px' }} />
            <Column field="description" header="Description" />
            <Column field="status" header="Status" body={activityStatusTemplate} style={{ width: '120px' }} />
            <Column field="createdAt" header="Time" body={activityTimeTemplate} style={{ width: '100px' }} />
          </DataTable>
        </div>

        {/* Alerts */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3>System Alerts</h3>
            <span className="card-subtitle">Important notifications</span>
          </div>
          {alertsLoading ? (
            <div className="loading-container">
              <p>Loading alerts...</p>
            </div>
          ) : (
            <div className="alerts-container">
              {alerts.length > 0 ? (
                alerts.map((alert: Alert) => (
                  <div key={alert.id} className={`alert-item alert-${alert.type}`}>
                    <div className="alert-header">
                      <i className={`pi ${alert.type === 'low_stock' ? 'pi-exclamation-triangle' : 
                                     alert.type === 'overdue_order' ? 'pi-clock' : 
                                     alert.type === 'system_error' ? 'pi-times-circle' : 
                                     alert.type === 'security_breach' ? 'pi-shield' : 'pi-info-circle'}`}></i>
                      <Tag value={alert.type.replace('_', ' ').toUpperCase()} severity={getAlertSeverity(alert.type) as any} />
                    </div>
                    <p className="alert-message">
                      {alert.message}
                    </p>
                    <small className="alert-time">
                      {formatTime(new Date(alert.createdAt))}
                    </small>
                  </div>
                ))
              ) : (
                <div className="no-alerts">
                  <p>No active alerts</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 