import React from 'react';
import type { AvailabilitySlot } from '../../types';

interface TimeSlotsProps {
  slots: AvailabilitySlot[];
  value: string | null;
  loading?: boolean;
  onChange: (time: string) => void;
}

/** Rejilla de horarios: refleja la disponibilidad real devuelta por la API. */
export const TimeSlots: React.FC<TimeSlotsProps> = ({ slots, value, loading = false, onChange }) => {
  if (loading) {
    return <div className="loader" style={{ padding: '24px 0' }}><span className="spinner" />Consultando disponibilidad…</div>;
  }
  if (slots.length === 0) {
    return <div className="slots-empty">El spa no atiende ese día. Elige otra fecha.</div>;
  }
  if (slots.every(slot => !slot.available)) {
    return <div className="slots-empty">No quedan horarios libres para este servicio ese día.</div>;
  }

  return (
    <div className="time-grid">
      {slots.map(slot => (
        <button
          key={slot.time}
          type="button"
          className={`time-cell ${slot.time === value ? 'selected' : ''} ${slot.available ? '' : 'disabled'}`.trim()}
          disabled={!slot.available}
          title={slot.available ? `${slot.specialistIds.length} especialista(s) disponible(s)` : 'Horario ocupado'}
          onClick={() => onChange(slot.time)}
        >
          {slot.time}
        </button>
      ))}
    </div>
  );
};
