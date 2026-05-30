import React, { useEffect, useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { AuthSplitPanel } from '../auth/AuthSplitPanel';
import { useAuthStore } from '../../store/authStore';
import oasisLogo from '../../assets/icons/OasisHeaderSource-transparent.png';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuthStore();
  const location = useLocation();
  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = [
    { to: '/', label: 'Inicio' },
    { to: '/services', label: 'Servicios' },
    { to: '/booking', label: 'Reservar' },
    { to: '/appointments', label: 'Citas' },
    { to: '/promotions', label: 'Promos' },
  ];

  return (
    <nav className={`navbar ${isHome ? 'navbar-overlay' : 'navbar-solid'} ${scrolled || !isHome ? 'scrolled' : ''}`}>
      <div className="navbar-container">
        <NavLink to="/" className="navbar-brand">
          <img src={oasisLogo} alt="Oasis Spa" className="brand-logo" />
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
          {isAuthenticated && user?.vip && <span className="vip-chip">VIP</span>}
          {isAuthenticated && <span className="nav-user">{user?.name}</span>}
          {isAuthenticated ? (
            <button className="nav-text-link" type="button" onClick={logout}>
              Salir
            </button>
          ) : (
            <div className="nav-auth-links">
              <button 
                className="nav-text-link" 
                type="button" 
                onClick={() => setAuthOpen(true)}
              >
                Ingresar
              </button>
              <span className="nav-separator"></span>
              <button 
                className="nav-text-link" 
                type="button" 
                onClick={() => setAuthOpen(true)}
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>
      <AuthSplitPanel open={authOpen} onClose={() => setAuthOpen(false)} />
    </nav>
  );
};
