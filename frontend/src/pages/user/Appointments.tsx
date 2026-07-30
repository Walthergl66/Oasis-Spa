import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppointmentList } from '../../components/appointments/AppointmentList';
import { ConfirmDialog, ErrorMessage, Loader } from '../../components/ui/Feedback';
import { useBooking } from '../../hooks/useBooking';
import { useAppointmentsStore } from '../../store/appointmentsStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import type { Appointment } from '../../types';

export const Appointments: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const { upcoming, history, loading, error, load, cancel } = useAppointmentsStore();
  const openReview = useUIStore(state => state.openReview);
  const toast = useUIStore(state => state.toast);
  const { bookById, reschedule } = useBooking();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'proximas' | 'historial'>('proximas');
  const [toCancel, setToCancel] = useState<Appointment | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (user) void load(user.id);
  }, [user, load]);

  const completed = history.filter(appointment => appointment.status === 'completada').length;

  async function confirmCancel() {
    if (!toCancel) return;
    setCancelling(true);
    try {
      await cancel(toCancel.id);
      toast('Tu cita fue cancelada.');
      setToCancel(null);
    } catch {
      toast('No pudimos cancelar la cita.', 'error');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="page">
      <div className="section-title">
        <div>
          <h2 className="page-title">Mis Reservas</h2>
          <p className="muted">Cuidado y bienestar, a tu ritmo.</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/services')}>+ Nueva reserva</button>
      </div>

      {error && <ErrorMessage message={error} />}

      <div className="reservas-layout">
        <div>
          <div className="tabs">
            <button className={tab === 'proximas' ? 'active' : ''} onClick={() => setTab('proximas')}>
              Próximas ({upcoming.length})
            </button>
            <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>
              Historial ({history.length})
            </button>
          </div>

          {loading ? (
            <Loader />
          ) : tab === 'proximas' ? (
            <AppointmentList
              appointments={upcoming}
              emptyTitle="No tienes citas próximas"
              emptyText="Explora el catálogo y reserva tu próximo momento de calma."
              emptyAction={<button className="btn-primary" onClick={() => navigate('/services')}>Ver servicios</button>}
              onReschedule={reschedule}
              onCancel={setToCancel}
            />
          ) : (
            <AppointmentList
              appointments={history}
              emptyTitle="Aún no tienes historial"
              emptyText="Aquí verás tus citas completadas y canceladas."
              onRebook={appointment => bookById(appointment.serviceId)}
              onReview={appointment => openReview(appointment.id)}
            />
          )}
        </div>

        <div className="side-panel">
          <div className="eyebrow mb-md">✦ RESUMEN</div>
          <div className="side-stats">
            <div className="side-stat">
              <div className="num">{upcoming.length}</div>
              <div className="lbl">ACTIVAS</div>
            </div>
            <div className="side-stat">
              <div className="num">{completed}</div>
              <div className="lbl">COMPLETADAS</div>
            </div>
          </div>
          <div className="side-block-label">UBICACIÓN</div>
          <div className="location-name">📍 Oasis Spa</div>
          <div className="location-addr">Manta, Manabí, Ecuador</div>
          <div className="side-block-label">HORARIO DE ATENCIÓN</div>
          <div className="location-addr">Lun a Sáb · 09:00 – 18:00</div>
          <div className="location-addr">Dom · 10:00 – 14:00</div>
          <div className="side-block-label">CONTACTO</div>
          <div className="location-addr">📞 099 812 4471</div>
          <div className="location-addr">✉ citas@oasisspa.ec</div>
        </div>
      </div>

      {toCancel && (
        <ConfirmDialog
          title="¿Cancelar esta cita?"
          message={`Se cancelará ${toCancel.serviceName}. El horario quedará libre para otras clientas y podrás reservar de nuevo cuando quieras.`}
          confirmLabel="Sí, cancelar"
          cancelLabel="Mantener cita"
          loading={cancelling}
          onConfirm={() => void confirmCancel()}
          onCancel={() => setToCancel(null)}
        />
      )}
    </div>
  );
};

export default Appointments;
