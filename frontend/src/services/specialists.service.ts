/** Especialistas del spa. Refleja el módulo `specialists` de NestJS. */
import { ApiError, request } from '../api/http';
import { clone, db, mutate, newId } from '../api/localDb';
import { initials } from '../mocks/seed';
import type { Specialist } from '../types';

export type SpecialistInput = Omit<Specialist, 'id' | 'initials'> & { initials?: string };

export const specialistsService = {
  /** GET /specialists */
  list: (includeInactive = false): Promise<Specialist[]> =>
    request({
      method: 'get',
      path: '/specialists',
      params: { includeInactive },
      mock: () => clone(db().specialists.filter(s => includeInactive || s.active)),
    }),

  /** GET /specialists?category=Uñas — quiénes pueden atender una categoría. */
  listByCategory: (category: string): Promise<Specialist[]> =>
    request({
      method: 'get',
      path: '/specialists',
      params: { category },
      mock: () => clone(db().specialists.filter(s => s.active && s.categories.includes(category))),
    }),

  /** POST /specialists (admin) */
  create: (input: SpecialistInput): Promise<Specialist> =>
    request({
      method: 'post',
      path: '/specialists',
      body: input,
      mock: () =>
        mutate(data => {
          const specialist: Specialist = {
            ...input,
            id: newId('spe'),
            initials: input.initials || initials(input.name),
          };
          data.specialists.push(specialist);
          return clone(specialist);
        }),
    }),

  /** PATCH /specialists/:id (admin) */
  update: (id: string, changes: Partial<SpecialistInput>): Promise<Specialist> =>
    request({
      method: 'patch',
      path: `/specialists/${id}`,
      body: changes,
      mock: () =>
        mutate(data => {
          const specialist = data.specialists.find(s => s.id === id);
          if (!specialist) throw new ApiError('La especialista no existe.', 'NOT_FOUND');
          Object.assign(specialist, changes);
          if (changes.name) {
            specialist.initials = changes.initials || initials(changes.name);
            data.appointments.forEach(a => {
              if (a.specialistId === id) a.specialistName = changes.name!;
            });
          }
          return clone(specialist);
        }),
    }),

  /** DELETE /specialists/:id (admin) — baja lógica si tiene citas. */
  remove: (id: string): Promise<{ deleted: boolean; deactivated: boolean }> =>
    request({
      method: 'delete',
      path: `/specialists/${id}`,
      mock: () =>
        mutate(data => {
          const index = data.specialists.findIndex(s => s.id === id);
          if (index === -1) throw new ApiError('La especialista no existe.', 'NOT_FOUND');
          if (data.appointments.some(a => a.specialistId === id)) {
            data.specialists[index].active = false;
            return { deleted: false, deactivated: true };
          }
          data.specialists.splice(index, 1);
          return { deleted: true, deactivated: false };
        }),
    }),
};
