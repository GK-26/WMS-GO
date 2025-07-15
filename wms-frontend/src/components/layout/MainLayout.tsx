import React, { useState } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleMenuClick = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  return (
    <div className="main-layout">
      <Header onMenuClick={handleMenuClick} sidebarCollapsed={!sidebarOpen} />
      <Sidebar open={sidebarOpen} onClose={handleSidebarClose} />
      <main className={`content-area ${!sidebarOpen ? 'sidebar-collapsed' : ''}`}>
        {children}
      </main>
    </div>
  );
}; 