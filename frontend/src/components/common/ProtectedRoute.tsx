import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { Loader } from '../ui/Feedback';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protege las rutas que exigen sesión (reservar, mis citas, perfil).
 *
 * Ya no distingue roles: la administración es otra aplicación. Espera a que
 * termine la rehidratación de la sesión para no expulsar a la usuaria mientras
 * se recupera el token.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const status = useAuthStore(state => state.status);
  const user = useAuthStore(state => state.user);
  const location = useLocation();

  if (status === 'loading') return <Loader text="Verificando tu sesión…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;

  return <>{children}</>;
};
