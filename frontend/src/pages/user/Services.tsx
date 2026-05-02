import React from 'react';
import { Link } from 'react-router-dom';

const services = [
  { name: 'Masaje relajante', duration: '60 min', price: '$45.000', tag: 'Mas solicitado' },
  { name: 'Limpieza facial profunda', duration: '45 min', price: '$38.000', tag: 'Facial' },
  { name: 'Ritual corporal Oasis', duration: '90 min', price: '$72.000', tag: 'Premium' },
  { name: 'Aromaterapia', duration: '40 min', price: '$32.000', tag: 'Relajacion' },
  { name: 'Piedras calientes', duration: '70 min', price: '$58.000', tag: 'Terapia' },
  { name: 'Manicure spa', duration: '50 min', price: '$30.000', tag: 'Belleza' },
];

export const Services: React.FC = () => {
  return (
    <div className="services-page">
      <div className="section-header">
        <div>
          <span className="eyebrow">Servicios</span>
          <h1>Catalogo de bienestar</h1>
          <p className="lead">Vista basica del catalogo para elegir tratamiento antes de reservar.</p>
        </div>
        <Link to="/booking" className="btn btn-primary">
          Nueva reserva
        </Link>
      </div>

      <div className="grid">
        {services.map((service) => (
          <article className="card" key={service.name}>
            <span className="badge success">{service.tag}</span>
            <h3>{service.name}</h3>
            <p className="muted">Incluye preparacion, atencion guiada y recomendaciones posteriores.</p>
            <div className="meta">
              <span>{service.duration}</span>
              <span className="price">{service.price}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Services;
