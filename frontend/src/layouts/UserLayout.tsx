import React from 'react';
import { BookingModal } from '../components/booking/BookingModal';
import { Footer } from '../components/layout/Footer';
import { Navbar } from '../components/layout/Navbar';
import { LunaChat, LunaFab } from '../components/luna/LunaChat';
import { ReviewModal } from '../components/reviews/ReviewModal';

interface UserLayoutProps {
  children: React.ReactNode;
}

/** Marco de la aplicación de la clienta: navegación, contenido, Luna y modales. */
export const UserLayout: React.FC<UserLayoutProps> = ({ children }) => (
  <div className="app-shell">
    <Navbar />
    <main className="grow">{children}</main>
    <Footer />

    <BookingModal />
    <ReviewModal />
    <LunaFab />
    <LunaChat />
  </div>
);
