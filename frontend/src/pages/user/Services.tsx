import React, { useMemo, useState } from 'react';
import { ServiceList } from '../../components/services/ServiceList';
import { Loader } from '../../components/ui/Feedback';
import { useBooking } from '../../hooks/useBooking';
import { userService } from '../../services/user.service';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Service } from '../../types';

export const Services: React.FC = () => {
  const services = useCatalogStore(state => state.services);
  const loading = useCatalogStore(state => state.loading);
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const toast = useUIStore(state => state.toast);
  const { book } = useBooking();

  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  const categories = useMemo(() => ['Todos', ...new Set(services.map(s => s.category))], [services]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return services
      .filter(service => category === 'Todos' || service.category === category)
      .filter(service => !term || service.name.toLowerCase().includes(term) || service.description.toLowerCase().includes(term));
  }, [services, category, search]);

  async function toggleFavorite(service: Service) {
    if (!user) {
      toast('Inicia sesión para guardar favoritos.', 'info');
      return;
    }
    const updated = await userService.toggleFavorite(user.id, service.name);
    setUser(updated);
    toast(updated.favoriteServices.includes(service.name) ? 'Agregado a favoritos.' : 'Quitado de favoritos.');
  }

  if (loading && services.length === 0) return <Loader />;

  return (
    <div className="page">
      <div className="section-title">
        <div>
          <div className="eyebrow mb-sm">✦ CATÁLOGO</div>
          <h2>Elige el tratamiento que tu cuerpo merece</h2>
        </div>
      </div>

      <div className="filters">
        {categories.map(item => (
          <button
            key={item}
            className={`filter-chip ${category === item ? 'active' : ''}`.trim()}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
        <input
          className="search-input"
          placeholder="Buscar servicio…"
          value={search}
          onChange={event => setSearch(event.target.value)}
        />
      </div>

      <ServiceList
        services={filtered}
        onBook={book}
        detailed
        favorites={user?.favoriteServices ?? []}
        onToggleFavorite={toggleFavorite}
        emptyText="Prueba con otra categoría o cambia la búsqueda."
      />
    </div>
  );
};

export default Services;
