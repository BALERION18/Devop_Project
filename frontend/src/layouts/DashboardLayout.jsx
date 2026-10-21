import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/Sidebar.jsx';

export const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      {/* Main Content Area - strictly offset by sidebar width on desktop */}
      <div
        className={`main-content ${isCollapsed ? 'sidebar-collapsed' : 'sidebar-expanded'}`}
      >
        <Outlet context={{ setMobileOpen }} />
      </div>
    </div>
  );
};
