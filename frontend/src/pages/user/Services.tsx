import React from 'react';
import { Link } from 'react-router-dom';
import { formatCurrency, services } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';

export const Services: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const visibleServices = services.filter((service) => !service.vipOnly || user?.vip);

  return (
    <div className="services-page">
      <div className="section-header">
        <div>
          <span className="eyebrow">Servicios</span>
          <h1>Catalogo de bienestar</h1>
          <p className="lead">Tratamientos pensados para elegir con calma antes de reservar.</p>
        </div>
        <Link to="/booking" className="btn btn-primary">
          Nueva reserva
        </Link>
      </div>

      <div className="grid">
        {visibleServices.map((service) => (
          <article className="card" key={service.name}>
            <span className={`badge ${service.vipOnly ? 'vip' : 'success'}`}>{service.tag}</span>
            <h3>{service.name}</h3>
            <p className="muted">{service.description}</p>
            <div className="meta">
              <span>{service.duration}</span>
              <span className="price">{formatCurrency(service.price)}</span>
            </div>
            <Link to="/booking" className="btn btn-outline card-action">
              Elegir servicio
            </Link>
          </article>
        ))}
      </div>
      {!user?.vip && (
        <div className="section vip-callout">
          <span className="eyebrow">VIP oculto</span>
          <h2>Hay rituales exclusivos esperando</h2>
          <p>Activa VIP desde el inicio para ver ceremonias privadas, agenda preferente y suites de pareja.</p>
        </div>
      )}
    </div>
  );
};

export default Services;
