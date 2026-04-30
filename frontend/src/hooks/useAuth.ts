import { useAuthStore } from '../store/authStore';

export const useAuth = () => {
  const { user, isAuthenticated, setUser, logout } = useAuthStore();

  return {
    user,
    isAuthenticated,
    setUser,
    logout,
  };
};
