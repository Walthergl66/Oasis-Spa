import React from 'react';

export const Appointments: React.FC = () => {
  const appointments = [
    { service: 'Masaje relajante', date: '12 Mayo', time: '10:00', status: 'Confirmada' },
    { service: 'Limpieza facial', date: '18 Mayo', time: '16:30', status: 'Pendiente' },
  ];

  return (
    <div className="appointments-page">
      <span className="eyebrow">Mis citas</span>
      <h1>Proximas reservas</h1>
      <div className="grid two section">
        {appointments.map((appointment) => (
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
