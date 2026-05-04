import React from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';

interface UserLayoutProps {
  children: React.ReactNode;
}

export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => {
  return (
    <div className="user-layout">
      <Navbar />
      {/* .page-shell recibe el blur/scale al abrir el login — el navbar queda fuera */}
      <div className="page-shell">
        <main className="user-main">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
};
