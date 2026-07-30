import { useEffect } from 'react';
import { Toaster } from './components/ui/Feedback';
import { AppRouter } from './routes/AppRouter';
import { useAuthStore } from './store/authStore';
import { useCatalogStore } from './store/catalogStore';

/**
 * Panel administrativo de Oasis Spa.
 *
 * A diferencia de la aplicación de la clienta, aquí no hay contenido público:
 * el catálogo se carga sólo cuando hay sesión, e incluye los registros
 * desactivados (`load(true)`), porque la administración necesita verlos.
 */
function App() {
  const hydrate = useAuthStore(state => state.hydrate);
  const user = useAuthStore(state => state.user);
  const loadCatalog = useCatalogStore(state => state.load);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (user) void loadCatalog(true);
  }, [user, loadCatalog]);

  return (
    <>
      <AppRouter />
      <Toaster />
    </>
  );
}

export default App;
