import React from 'react';
import { users } from '../../data/mockData';

export const AdminStaff: React.FC = () => {
  return (
    <div className="admin-staff">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Usuarios</span>
          <h1>Gestión de usuarios</h1>
          <p className="lead">Visualización de clientes, frecuencia de visitas y distinción VIP.</p>
        </div>
        <button className="btn btn-primary" type="button">
          Exportar
        </button>
      </div>

      <section className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Visitas</th>
              <th>VIP</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.phone}</td>
                <td>{user.visits}</td>
                <td>
                  <span className={`badge ${user.vip ? 'vip' : 'warning'}`}>{user.vip ? 'VIP' : 'Regular'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default AdminStaff;
