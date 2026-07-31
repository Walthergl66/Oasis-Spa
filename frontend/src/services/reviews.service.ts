/**
 * Reseñas. Sólo se puede reseñar una cita completada y una sola vez: la regla
 * vive aquí y se replicará en el módulo `reviews` de NestJS.
 */
import { ApiError, request } from '../api/http';
import { clone, db, mutate, newId } from '../api/localDb';
import type { Review } from '../types';

export interface ReviewInput {
  appointmentId: string;
  rating: number;
  text: string;
}

export const reviewsService = {
  /** GET /reviews */
  list: (limit?: number): Promise<Review[]> =>
    request({
      method: 'get',
      path: '/reviews',
      params: { limit },
      mock: () => {
        const sorted = [...db().reviews].sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        return clone(limit ? sorted.slice(0, limit) : sorted);
      },
    }),

  /** GET /reviews?serviceId= */
  listByService: (serviceId: string): Promise<Review[]> =>
    request({
      method: 'get',
      path: '/reviews',
      params: { serviceId },
      mock: () => clone(db().reviews.filter(r => r.serviceId === serviceId)),
    }),

  /** POST /reviews — marca la cita como reseñada y recalcula el rating del servicio. */
  create: ({ appointmentId, rating, text }: ReviewInput): Promise<Review> =>
    request({
      method: 'post',
      path: '/reviews',
      body: { appointmentId, rating, text },
      mock: () =>
        mutate(data => {
          const appointment = data.appointments.find(a => a.id === appointmentId);
          if (!appointment) throw new ApiError('La cita no existe.', 'NOT_FOUND');
          if (appointment.status !== 'completada') throw new ApiError('Sólo puedes reseñar una cita completada.', 'INVALID_STATUS');
          if (appointment.reviewed) throw new ApiError('Esta cita ya tiene una reseña.', 'ALREADY_REVIEWED');
          if (rating < 1 || rating > 5) throw new ApiError('La valoración debe estar entre 1 y 5.', 'INVALID_RATING');

          const client = data.users.find(u => u.id === appointment.clientId);
          const review: Review = {
            id: newId('rev'),
            appointmentId,
            clientId: appointment.clientId,
            clientName: appointment.clientName,
            initials: client?.initials ?? '',
            serviceId: appointment.serviceId,
            serviceName: appointment.serviceName,
            rating,
            text: text.trim(),
            createdAt: new Date().toISOString(),
          };
          data.reviews.unshift(review);
          appointment.reviewed = true;

          const service = data.services.find(s => s.id === appointment.serviceId);
          if (service) {
            const total = service.rating * service.reviewsCount + rating;
            service.reviewsCount += 1;
            service.rating = Math.round((total / service.reviewsCount) * 10) / 10;
          }
          return clone(review);
        }),
    }),
};
