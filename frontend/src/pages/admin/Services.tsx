import React from 'react';
import { formatCurrency, services } from '../../data/mockData';

export const AdminServices: React.FC = () => {
  return (
    <div className="admin-services">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Catálogo</span>
          <h1>Servicios</h1>
          <p className="lead">Portafolio disponible para clientes regulares y experiencias VIP.</p>
        </div>
        <button className="btn btn-primary" type="button">
          Nuevo servicio
        </button>
      </div>
      <div className="grid">
        {services.map((service) => (
          <article className="card" key={service.id}>
            <span className={`badge ${service.vipOnly ? 'vip' : 'success'}`}>{service.vipOnly ? 'VIP' : 'Activo'}</span>
            <h3>{service.name}</h3>
            <p className="muted">{service.duration}</p>
            <p className="price">{formatCurrency(service.price)}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button">
                Editar
              </button>
              <button className="btn btn-outline" type="button">
                Pausar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminServices;
