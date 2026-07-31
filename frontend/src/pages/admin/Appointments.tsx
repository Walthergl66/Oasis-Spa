import React, { useCallback, useEffect, useState } from 'react';
import { AppointmentFormModal } from '../../components/admin/AppointmentFormModal';
import { AppointmentBadge } from '../../components/ui/Badge';
import { ConfirmDialog, Loader } from '../../components/ui/Feedback';
import { BUSINESS_HOURS, appointmentsService } from '../../services/appointments.service';
import { useUIStore } from '../../store/uiStore';
import type { Appointment } from '../../types';
import { addDays, formatLongDate, toISODate, toTime } from '../../utils/date';

/** Franjas horarias del día, en bloques de una hora. */
function hourSlots(date: string): string[] {
  const hours = BUSINESS_HOURS[new Date(`${date}T12:00:00`).getDay()];
  if (!hours) return [];
  const open = Number(hours.open.split(':')[0]);
  const close = Number(hours.close.split(':')[0]);
  return Array.from({ length: close - open }, (_, i) => `${String(open + i).padStart(2, '0')}:00`);
}

export const AdminAppointments: React.FC = () => {
  const toast = useUIStore(state => state.toast);
  const [date, setDate] = useState(toISODate(new Date()));
  const [agenda, setAgenda] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [working, setWorking] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setAgenda(await appointmentsService.getAgenda(date));
    setLoading(false);
  }, [date]);

  useEffect(() => {
    void load();
  }, [load]);

  async function changeStatus(appointment: Appointment, status: Appointment['status']) {
    await appointmentsService.updateStatus(appointment.id, status);
    toast(status === 'completada' ? 'Cita completada. Puntos acreditados a la clienta.' : 'Estado actualizado.');
    await load();
  }

  async function confirmCancel() {
    if (!toCancel) return;
    setWorking(true);
    try {
      await appointmentsService.cancel(toCancel.id, 'Cancelada desde recepción');
      toast('Cita cancelada.');
      setToCancel(null);
      await load();
    } finally {
      setWorking(false);
    }
  }

  const today = toISODate(new Date());
  const quickDays = [
    { label: 'Ayer', value: toISODate(addDays(new Date(), -1)) },
    { label: 'Hoy', value: today },
    { label: 'Mañana', value: toISODate(addDays(new Date(), 1)) },
  ];

  return (
    <div className="admin-content">
      <div className="agenda-toolbar">
        <div className="agenda-daytabs">
          {quickDays.map(day => (
            <button key={day.value} className={date === day.value ? 'active' : ''} onClick={() => setDate(day.value)}>
              {day.label}
            </button>
          ))}
        </div>
        <input className="admin-search" type="date" value={date} onChange={event => setDate(event.target.value)} />
        <div className="agenda-date">📅 {formatLongDate(`${date}T12:00:00`)}</div>
        <button className="add-btn" onClick={() => setCreating(true)}>+ Nueva cita</button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="timeline">
          {hourSlots(date).length === 0 && (
            <div className="timeline-empty" style={{ margin: '20px 0' }}>El spa no atiende este día.</div>
          )}
          {hourSlots(date).map(slot => {
            const hour = Number(slot.split(':')[0]);
            const inSlot = agenda.filter(appointment => new Date(appointment.start).getHours() === hour);

            return (
              <div className="timeline-row" key={slot}>
                <div className="timeline-time">{slot}</div>
                <div className="timeline-slot">
                  {inSlot.length === 0 ? (
                    <div className="timeline-empty">Disponible</div>
                  ) : (
                    inSlot.map(appointment => (
                      <div
                        className={`timeline-cita ${appointment.status === 'pendiente' ? 'pend' : appointment.status === 'completada' ? 'done' : appointment.status === 'cancelada' ? 'cancel' : ''}`.trim()}
                        key={appointment.id}
                      >
                        <div className="tc-bar" />
                        <div className="tc-info">
                          <div className="tc-service">{appointment.serviceName}</div>
                          <div className="tc-meta">
                            {toTime(appointment.start)} · {appointment.clientName} · {appointment.durationMin} min · ${appointment.price}
                          </div>
                        </div>
                        <div className="tc-spec">{appointment.specialistName}</div>
                        <AppointmentBadge status={appointment.status} />
                        <div className="tc-actions">
                          {appointment.status === 'pendiente' && (
                            <button className="link-edit" onClick={() => void changeStatus(appointment, 'confirmada')}>Confirmar</button>
                          )}
                          {appointment.status === 'confirmada' && (
                            <button className="link-edit" onClick={() => void changeStatus(appointment, 'completada')}>Completar</button>
                          )}
                          {(appointment.status === 'pendiente' || appointment.status === 'confirmada') && (
                            <button className="link-del" onClick={() => setToCancel(appointment)}>Cancelar</button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {creating && (
        <AppointmentFormModal date={date} onClose={() => setCreating(false)} onCreated={() => void load()} />
      )}

      {toCancel && (
        <ConfirmDialog
          title="¿Cancelar la cita?"
          message={`Se cancelará ${toCancel.serviceName} de ${toCancel.clientName}. El horario quedará libre.`}
          confirmLabel="Sí, cancelar"
          loading={working}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setToCancel(null)}
        />
      )}
    </div>
  );
};

export default AdminAppointments;
