import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { UserLayout } from '../layouts/UserLayout';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';
import { Appointments } from '../pages/user/Appointments';
import { Booking } from '../pages/user/Booking';
import { Home } from '../pages/user/Home';
import { Profile } from '../pages/user/Profile';
import { Promotions } from '../pages/user/Promotions';
import { Services } from '../pages/user/Services';

/**
 * Rutas de la aplicación de la clienta.
 *
 * El catálogo y las promociones son públicos a propósito: una visitante debe
 * poder ver qué ofrece el spa antes de crearse una cuenta. Reservar, consultar
 * citas y el perfil sí exigen sesión.
 *
 * La administración vive en otra aplicación (`frontend-admin`), así que aquí no
 * existe ninguna ruta `/admin`.
 */
const page = (element: React.ReactNode) => <UserLayout>{element}</UserLayout>;

export const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/" element={page(<Home />)} />
      <Route path="/services" element={page(<Services />)} />
      <Route path="/promotions" element={page(<Promotions />)} />

      <Route path="/booking" element={<ProtectedRoute>{page(<Booking />)}</ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute>{page(<Appointments />)}</ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute>{page(<Profile />)}</ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);
