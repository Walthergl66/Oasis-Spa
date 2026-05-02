import React from 'react';
import { appointments, formatCurrency, promotions, users } from '../../data/mockData';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Citas hoy', value: appointments.length.toString() },
    { label: 'Ingresos estimados', value: formatCurrency(480000) },
    { label: 'Clientes', value: users.length.toString() },
    { label: 'VIP activos', value: users.filter((user) => user.vip).length.toString() },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Panel operativo</h1>
          <p className="lead">Agenda, clientes VIP y marketing en una sola vista funcional.</p>
        </div>
        <button className="btn btn-primary" type="button">
          Nueva cita
        </button>
      </div>

      <div className="stats-grid">
        {stats.map((stat) => (
          <article className="card" key={stat.label}>
            <p className="muted">{stat.label}</p>
            <div className="stat-value">{stat.value}</div>
          </article>
        ))}
      </div>

      <div className="admin-content-grid section">
        <section className="card">
          <h2>Agenda reciente</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Cliente</th>
                <th>Servicio</th>
                <th>Hora</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td>
                    {appointment.client} {appointment.vip && <span className="badge vip">VIP</span>}
                  </td>
                  <td>{appointment.service}</td>
                  <td>{appointment.time}</td>
                  <td>
                    <span className={`badge ${appointment.status === 'Confirmada' ? 'success' : 'warning'}`}>
                      {appointment.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="card">
          <h2>Promociones activas</h2>
          <ul className="data-list">
            {promotions.map((promotion) => (
              <li className="data-row" key={promotion.id}>
                <span>{promotion.title}</span>
                <strong>{promotion.discount}</strong>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
