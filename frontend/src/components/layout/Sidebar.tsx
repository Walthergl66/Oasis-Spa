import React from 'react';

export const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul>
          <li><a href="/admin/dashboard">Dashboard</a></li>
          <li><a href="/admin/appointments">Appointments</a></li>
          <li><a href="/admin/services">Services</a></li>
          <li><a href="/admin/staff">Staff</a></li>
          <li><a href="/admin/promotions">Promotions</a></li>
          <li><a href="/admin/reports">Reports</a></li>
        </ul>
      </nav>
    </aside>
  );
};
