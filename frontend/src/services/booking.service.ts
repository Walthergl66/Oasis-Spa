/**
 * Fachada de reservas: conserva la API original (createBooking, getUserBookings,
 * cancelBooking…) delegando en `appointmentsService`, que es donde vive la
 * lógica. Se mantiene para no romper el código que ya la importaba.
 */
import type { Appointment, Availability, CreateAppointmentInput } from '../types';
import { appointmentsService } from './appointments.service';

export const bookingService = {
  createBooking: (data: CreateAppointmentInput): Promise<Appointment> => appointmentsService.create(data),

  getUserBookings: (userId: string): Promise<Appointment[]> => appointmentsService.getUpcoming(userId),

  getUserHistory: (userId: string): Promise<Appointment[]> => appointmentsService.getHistory(userId),

  getBookingById: (bookingId: string): Promise<Appointment> => appointmentsService.getById(bookingId),

  getAvailability: (serviceId: string, date: string): Promise<Availability> =>
    appointmentsService.getAvailability(serviceId, date),

  rescheduleBooking: (bookingId: string, date: string, time: string, specialistId?: string): Promise<Appointment> =>
    appointmentsService.reschedule(bookingId, date, time, specialistId),

  cancelBooking: (bookingId: string, reason?: string): Promise<Appointment> =>
    appointmentsService.cancel(bookingId, reason),
};
