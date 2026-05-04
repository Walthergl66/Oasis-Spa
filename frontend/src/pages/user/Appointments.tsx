import React from 'react';
import { appointments } from '../../data/mockData';

export const Appointments: React.FC = () => {
  return (
    <div className="appointments-page">
      <span className="eyebrow">Mis citas</span>
      <h1>Próximas reservas</h1>
      <div className="grid two section">
        {appointments.slice(0, 2).map((appointment) => (
          <article className="card" key={`${appointment.service}-${appointment.date}`}>
            <span className={`badge ${appointment.status === 'Confirmada' ? 'success' : 'warning'}`}>
              {appointment.status}
            </span>
            <h3>{appointment.service}</h3>
            <p className="muted">
              {appointment.date} a las {appointment.time}
            </p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button">
                Reprogramar
              </button>
              <button className="btn btn-outline" type="button">
                Cancelar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Appointments;
