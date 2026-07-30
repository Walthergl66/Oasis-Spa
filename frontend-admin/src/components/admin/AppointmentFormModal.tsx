import React, { useEffect, useState } from 'react';
import { errorMessage } from '../../api/http';
import { appointmentsService } from '../../services/appointments.service';
import { userService } from '../../services/user.service';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import type { Availability, ClientSummary } from '../../types';
import { toISODate } from '../../utils/date';
import { ErrorMessage, Loader } from '../ui/Feedback';
import { Input, Select, Textarea } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { TimeSlots } from '../booking/TimeSlots';

interface AppointmentFormModalProps {
  /** Fecha inicial (la que se está viendo en la agenda). */
  date: string;
  onClose: () => void;
  onCreated: () => void;
}

/** Alta de cita desde el panel administrativo (recepción). */
export const AppointmentFormModal: React.FC<AppointmentFormModalProps> = ({ date, onClose, onCreated }) => {
  const services = useCatalogStore(state => state.services);
  const specialists = useCatalogStore(state => state.specialists);
  const toast = useUIStore(state => state.toast);

  const [clients, setClients] = useState<ClientSummary[]>([]);
  const [clientId, setClientId] = useState('');
  const [serviceId, setServiceId] = useState(services[0]?.id ?? '');
  const [selectedDate, setSelectedDate] = useState(date);
  const [time, setTime] = useState<string | null>(null);
  const [specialistId, setSpecialistId] = useState('');
  const [notes, setNotes] = useState('');
  const [availability, setAvailability] = useState<Availability | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void userService.listClients().then(list => {
      setClients(list);
      setClientId(current => current || list[0]?.client.id || '');
    });
  }, []);

  useEffect(() => {
    if (!serviceId) return;
    let active = true;
    setLoadingSlots(true);
    setTime(null);
    setSpecialistId('');
    appointmentsService
      .getAvailability(serviceId, selectedDate)
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
  }, [serviceId, selectedDate]);

  const slot = availability?.slots.find(s => s.time === time) ?? null;
  const availableSpecialists = specialists.filter(s => slot?.specialistIds.includes(s.id));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!time) return;
    setSaving(true);
    setError(null);
    try {
      await appointmentsService.create({
        clientId,
        serviceId,
        date: selectedDate,
        time,
        specialistId: specialistId || undefined,
        notes: notes.trim(),
      });
      toast('Cita registrada en la agenda.');
      onCreated();
      onClose();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  if (clients.length === 0) {
    return (
      <Modal onClose={onClose}>
        <div className="modal-body"><Loader text="Cargando clientas…" /></div>
      </Modal>
    );
  }

  return (
    <Modal onClose={onClose} wide>
      <div className="modal-body">
        <div className="modal-eyebrow">AGENDA</div>
        <div className="modal-title">Nueva cita</div>
        <div className="modal-meta">La disponibilidad se valida contra la agenda real del equipo.</div>

        {error && <ErrorMessage message={error} />}

        <form onSubmit={submit}>
          <div className="form-grid">
            <Select
              label="CLIENTA"
              value={clientId}
              onChange={e => setClientId(e.target.value)}
              options={clients.map(c => ({ value: c.client.id, label: c.client.name }))}
            />
            <Select
              label="SERVICIO"
              value={serviceId}
              onChange={e => setServiceId(e.target.value)}
              options={services.map(s => ({ value: s.id, label: `${s.name} · ${s.durationMin} min` }))}
            />
            <Input
              label="FECHA"
              type="date"
              value={selectedDate}
              min={toISODate(new Date())}
              onChange={e => setSelectedDate(e.target.value)}
            />
            <Select
              label="ESPECIALISTA"
              value={specialistId}
              onChange={e => setSpecialistId(e.target.value)}
              options={[
                { value: '', label: 'Cualquiera disponible' },
                ...availableSpecialists.map(s => ({ value: s.id, label: s.name })),
              ]}
            />
          </div>

          <div className="field-label">HORARIO</div>
          <TimeSlots slots={availability?.slots ?? []} value={time} loading={loadingSlots} onChange={setTime} />

          <Textarea label="NOTAS" rows={2} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Preferencias o indicaciones" />

          <button className="btn-continue" type="submit" disabled={saving || !time}>
            {saving ? 'Guardando…' : 'Registrar cita'}
          </button>
          <button className="btn-back" type="button" onClick={onClose}>Cancelar</button>
        </form>
      </div>
    </Modal>
  );
};
