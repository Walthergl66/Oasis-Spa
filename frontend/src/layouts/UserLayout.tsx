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
      <main className="user-main">
        {children}
      </main>
      <Footer />
    </div>
  );
};
