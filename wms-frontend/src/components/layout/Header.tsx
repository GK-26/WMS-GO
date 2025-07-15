import React from 'react';
import { Button } from 'primereact/button';
import { Avatar } from 'primereact/avatar';
import { Menu } from 'primereact/menu';
import { useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  onMenuClick: () => void;
  sidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick, sidebarCollapsed = false }) => {
  const { state, logout } = useAuth();
  const menu = useRef<Menu>(null);

  const menuItems = [
    {
      label: 'Profile',
      icon: 'pi pi-user',
      command: () => console.log('Profile clicked'),
    },
    {
      label: 'Settings',
      icon: 'pi pi-cog',
      command: () => console.log('Settings clicked'),
    },
    {
      separator: true,
    },
    {
      label: 'Logout',
      icon: 'pi pi-sign-out',
      command: logout,
    },
  ];

  return (
    <header className={`header ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
          icon="pi pi-bars"
          className="p-button-text p-button-rounded"
          onClick={onMenuClick}
          style={{ marginRight: '16px' }}
        />
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 600 }}>
          WMS System
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '0.875rem', color: '#6c757d' }}>
          Welcome, {state.user?.firstName} {state.user?.lastName}
        </span>
        <Avatar
          label={state.user?.firstName?.charAt(0) || 'U'}
          size="normal"
          shape="circle"
          style={{ cursor: 'pointer' }}
          onClick={(e) => menu.current?.toggle(e)}
        />
        <Menu model={menuItems} popup ref={menu} />
      </div>
    </header>
  );
}; 