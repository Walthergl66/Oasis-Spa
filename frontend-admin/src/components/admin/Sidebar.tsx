import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

/**
 * Menú del panel. Las rutas cuelgan de la raíz porque esta aplicación es
 * únicamente el panel administrativo.
 */
const ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: '▤' },
  { to: '/appointments', label: 'Agenda', icon: '🗓' },
  { to: '/services', label: 'Servicios', icon: '✦' },
  { to: '/staff', label: 'Especialistas', icon: '👤' },
  { to: '/clients', label: 'Clientas', icon: '☺' },
  { to: '/promotions', label: 'Promociones', icon: '🎁' },
  { to: '/reports', label: 'Reportes', icon: '📊' },
];

export const Sidebar: React.FC = () => {
  const user = useAuthStore(state => state.user);

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">Oasis Spa</div>
      <nav className="sidebar-nav">
        {ITEMS.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive }) => (isActive ? 'active' : '')}>
            <span className="sidebar-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-foot">
        <div className="specialist-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>
          {user?.initials ?? 'OS'}
        </div>
        <div>
          <div className="sidebar-foot-name">{user?.name ?? 'Administración'}</div>
          <div className="sidebar-foot-role">
            {user?.role === 'especialista' ? 'Especialista' : 'Oasis Spa'}
          </div>
        </div>
      </div>
    </aside>
  );
};
