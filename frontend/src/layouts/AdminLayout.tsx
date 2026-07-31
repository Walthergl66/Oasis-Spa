import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from '../components/layout/Sidebar';
import { useAuthStore } from '../store/authStore';

const TITLES: Record<string, string> = {
  '/admin/dashboard': 'Panel administrativo',
  '/admin/appointments': 'Agenda',
  '/admin/services': 'Gestión de servicios',
  '/admin/staff': 'Especialistas',
  '/admin/clients': 'Base de clientas',
  '/admin/promotions': 'Gestión de promociones',
  '/admin/reports': 'Reportes y estadísticas',
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

/** Marco del componente administrativo: menú lateral y barra superior. */
export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { pathname } = useLocation();
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  return (
    <div className="admin-shell">
      <Sidebar />
      <div className="admin-main">
        <div className="admin-topbar">
          <h1>{TITLES[pathname] ?? 'Administración'}</h1>
          <div className="row gap-md">
            <span className="user-chip">{user?.name} · Oasis Spa</span>
            <button
              className="btn-mini-ghost"
              onClick={() => {
                logout();
                navigate('/login');
              }}
            >
              Salir
            </button>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};
