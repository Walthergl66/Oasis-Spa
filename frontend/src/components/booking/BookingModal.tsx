import React from 'react';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import { Modal } from '../ui/Modal';
import { BookingForm } from './BookingForm';

/**
 * Modal de reserva conectado al store de interfaz: cualquier vista puede
 * abrirlo con `openBooking(serviceId)` u `openReschedule(citaId, serviceId)`.
 */
export const BookingModal: React.FC = () => {
  const serviceId = useUIStore(state => state.bookingServiceId);
  const reschedulingId = useUIStore(state => state.reschedulingId);
  const close = useUIStore(state => state.closeBooking);
  const service = useCatalogStore(state => state.services.find(s => s.id === serviceId));

  if (!serviceId || !service) return null;

  return (
    <Modal onClose={close}>
      <div className="modal-img">
        <img src={service.image} alt={service.name} />
        <button className="modal-close" onClick={close} aria-label="Cerrar">✕</button>
      </div>
      <div className="modal-body">
        <div className="modal-eyebrow">{service.category.toUpperCase()}</div>
        <div className="modal-title">{service.name}</div>
        <div className="modal-meta">⏱ {service.durationMin} min · ${service.price}</div>
        <BookingForm service={service} appointmentId={reschedulingId} onDone={close} />
      </div>
    </Modal>
  );
};
