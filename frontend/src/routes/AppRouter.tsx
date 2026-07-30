import React from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { AdminLayout } from '../layouts/AdminLayout';
import { UserLayout } from '../layouts/UserLayout';

// Autenticación
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

// Cliente
import { Appointments } from '../pages/user/Appointments';
import { Booking } from '../pages/user/Booking';
import { Home } from '../pages/user/Home';
import { Profile } from '../pages/user/Profile';
import { Promotions } from '../pages/user/Promotions';
import { Services } from '../pages/user/Services';

// Administración
import { AdminAppointments } from '../pages/admin/Appointments';
import { AdminClients } from '../pages/admin/Clients';
import { Dashboard } from '../pages/admin/Dashboard';
import { AdminPromotions } from '../pages/admin/Promotions';
import { AdminReports } from '../pages/admin/Reports';
import { AdminServices } from '../pages/admin/Services';
import { AdminStaff } from '../pages/admin/Staff';

/** Envuelve una página del cliente en su layout. */
const client = (element: React.ReactNode) => <UserLayout>{element}</UserLayout>;

/** Envuelve una página administrativa: layout + protección por rol. */
const admin = (element: React.ReactNode) => (
  <ProtectedRoute adminOnly>
    <AdminLayout>{element}</AdminLayout>
  </ProtectedRoute>
);

export const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      {/* Autenticación */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Cliente — públicas */}
      <Route path="/" element={client(<Home />)} />
      <Route path="/services" element={client(<Services />)} />
      <Route path="/promotions" element={client(<Promotions />)} />

      {/* Cliente — requieren sesión */}
      <Route path="/booking" element={<ProtectedRoute>{client(<Booking />)}</ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute>{client(<Appointments />)}</ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute>{client(<Profile />)}</ProtectedRoute>} />

      {/* Administración */}
      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="/admin/dashboard" element={admin(<Dashboard />)} />
      <Route path="/admin/appointments" element={admin(<AdminAppointments />)} />
      <Route path="/admin/services" element={admin(<AdminServices />)} />
      <Route path="/admin/staff" element={admin(<AdminStaff />)} />
      <Route path="/admin/clients" element={admin(<AdminClients />)} />
      <Route path="/admin/promotions" element={admin(<AdminPromotions />)} />
      <Route path="/admin/reports" element={admin(<AdminReports />)} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </Router>
);
