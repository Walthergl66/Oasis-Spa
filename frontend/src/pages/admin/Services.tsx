import React from 'react';

export const AdminServices: React.FC = () => {
  const services = [
    ['Masaje relajante', '60 min', '$45.000', 'Activo'],
    ['Limpieza facial', '45 min', '$38.000', 'Activo'],
    ['Ritual corporal', '90 min', '$72.000', 'Activo'],
  ];

  return (
    <div className="admin-services">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Catalogo</span>
          <h1>Servicios</h1>
        </div>
        <button className="btn btn-primary" type="button">Nuevo servicio</button>
      </div>
      <div className="grid">
        {services.map(([name, time, price, status]) => (
          <article className="card" key={name}>
            <span className="badge success">{status}</span>
            <h3>{name}</h3>
            <p className="muted">{time}</p>
            <p className="price">{price}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button">Editar</button>
              <button className="btn btn-outline" type="button">Pausar</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminServices;
