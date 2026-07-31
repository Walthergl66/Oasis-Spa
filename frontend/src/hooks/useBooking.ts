import { useAppointmentsStore } from '../store/appointmentsStore';
import { useUIStore } from '../store/uiStore';
import type { Appointment, Service } from '../types';

/**
 * Acceso al flujo de reserva desde cualquier vista: abre el asistente para un
 * servicio, lo abre en modo reprogramación o refresca las citas.
 */
export const useBooking = () => {
  const openBooking = useUIStore(state => state.openBooking);
  const openReschedule = useUIStore(state => state.openReschedule);
  const closeBooking = useUIStore(state => state.closeBooking);
  const reload = useAppointmentsStore(state => state.reload);

  return {
    book: (service: Service) => openBooking(service.id),
    bookById: (serviceId: string) => openBooking(serviceId),
    reschedule: (appointment: Appointment) => openReschedule(appointment.id, appointment.serviceId),
    closeBooking,
    reloadAppointments: reload,
  };
};
