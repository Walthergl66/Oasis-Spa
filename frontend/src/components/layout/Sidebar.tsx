import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const ITEMS = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: '▤' },
  { to: '/admin/appointments', label: 'Agenda', icon: '🗓' },
  { to: '/admin/services', label: 'Servicios', icon: '✦' },
  { to: '/admin/staff', label: 'Especialistas', icon: '👤' },
  { to: '/admin/clients', label: 'Clientas', icon: '☺' },
  { to: '/admin/promotions', label: 'Promociones', icon: '🎁' },
  { to: '/admin/reports', label: 'Reportes', icon: '📊' },
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
        <div className="specialist-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>{user?.initials ?? 'SB'}</div>
        <div>
          <div className="sidebar-foot-name">{user?.name ?? 'Admin'}</div>
          <div className="sidebar-foot-role">Oasis Spa</div>
        </div>
      </div>
    </aside>
  );
};
