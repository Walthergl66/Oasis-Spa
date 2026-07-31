import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Navigate, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Loader } from '../components/ui/Feedback';
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
 * Rutas del sistema: componente de la clienta y componente administrativo.
 *
 * El panel se importa con `lazy` a propósito. Es una sola aplicación —un
 * despliegue, un manifiesto PWA— pero su código viaja en un fragmento aparte
 * que sólo se descarga cuando alguien entra a `/admin`. Una clienta nunca baja
 * las tablas, formularios y gráficos que jamás va a abrir.
 */
const AdminLayout = lazy(() =>
  import('../layouts/AdminLayout').then(m => ({ default: m.AdminLayout })),
);
const Dashboard = lazy(() =>
  import('../pages/admin/Dashboard').then(m => ({ default: m.Dashboard })),
);
const AdminAppointments = lazy(() =>
  import('../pages/admin/Appointments').then(m => ({ default: m.AdminAppointments })),
);
const AdminServices = lazy(() =>
  import('../pages/admin/Services').then(m => ({ default: m.AdminServices })),
);
const AdminStaff = lazy(() =>
  import('../pages/admin/Staff').then(m => ({ default: m.AdminStaff })),
);
const AdminClients = lazy(() =>
  import('../pages/admin/Clients').then(m => ({ default: m.AdminClients })),
);
const AdminPromotions = lazy(() =>
  import('../pages/admin/Promotions').then(m => ({ default: m.AdminPromotions })),
);
const AdminReports = lazy(() =>
  import('../pages/admin/Reports').then(m => ({ default: m.AdminReports })),
);

/** Página de la clienta dentro de su marco. */
const page = (element: React.ReactNode) => <UserLayout>{element}</UserLayout>;

/**
 * Página administrativa: exige rol y se muestra tras cargar su fragmento.
 * `Suspense` cubre esa descarga con el mismo indicador de carga del sistema.
 */
const admin = (element: React.ReactNode) => (
  <ProtectedRoute adminOnly>
    <Suspense fallback={<Loader text="Cargando el panel…" />}>
      <AdminLayout>{element}</AdminLayout>
    </Suspense>
  </ProtectedRoute>
);

export const AppRouter: React.FC = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Componente de la clienta */}
      <Route path="/" element={page(<Home />)} />
      <Route path="/services" element={page(<Services />)} />
      <Route path="/promotions" element={page(<Promotions />)} />
      <Route path="/booking" element={<ProtectedRoute>{page(<Booking />)}</ProtectedRoute>} />
      <Route path="/appointments" element={<ProtectedRoute>{page(<Appointments />)}</ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute>{page(<Profile />)}</ProtectedRoute>} />

      {/* Componente administrativo */}
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
