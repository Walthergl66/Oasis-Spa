import React from 'react';
import { NavLink } from 'react-router-dom';
import oasisLogo from '../../assets/icons/OasisHeaderSource-transparent.png';

export const Sidebar: React.FC = () => {
  const links = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/appointments', label: 'Citas' },
    { to: '/admin/services', label: 'Servicios' },
    { to: '/admin/staff', label: 'Usuarios' },
    { to: '/admin/promotions', label: 'Promociones' },
    { to: '/admin/reports', label: 'Reportes' },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-inner">
        <NavLink to="/" className="sidebar-brand">
          <img src={oasisLogo} alt="Oasis Spa" className="brand-logo brand-logo-sidebar" />
        </NavLink>
        <nav className="sidebar-nav">
          <ul>
            {links.map((link) => (
              <li key={link.to}>
                <NavLink
                  to={link.to}
                  className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
                >
                  {link.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
};
