import React from 'react';
import { NavLink } from 'react-router-dom';

export const Navbar: React.FC = () => {
  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/services', label: 'Servicios' },
    { to: '/booking', label: 'Reservar' },
    { to: '/appointments', label: 'Citas' },
    { to: '/promotions', label: 'Promos' },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          Oasis Spa
          <span>Bienestar y reservas</span>
        </NavLink>
        <ul className="navbar-menu">
          {links.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
        <div className="navbar-actions">
          <NavLink to="/login" className="btn btn-outline">
            Entrar
          </NavLink>
          <NavLink to="/admin/dashboard" className="btn btn-secondary">
            Admin
          </NavLink>
        </div>
      </div>
    </nav>
  );
};
