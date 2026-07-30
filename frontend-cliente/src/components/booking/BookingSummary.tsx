import React from 'react';
import type { Service } from '../../types';
import { formatLongDate } from '../../utils/date';

interface BookingSummaryProps {
  service: Service;
  date: string;
  time: string;
  specialistName?: string;
}

export const BookingSummary: React.FC<BookingSummaryProps> = ({ service, date, time, specialistName }) => (
  <div className="booking-summary">
    <div className="summary-row"><span>Servicio</span><span>{service.name}</span></div>
    <div className="summary-row"><span>Fecha</span><span>{formatLongDate(`${date}T12:00:00`)}</span></div>
    <div className="summary-row"><span>Hora</span><span>{time} · {service.durationMin} min</span></div>
    {specialistName && <div className="summary-row"><span>Especialista</span><span>{specialistName}</span></div>}
    <div className="summary-row"><span>Total</span><span>${service.price}</span></div>
  </div>
);
