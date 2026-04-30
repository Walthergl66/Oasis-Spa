import React from 'react';

export const Dashboard: React.FC = () => {
  const stats = [
    { label: 'Citas hoy', value: '12' },
    { label: 'Ingresos', value: '$480k' },
    { label: 'Clientes', value: '86' },
    { label: 'Ocupacion', value: '74%' },
  ];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Admin</span>
          <h1>Dashboard</h1>
          <p className="lead">Resumen operativo basico para Oasis Spa.</p>
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

      <section className="section card">
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
            <tr>
              <td>Maria Lopez</td>
              <td>Masaje relajante</td>
              <td>10:00</td>
              <td><span className="badge success">Confirmada</span></td>
            </tr>
            <tr>
              <td>Andres Ruiz</td>
              <td>Limpieza facial</td>
              <td>12:30</td>
              <td><span className="badge warning">Pendiente</span></td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default Dashboard;
