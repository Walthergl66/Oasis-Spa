import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader } from '../ui/Feedback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protege el panel completo.
 *
 * Aquí no hay grados: toda la aplicación exige sesión de personal o
 * administración. Una clienta autenticada no pasa de la pantalla de acceso.
 * La comprobación se repite en el backend con `@Roles(...)`; esta es sólo la
 * capa de interfaz.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (status === 'loading') return <Loader text="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (user.role === 'cliente') return <Navigate to="/login" replace />;

  return <>{children}</>;
};
