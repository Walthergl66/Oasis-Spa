import React, { useMemo, useState } from 'react';
import { api } from '../../services/api';
import { employees, formatCurrency, promotions, services, timeSlots } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';

export const Booking: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const [serviceId, setServiceId] = useState(user?.vip ? services[0].id : services.find((service) => !service.vipOnly)?.id || '');
  const [date, setDate] = useState('2026-05-04');
  const [time, setTime] = useState(timeSlots[1]);
  const [employee, setEmployee] = useState(employees[0]);
  const [message, setMessage] = useState('');
  const selectedService = useMemo(() => services.find((service) => service.id === serviceId), [serviceId]);
  const visibleServices = services.filter((service) => !service.vipOnly || user?.vip);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const fallback = {
      id: `local-${Date.now()}`,
      serviceId,
      service: selectedService?.name,
      date,
      time,
      employee,
      status: 'Pendiente',
    };

    await api.createBooking({ serviceId, date, time, employee }, fallback);
    setMessage('Cita guardada en frontend. Se enviara al endpoint real cuando exista.');
  };

  return (
    <div className="booking-page">
      <span className="eyebrow">Reservas</span>
      <h1>Agendar cita</h1>
      <p className="lead">Elige servicio, fecha y hora en una experiencia sencilla, clara y elegante.</p>

      <div className="booking-layout section">
        <form className="card" onSubmit={submit}>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" defaultValue={user?.name || 'Cliente Oasis'} />
            </div>
            <div className="field">
              <label htmlFor="phone">Teléfono</label>
              <input id="phone" placeholder="300 000 0000" />
            </div>
            <div className="field">
              <label htmlFor="service">Servicio</label>
              <select id="service" value={serviceId} onChange={(event) => setServiceId(event.target.value)}>
                {visibleServices.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="date">Fecha</label>
              <input id="date" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="time">Hora</label>
              <select id="time" value={time} onChange={(event) => setTime(event.target.value)}>
                {timeSlots.map((slot) => (
                  <option key={slot}>{slot}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="employee">Profesional</label>
              <select id="employee" value={employee} onChange={(event) => setEmployee(event.target.value)}>
                {employees.map((member) => (
                  <option key={member}>{member}</option>
                ))}
              </select>
            </div>
            <div className="field full">
              <label htmlFor="notes">Notas</label>
              <textarea id="notes" placeholder="Preferencias, alergias o comentarios" />
            </div>
          </div>
          {message && <p className="success-message">{message}</p>}
          <div className="form-actions">
            <button className="btn btn-primary" type="submit">
              Confirmar solicitud
            </button>
            <button className="btn btn-outline" type="reset">
              Limpiar
            </button>
          </div>
        </form>

        <aside className="panel card">
          <span className="eyebrow">{user?.vip ? 'Cliente VIP' : 'Resumen'}</span>
          <h2>{selectedService?.name}</h2>
          <p className="muted">{selectedService?.description}</p>
          <ul className="summary-list">
            <li>
              <span>Duración</span>
              <strong>{selectedService?.duration}</strong>
            </li>
            <li>
              <span>Valor</span>
              <strong>{selectedService ? formatCurrency(selectedService.price) : '-'}</strong>
            </li>
            <li>
              <span>Promo sugerida</span>
              <strong>{promotions[0].discount}</strong>
            </li>
          </ul>
          {!user?.vip && <p className="modal-note">Los servicios VIP aparecen al simular la compra VIP desde el inicio.</p>}
        </aside>
      </div>
    </div>
  );
};

export default Booking;
