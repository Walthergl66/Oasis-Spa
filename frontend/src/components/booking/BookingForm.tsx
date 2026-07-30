import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { errorMessage } from '../../api/http';
import { appointmentsService } from '../../services/appointments.service';
import { useAppointmentsStore } from '../../store/appointmentsStore';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Availability, Service } from '../../types';
import { addDays, formatLongDate, toISODate, weekdayShort } from '../../utils/date';
import { ErrorMessage } from '../ui/Feedback';
import { BookingSummary } from './BookingSummary';
import { TimeSlots } from './TimeSlots';

interface BookingFormProps {
  service: Service;
  /** Si viene, se reprograma esa cita en lugar de crear una nueva. */
  appointmentId?: string | null;
  onDone?: () => void;
}

/** Días ofrecidos: hoy y los seis siguientes. */
const DAYS = Array.from({ length: 7 }, (_, i) => addDays(new Date(), i));

/**
 * Asistente de reserva en tres pasos. Cada paso consulta al servicio real:
 * la disponibilidad se pide a la API y la confirmación registra la cita.
 */
export const BookingForm: React.FC<BookingFormProps> = ({ service, appointmentId = null, onDone }) => {
  const user = useAuthStore(state => state.user);
  const specialists = useCatalogStore(state => state.specialists);
  const reloadAppointments = useAppointmentsStore(state => state.reload);
  const toast = useUIStore(state => state.toast);
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [date, setDate] = useState(toISODate(DAYS[0]));
  const [time, setTime] = useState<string | null>(null);
  const [specialistId, setSpecialistId] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cada cambio de día consulta disponibilidad real para ese servicio.
  useEffect(() => {
    let active = true;
    setLoadingSlots(true);
    setTime(null);
    setSpecialistId(null);
    appointmentsService
      .getAvailability(service.id, date, appointmentId ?? undefined)
      .then(result => {
        if (active) setAvailability(result);
      })
      .catch(err => {
        if (active) setError(errorMessage(err));
      })
      .finally(() => {
        if (active) setLoadingSlots(false);
      });
    return () => {
      active = false;
    };
  }, [service.id, date, appointmentId]);

  const slot = availability?.slots.find(s => s.time === time) ?? null;
  const availableSpecialists = useMemo(
    () => specialists.filter(s => slot?.specialistIds.includes(s.id)),
    [specialists, slot],
  );
  const chosenSpecialist = availableSpecialists.find(s => s.id === specialistId);

  async function submit() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!time) return;
    setSubmitting(true);
    setError(null);
    try {
      if (appointmentId) {
        await appointmentsService.reschedule(appointmentId, date, time, specialistId ?? undefined);
        toast('Tu cita fue reprogramada.');
      } else {
        await appointmentsService.create({
          clientId: user.id,
          serviceId: service.id,
          date,
          time,
          specialistId: specialistId ?? undefined,
          notes,
        });
        toast('¡Reserva confirmada!');
      }
      await reloadAppointments();
      setStep(3);
    } catch (err) {
      setError(errorMessage(err));
      // Si el horario se ocupó mientras decidía, se vuelve al paso 1 con datos frescos.
      const refreshed = await appointmentsService.getAvailability(service.id, date, appointmentId ?? undefined);
      setAvailability(refreshed);
      setStep(1);
      setTime(null);
    } finally {
      setSubmitting(false);
    }
  }

  if (step === 3) {
    return (
      <div className="confirm-success">
        <div className="confirm-icon">✓</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>
          {appointmentId ? '¡Cita reprogramada!' : '¡Reserva confirmada!'}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
          {service.name}<br />
          {formatLongDate(`${date}T12:00:00`)} · {time}<br />
          {chosenSpecialist ? `Con ${chosenSpecialist.name}` : 'Te asignamos la especialista disponible'}
        </div>
        <button className="btn-continue" onClick={() => (onDone ? onDone() : navigate('/appointments'))}>
          Ver mis reservas
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="steps">
        <div className={`step-dot ${step === 1 ? 'active' : 'done'}`}>{step > 1 ? '✓' : '1'}</div>
        <span className={`step-label ${step === 1 ? 'active' : ''}`}>Fecha y hora</span>
        <div className="step-line" />
        <div className={`step-dot ${step === 2 ? 'active' : ''}`}>2</div>
        <span className={`step-label ${step === 2 ? 'active' : ''}`}>Detalles</span>
      </div>

      {error && <ErrorMessage message={error} />}

      {step === 1 && (
        <>
          <div className="field-label">SELECCIONA EL DÍA</div>
          <div className="day-grid">
            {DAYS.map(day => {
              const iso = toISODate(day);
              return (
                <button
                  key={iso}
                  type="button"
                  className={`day-cell ${iso === date ? 'selected' : ''}`.trim()}
                  onClick={() => setDate(iso)}
                >
                  <span className="dow">{weekdayShort(day)}</span>
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          <div className="field-label">HORARIO DISPONIBLE</div>
          <TimeSlots slots={availability?.slots ?? []} value={time} loading={loadingSlots} onChange={setTime} />

          <button className="btn-continue" disabled={!time} onClick={() => setStep(2)}>Continuar →</button>
        </>
      )}

      {step === 2 && time && (
        <>
          <BookingSummary service={service} date={date} time={time} specialistName={chosenSpecialist?.name} />

          <div className="field-label">ESPECIALISTA</div>
          <button
            type="button"
            className={`specialist-row ${specialistId === null ? 'selected' : ''}`.trim()}
            onClick={() => setSpecialistId(null)}
          >
            <div className="specialist-avatar">✦</div>
            <div>
              <div className="specialist-name">Cualquiera disponible</div>
              <div className="specialist-role">Te asignamos la que tenga menos carga</div>
            </div>
            <div className={`check-circle ${specialistId === null ? 'on' : ''}`.trim()} />
          </button>

          {availableSpecialists.map(specialist => (
            <button
              key={specialist.id}
              type="button"
              className={`specialist-row ${specialist.id === specialistId ? 'selected' : ''}`.trim()}
              onClick={() => setSpecialistId(specialist.id)}
            >
              <div className="specialist-avatar">{specialist.initials}</div>
              <div>
                <div className="specialist-name">{specialist.name}</div>
                <div className="specialist-role">{specialist.role}</div>
              </div>
              <div className={`check-circle ${specialist.id === specialistId ? 'on' : ''}`.trim()} />
            </button>
          ))}

          {!appointmentId && (
            <>
              <div className="field-label" style={{ marginTop: 18 }}>NOTAS ADICIONALES</div>
              <textarea
                className="notes"
                rows={3}
                value={notes}
                onChange={event => setNotes(event.target.value)}
                placeholder="Ej. alergia a ciertos productos, preferencias de presión, color que deseas..."
              />
            </>
          )}

          {!user && (
            <div className="form-error">Inicia sesión para confirmar la reserva.</div>
          )}

          <button className="btn-continue" onClick={() => void submit()} disabled={submitting}>
            {submitting ? 'Procesando…' : appointmentId ? 'Confirmar nuevo horario' : 'Confirmar reserva'}
          </button>
          <button className="btn-back" onClick={() => setStep(1)}>← Cambiar fecha u hora</button>
        </>
      )}
    </>
  );
};
