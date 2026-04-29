import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { UserLayout } from '../layouts/UserLayout';
import { AdminLayout } from '../layouts/AdminLayout';

// Auth pages
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

// User pages
import { Home } from '../pages/user/Home';
import { Services } from '../pages/user/Services';
import { Booking } from '../pages/user/Booking';
import { Appointments } from '../pages/user/Appointments';
import { Promotions } from '../pages/user/Promotions';
import { Profile } from '../pages/user/Profile';

// Admin pages
import { Dashboard } from '../pages/admin/Dashboard';
import AdminAppointments from '../pages/admin/Appointments';
import AdminServices from '../pages/admin/Services';
import AdminStaff from '../pages/admin/Staff';
import AdminPromotions from '../pages/admin/Promotions';
import AdminReports from '../pages/admin/Reports';

export const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* User Routes */}
        <Route path="/" element={<UserLayout><Home /></UserLayout>} />
        <Route path="/services" element={<UserLayout><Services /></UserLayout>} />
        <Route path="/booking" element={<UserLayout><Booking /></UserLayout>} />
        <Route path="/appointments" element={<UserLayout><Appointments /></UserLayout>} />
        <Route path="/promotions" element={<UserLayout><Promotions /></UserLayout>} />
        <Route path="/profile" element={<UserLayout><Profile /></UserLayout>} />

        {/* Admin Routes */}
        <Route path="/admin/dashboard" element={<AdminLayout><Dashboard /></AdminLayout>} />
        <Route path="/admin/appointments" element={<AdminLayout><AdminAppointments /></AdminLayout>} />
        <Route path="/admin/services" element={<AdminLayout><AdminServices /></AdminLayout>} />
        <Route path="/admin/staff" element={<AdminLayout><AdminStaff /></AdminLayout>} />
        <Route path="/admin/promotions" element={<AdminLayout><AdminPromotions /></AdminLayout>} />
        <Route path="/admin/reports" element={<AdminLayout><AdminReports /></AdminLayout>} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
};
