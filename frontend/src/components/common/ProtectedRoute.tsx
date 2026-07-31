import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader } from '../ui/Feedback';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Exige rol de administración o especialista (componente administrativo). */
  adminOnly?: boolean;
}

/**
 * Protege las rutas privadas y espera a que termine la rehidratación de la
 * sesión, para no expulsar a la usuaria mientras se recupera el token.
 *
 * Esta comprobación es sólo de interfaz: el backend la repite con `@Roles(...)`
 * en cada endpoint. Ocultar un menú no protege un dato.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  adminOnly = false,
}) => {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (status === 'loading') return <Loader text="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  if (adminOnly && user.role === 'cliente') return <Navigate to="/" replace />;

  return <>{children}</>;
};
