import React from 'react';

export const AdminAppointments: React.FC = () => {
  return (
    <div className="admin-appointments">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Agenda</span>
          <h1>Gestion de citas</h1>
        </div>
        <button className="btn btn-primary" type="button">Agregar</button>
      </div>
      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Servicio</th>
              <th>Fecha</th>
              <th>Profesional</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {[
              ['Maria Lopez', 'Masaje relajante', '12 Mayo 10:00', 'Laura', 'Confirmada'],
              ['Camila Torres', 'Ritual corporal', '12 Mayo 15:00', 'Sofia', 'Pendiente'],
              ['Andres Ruiz', 'Facial', '13 Mayo 11:30', 'Nicolas', 'Confirmada'],
            ].map((row) => (
              <tr key={row.join('-')}>
                {row.slice(0, 4).map((cell) => <td key={cell}>{cell}</td>)}
                <td>
                  <span className={`badge ${row[4] === 'Confirmada' ? 'success' : 'warning'}`}>
                    {row[4]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminAppointments;
