import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const featuredServices = [
  { name: 'Masaje relajante', time: '60 min', price: '$45.000' },
  { name: 'Limpieza facial', time: '45 min', price: '$38.000' },
  { name: 'Ritual corporal', time: '90 min', price: '$72.000' },
];

export const Home: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiMessage, setApiMessage] = useState('Consultando backend...');

  useEffect(() => {
    fetch('/backend-health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Backend no disponible');
        }
        return response.text();
      })
      .then((message) => {
        setApiStatus('online');
        setApiMessage(message || 'Backend conectado');
      })
      .catch(() => {
        setApiStatus('offline');
        setApiMessage('Backend sin respuesta en este momento');
      });
  }, []);

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-copy">
          <span className="eyebrow">Oasis Spa</span>
          <h1>Agenda bienestar sin complicarte la tarde</h1>
          <p className="lead">
            Interfaz base para consultar servicios, crear solicitudes de reserva y visualizar citas,
            alineada al backend actual sin tocar su codigo.
          </p>
          <div className="hero-actions">
            <Link to="/booking" className="btn btn-primary">
              Reservar cita
            </Link>
            <Link to="/services" className="btn btn-outline">
              Ver servicios
            </Link>
          </div>
          <div className="status-card">
            <div>
              <strong>Estado del backend</strong>
              <p className="muted">{apiMessage}</p>
            </div>
            <span className={`status-pill ${apiStatus === 'online' ? 'online' : 'offline'}`}>
              {apiStatus === 'checking' ? 'Revisando' : apiStatus === 'online' ? 'Conectado' : 'Offline'}
            </span>
          </div>
        </div>
        <div className="hero-panel">
          <div className="hero-panel-content">
            <span className="eyebrow">Hoy</span>
            <h2>3 servicios destacados</h2>
            <p>Una vista inicial clara para que el cliente encuentre y reserve rapido.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <div>
            <span className="eyebrow">Catalogo</span>
            <h2>Servicios principales</h2>
          </div>
          <Link to="/services" className="btn btn-secondary">
            Explorar
          </Link>
        </div>
        <div className="grid">
          {featuredServices.map((service) => (
            <article className="card" key={service.name}>
              <h3>{service.name}</h3>
              <p className="muted">Atencion personalizada con disponibilidad por agenda.</p>
              <div className="meta">
                <span>{service.time}</span>
                <span className="price">{service.price}</span>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;
