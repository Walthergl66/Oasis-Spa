import React from 'react';
import { Sidebar } from '../components/layout/Sidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main className="admin-main">
        {children}
      </main>
    </div>
  );
};
