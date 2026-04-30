import React from 'react';

export const Navbar: React.FC = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">Oasis Spa</div>
        <ul className="navbar-menu">
          <li><a href="/">Home</a></li>
          <li><a href="/services">Services</a></li>
          <li><a href="/profile">Profile</a></li>
        </ul>
      </div>
    </nav>
  );
};
