import React from 'react';
import type { Appointment, Service } from '../../types';
import { formatLongDate, toTime } from '../../utils/date';
import { AppointmentBadge } from '../ui/Badge';

interface AppointmentCardProps {
  appointment: Appointment;
  service?: Service;
  onReschedule?: (appointment: Appointment) => void;
  onCancel?: (appointment: Appointment) => void;
  onRebook?: (appointment: Appointment) => void;
  onReview?: (appointment: Appointment) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment, service, onReschedule, onCancel, onRebook, onReview,
}) => {
  const isActive = appointment.status === 'pendiente' || appointment.status === 'confirmada';
  const isPast = new Date(appointment.start).getTime() < Date.now();

  return (
    <div className="reserva-item">
      <div className="reserva-thumb">
        {service && <img src={service.image} alt={appointment.serviceName} loading="lazy" />}
      </div>
      <div className="reserva-info">
        <div className="reserva-name">{appointment.serviceName}</div>
        <div className="reserva-meta">📅 {formatLongDate(appointment.start)}</div>
        <div className="reserva-meta">🕐 {toTime(appointment.start)} · {appointment.durationMin} min</div>
        <div className="reserva-meta">👤 Esp. {appointment.specialistName}</div>
        {appointment.notes && <div className="reserva-meta">📝 {appointment.notes}</div>}

        <div className="reserva-actions">
          <AppointmentBadge status={appointment.status} />

          {isActive && !isPast && onReschedule && (
            <button className="btn-mini-outline" onClick={() => onReschedule(appointment)}>Reprogramar</button>
          )}
          {isActive && !isPast && onCancel && (
            <button className="btn-mini-ghost" onClick={() => onCancel(appointment)}>Cancelar</button>
          )}
          {appointment.status === 'completada' && onRebook && (
            <button className="btn-mini-outline" onClick={() => onRebook(appointment)}>Reservar de nuevo</button>
          )}
          {appointment.status === 'completada' && !appointment.reviewed && onReview && (
            <button className="btn-mini-ghost" onClick={() => onReview(appointment)}>⭐ Dejar reseña</button>
          )}
          {appointment.status === 'cancelada' && onRebook && (
            <button className="btn-mini-outline" onClick={() => onRebook(appointment)}>Reservar de nuevo</button>
          )}
        </div>
      </div>
    </div>
  );
};
