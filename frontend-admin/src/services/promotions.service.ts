/** Promociones del spa. Refleja el módulo `promotions` de NestJS. */
import { ApiError, request } from '../api/http';
import { clone, db, mutate, newId } from '../api/localDb';
import type { Promotion } from '../types';

export type PromotionInput = Omit<Promotion, 'id'>;

export const promotionsService = {
  /** GET /promotions — por defecto sólo las vigentes. */
  list: (includeInactive = false): Promise<Promotion[]> =>
    request({
      method: 'get',
      path: '/promotions',
      params: { includeInactive },
      mock: () => clone(db().promotions.filter(p => includeInactive || p.active)),
    }),

  /** POST /promotions (admin) */
  create: (input: PromotionInput): Promise<Promotion> =>
    request({
      method: 'post',
      path: '/promotions',
      body: input,
      mock: () =>
        mutate(data => {
          const promotion: Promotion = { ...input, id: newId('pro') };
          data.promotions.push(promotion);
          return clone(promotion);
        }),
    }),

  /** PATCH /promotions/:id (admin) — también sirve para activar/desactivar. */
  update: (id: string, changes: Partial<PromotionInput>): Promise<Promotion> =>
    request({
      method: 'patch',
      path: `/promotions/${id}`,
      body: changes,
      mock: () =>
        mutate(data => {
          const promotion = data.promotions.find(p => p.id === id);
          if (!promotion) throw new ApiError('La promoción no existe.', 'NOT_FOUND');
          Object.assign(promotion, changes);
          return clone(promotion);
        }),
    }),

  /** DELETE /promotions/:id (admin) */
  remove: (id: string): Promise<{ deleted: boolean }> =>
    request({
      method: 'delete',
      path: `/promotions/${id}`,
      mock: () =>
        mutate(data => {
          const index = data.promotions.findIndex(p => p.id === id);
          if (index === -1) throw new ApiError('La promoción no existe.', 'NOT_FOUND');
          data.promotions.splice(index, 1);
          return { deleted: true };
        }),
    }),
};
