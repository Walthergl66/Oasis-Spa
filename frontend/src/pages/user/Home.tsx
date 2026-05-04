import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { formatCurrency, promotions, services } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';

export const Home: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiMessage, setApiMessage] = useState('Consultando backend existente...');
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    api
      .health()
      .then((message) => {
        setApiStatus(message.includes('simulados') ? 'offline' : 'online');
        setApiMessage(message || 'Backend conectado');
      })
      .catch(() => {
        setApiStatus('offline');
        setApiMessage('Sin endpoints de negocio disponibles; frontend operando con mocks.');
      });
  }, []);

  const becomeVip = () => {
    setUser({
      id: user?.id || 'client-001',
      name: user?.name || 'Cliente Oasis',
      email: user?.email || 'cliente@oasis.com',
      role: user?.role || 'user',
      vip: true,
    });
  };

  return (
    <div className="home-page">
      <section className="hero-section">
        <div className="hero-media">
          <div className="hero-overlay" />
          <div className="hero-copy">
            <span className="eyebrow">Oasis Spa</span>
            <h1>Rituales de calma para volver a habitarte</h1>
            <p className="lead">
              Un sistema de reservas premium, ligero y sereno para clientes que buscan masajes,
              faciales, rituales corporales y beneficios VIP en una experiencia sin friccion.
            </p>
            <div className="hero-actions">
              <Link to="/booking" className="btn btn-primary">
                Agendar cita
              </Link>
              <Link to="/promotions" className="btn btn-glass">
                Ver promociones
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="home-content">
        <section className="section intro-band">
          <div>
            <span className="eyebrow">Experiencia boho minimalista</span>
            <h2>Agenda, promociones y bienestar VIP en un solo lugar</h2>
            <p className="lead">
              La interfaz consume API cuando existe y simula en frontend lo que el backend aun no expone,
              manteniendo intacta la capa Nest existente.
            </p>
          </div>
          <div className="status-card">
            <div>
              <strong>Estado del backend</strong>
              <p className="muted">{apiMessage}</p>
            </div>
            <span className={`status-pill ${apiStatus === 'online' ? 'online' : 'offline'}`}>
              {apiStatus === 'checking' ? 'Revisando' : apiStatus === 'online' ? 'Conectado' : 'Mock activo'}
            </span>
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
            {services.slice(0, 3).map((service) => (
              <article className="card" key={service.name}>
                <span className="badge success">{service.tag}</span>
                <h3>{service.name}</h3>
                <p className="muted">{service.description}</p>
                <div className="meta">
                  <span>{service.duration}</span>
                  <span className="price">{formatCurrency(service.price)}</span>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section promo-band">
          <div>
            <span className="eyebrow">Promociones</span>
            <h2>{promotions[0].title}</h2>
            <p>{promotions[0].description}</p>
          </div>
          <Link className="btn btn-primary" to="/booking">
            Reservar con {promotions[0].discount}
          </Link>
        </section>

        <section className="section vip-section">
          <div>
            <span className="eyebrow">Membresia VIP</span>
            <h2>Acceso a rituales privados y agenda preferente</h2>
            <p className="lead">Compra simulada en frontend: activa insignia VIP y desbloquea servicios exclusivos.</p>
          </div>
          <button className="btn btn-primary" type="button" onClick={becomeVip}>
            {user?.vip ? 'VIP activo' : 'Simular compra VIP'}
          </button>
        </section>
      </div>
    </div>
  );
};

export default Home;
