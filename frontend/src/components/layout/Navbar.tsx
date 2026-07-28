import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { NotificationBell } from './NotificationBell';

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/services', label: 'Servicios', end: false },
  { to: '/promotions', label: 'Promociones', end: false },
  { to: '/appointments', label: 'Reservas', end: false },
];

export const Navbar: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const navigate = useNavigate();

  return (
    <header className="header">
      <Link to="/" className="logo">Spa<span>&amp; BELLEZA</span></Link>

      <nav className="nav">
        {LINKS.map(link => (
          <NavLink key={link.to} to={link.to} end={link.end} className={({ isActive }) => (isActive ? 'active' : '')}>
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="header-right">
        {user ? (
          <>
            <NotificationBell />
            <button className="user-chip user-chip-btn" onClick={() => navigate('/profile')}>
              <div className="avatar-dot">{user.initials}</div>
              <span>{user.name.split(' ')[0]}</span>
            </button>
          </>
        ) : (
          <button className="btn-primary" onClick={() => navigate('/login')}>Ingresar</button>
        )}
      </div>
    </header>
  );
};
