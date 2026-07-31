/** Catálogo de servicios del spa. Refleja el módulo `services` de NestJS. */
import { ApiError, request } from '../api/http';
import { clone, db, mutate, newId } from '../api/localDb';
import type { Service } from '../types';

export type ServiceInput = Omit<Service, 'id' | 'rating' | 'reviewsCount'> & Partial<Pick<Service, 'rating' | 'reviewsCount'>>;

export const servicesService = {
  /** GET /services — sólo los activos por defecto (lo que ve la clienta). */
  list: (includeInactive = false): Promise<Service[]> =>
    request({
      method: 'get',
      path: '/services',
      params: { includeInactive },
      mock: () => clone(db().services.filter(s => includeInactive || s.active)),
    }),

  /** GET /services/:id */
  getById: (id: string): Promise<Service> =>
    request({
      method: 'get',
      path: `/services/${id}`,
      mock: () => {
        const found = db().services.find(s => s.id === id);
        if (!found) throw new ApiError('El servicio no existe.', 'NOT_FOUND');
        return clone(found);
      },
    }),

  /** GET /services/categories */
  categories: (): Promise<string[]> =>
    request({
      method: 'get',
      path: '/services/categories',
      mock: () => [...new Set(db().services.filter(s => s.active).map(s => s.category))],
    }),

  /** POST /services (admin) */
  create: (input: ServiceInput): Promise<Service> =>
    request({
      method: 'post',
      path: '/services',
      body: input,
      mock: () =>
        mutate(data => {
          const service: Service = {
            ...input,
            id: newId('svc'),
            rating: input.rating ?? 0,
            reviewsCount: input.reviewsCount ?? 0,
          };
          data.services.push(service);
          return clone(service);
        }),
    }),

  /** PATCH /services/:id (admin) */
  update: (id: string, changes: Partial<ServiceInput>): Promise<Service> =>
    request({
      method: 'patch',
      path: `/services/${id}`,
      body: changes,
      mock: () =>
        mutate(data => {
          const service = data.services.find(s => s.id === id);
          if (!service) throw new ApiError('El servicio no existe.', 'NOT_FOUND');
          Object.assign(service, changes);
          // El nombre del servicio viaja denormalizado en las citas: se sincroniza.
          if (changes.name) {
            data.appointments.forEach(a => {
              if (a.serviceId === id) a.serviceName = changes.name!;
            });
          }
          return clone(service);
        }),
    }),

  /**
   * DELETE /services/:id (admin) — baja lógica.
   * Un servicio con citas registradas no se borra: se desactiva para no romper
   * el historial. Es la misma regla que aplicará el backend.
   */
  remove: (id: string): Promise<{ deleted: boolean; deactivated: boolean }> =>
    request({
      method: 'delete',
      path: `/services/${id}`,
      mock: () =>
        mutate(data => {
          const index = data.services.findIndex(s => s.id === id);
          if (index === -1) throw new ApiError('El servicio no existe.', 'NOT_FOUND');
          const used = data.appointments.some(a => a.serviceId === id);
          if (used) {
            data.services[index].active = false;
            return { deleted: false, deactivated: true };
          }
          data.services.splice(index, 1);
          return { deleted: true, deactivated: false };
        }),
    }),
};
