import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AuthGuard } from './components/auth/AuthGuard';
import { LoginPage } from './components/auth/LoginPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { InventoryPage } from './pages/inventory/InventoryPage';
import { OrderFulfillmentPage } from './pages/order-fulfillment/OrderFulfillmentPage';
import { ReceivingPage } from './pages/receiving/ReceivingPage';
import { LaborManagementPage } from './pages/labor-management/LaborManagementPage';
import { ShippingPage } from './pages/shipping/ShippingPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { AutomationPage } from './pages/automation/AutomationPage';
import { ConfigurationPage } from './pages/configuration/ConfigurationPage';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />
        
        {/* Protected routes */}
        <Route
          path="/dashboard"
          element={
            <AuthGuard>
              <MainLayout>
                <DashboardPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/inventory"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'inventory', action: 'read' }]}>
              <MainLayout>
                <InventoryPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/order-fulfillment"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'orders', action: 'read' }]}> 
              <MainLayout>
                <OrderFulfillmentPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/receiving"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'receiving', action: 'read' }]}>
              <MainLayout>
                <ReceivingPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/labor-management"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'labor', action: 'read' }]}>
              <MainLayout>
                <LaborManagementPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/shipping"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'shipping', action: 'read' }]}> 
              <MainLayout>
                <ShippingPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/reports"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'reports', action: 'read' }]}> 
              <MainLayout>
                <ReportsPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/automation"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'automation', action: 'read' }]}> 
              <MainLayout>
                <AutomationPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        <Route
          path="/configuration"
          element={
            <AuthGuard requiredPermissions={[{ resource: 'configuration', action: 'read' }]}> 
              <MainLayout>
                <ConfigurationPage />
              </MainLayout>
            </AuthGuard>
          }
        />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  );
}

export default App;
