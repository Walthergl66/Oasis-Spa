import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader } from '../ui/Feedback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Exige rol de administración (panel interno). */
  adminOnly?: boolean;
}

/** Protege rutas privadas. Espera a que termine la rehidratación de sesión. */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (status === 'loading') return <Loader text="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/" replace />;

  return <>{children}</>;
};
