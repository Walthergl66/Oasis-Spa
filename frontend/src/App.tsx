import { useEffect } from 'react';
import { Toaster } from './components/ui/Feedback';
import { AppRouter } from './routes/AppRouter';
import { useAppointmentsStore } from './store/appointmentsStore';
import { useAuthStore } from './store/authStore';
import { useCatalogStore } from './store/catalogStore';
import { useNotificationsStore } from './store/notificationsStore';

function App() {
  const hydrate = useAuthStore(state => state.hydrate);
  const user = useAuthStore(state => state.user);
  const loadCatalog = useCatalogStore(state => state.load);
  const loadAppointments = useAppointmentsStore(state => state.load);
  const loadNotifications = useNotificationsStore(state => state.load);

  // Al abrir la app: rehidratar sesión y cargar el catálogo público.
  useEffect(() => {
    void hydrate();
    void loadCatalog();
  }, [hydrate, loadCatalog]);

  // Cuando hay sesión, se cargan los datos propios de la clienta.
  useEffect(() => {
    if (!user) return;
    void loadAppointments(user.id);
    void loadNotifications(user.id);
  }, [user, loadAppointments, loadNotifications]);

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
