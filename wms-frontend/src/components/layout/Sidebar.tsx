import React from 'react';
import { PanelMenu } from 'primereact/panelmenu';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { hasPermission } = useAuth();

  const menuItems = [
    {
      label: 'Dashboard',
      icon: 'pi pi-home',
      command: () => handleNavigation('/dashboard'),
      className: location.pathname === '/dashboard' ? 'p-highlight' : '',
    },
    {
      label: 'Inventory Management',
      icon: 'pi pi-box',
      command: () => handleNavigation('/inventory'),
      className: location.pathname === '/inventory' ? 'p-highlight' : '',
      visible: hasPermission('inventory', 'read'),
    },
    {
      label: 'Order Fulfillment',
      icon: 'pi pi-shopping-cart',
      command: () => handleNavigation('/order-fulfillment'),
      className: location.pathname === '/order-fulfillment' ? 'p-highlight' : '',
      visible: hasPermission('orders', 'read'),
    },
    {
      label: 'Receiving',
      icon: 'pi pi-download',
      command: () => handleNavigation('/receiving'),
      className: location.pathname === '/receiving' ? 'p-highlight' : '',
      visible: hasPermission('receiving', 'read'),
    },
    {
      label: 'Shipping',
      icon: 'pi pi-truck',
      command: () => handleNavigation('/shipping'),
      className: location.pathname === '/shipping' ? 'p-highlight' : '',
      visible: hasPermission('shipping', 'read'),
    },
    {
      label: 'Labor Management',
      icon: 'pi pi-users',
      command: () => handleNavigation('/labor-management'),
      className: location.pathname === '/labor-management' ? 'p-highlight' : '',
      visible: hasPermission('labor', 'read'),
    },
    {
      label: 'Automation',
      icon: 'pi pi-cog',
      command: () => handleNavigation('/automation'),
      className: location.pathname === '/automation' ? 'p-highlight' : '',
      visible: hasPermission('automation', 'read'),
    },
    {
      label: 'Reports & Analytics',
      icon: 'pi pi-chart-bar',
      command: () => handleNavigation('/reports'),
      className: location.pathname === '/reports' ? 'p-highlight' : '',
      visible: hasPermission('reports', 'read'),
    },
    {
      label: 'File Management',
      icon: 'pi pi-file',
      command: () => handleNavigation('/file-management'),
      className: location.pathname === '/file-management' ? 'p-highlight' : '',
      visible: hasPermission('files', 'read'),
    },
    {
      label: 'Email Notifications',
      icon: 'pi pi-envelope',
      command: () => handleNavigation('/email-notifications'),
      className: location.pathname === '/email-notifications' ? 'p-highlight' : '',
      visible: hasPermission('email', 'read'),
    },
    {
      label: 'Configuration',
      icon: 'pi pi-wrench',
      command: () => handleNavigation('/configuration'),
      className: location.pathname === '/configuration' ? 'p-highlight' : '',
      visible: hasPermission('configuration', 'read'),
    },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  const filteredMenuItems = menuItems.filter(item => item.visible !== false);

  return (
    <aside className={`sidebar ${!open ? 'collapsed' : ''}`}>
      <PanelMenu model={filteredMenuItems} />
    </aside>
  );
}; 