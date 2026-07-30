/**
 * Catálogo compartido: servicios, especialistas, promociones y reseñas.
 * Lo consumen tanto las vistas de cliente como el panel administrativo, así que
 * cualquier alta o edición del admin se refleja de inmediato en la clienta.
 */
import { create } from 'zustand';
import { errorMessage } from '../api/http';
import { promotionsService } from '../services/promotions.service';
import { reviewsService } from '../services/reviews.service';
import { servicesService } from '../services/services.service';
import { specialistsService } from '../services/specialists.service';
import type { Promotion, Review, Service, Specialist } from '../types';

interface CatalogStore {
  services: Service[];
  specialists: Specialist[];
  promotions: Promotion[];
  reviews: Review[];
  loading: boolean;
  error: string | null;
  /** Carga todo el catálogo. `includeInactive` lo usa el panel admin. */
  load: (includeInactive?: boolean) => Promise<void>;
  serviceById: (id: string) => Service | undefined;
}

export const useCatalogStore = create<CatalogStore>((set, get) => ({
  services: [],
  specialists: [],
  promotions: [],
  reviews: [],
  loading: false,
  error: null,

  load: async (includeInactive = false) => {
    set({ loading: true, error: null });
    try {
      const [services, specialists, promotions, reviews] = await Promise.all([
        servicesService.list(includeInactive),
        specialistsService.list(includeInactive),
        promotionsService.list(includeInactive),
        reviewsService.list(),
      ]);
      set({ services, specialists, promotions, reviews, loading: false });
    } catch (error) {
      set({ loading: false, error: errorMessage(error) });
    }
  },

  serviceById: id => get().services.find(s => s.id === id),
}));
