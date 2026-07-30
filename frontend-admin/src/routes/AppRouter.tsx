import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { AdminAppointments } from '../pages/admin/Appointments';
import { AdminClients } from '../pages/admin/Clients';
import { Dashboard } from '../pages/admin/Dashboard';
import { AdminPromotions } from '../pages/admin/Promotions';
import { AdminReports } from '../pages/admin/Reports';
import { AdminServices } from '../pages/admin/Services';
import { AdminStaff } from '../pages/admin/Staff';
import { Login } from '../pages/auth/Login';

/**
 * Rutas del panel.
 *
 * Todas las rutas de gestión cuelgan de la raíz (no de `/admin`) porque esta
 * aplicación **es** el panel: no comparte dominio de rutas con la PWA de la
 * clienta. Cada una exige sesión con rol de administración o especialista.
 */
const panel = (element: React.ReactNode) => (
  <ProtectedRoute>
    <AdminLayout>{element}</AdminLayout>
  </ProtectedRoute>
);

export const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/dashboard" element={panel(<Dashboard />)} />
      <Route path="/appointments" element={panel(<AdminAppointments />)} />
      <Route path="/services" element={panel(<AdminServices />)} />
      <Route path="/staff" element={panel(<AdminStaff />)} />
      <Route path="/clients" element={panel(<AdminClients />)} />
      <Route path="/promotions" element={panel(<AdminPromotions />)} />
      <Route path="/reports" element={panel(<AdminReports />)} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  </Router>
);
