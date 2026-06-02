import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import { promotions } from '../../data/mockData';
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
            <h1>Tu espacio consciente para ser</h1>
            <p className="lead">
              bienvend@ a tu oasis de bienestar: agenda, promociones y experiencias VIP en un solo lugar.
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
          <div className="section-header flex-between">
            <div>
              <span className="eyebrow-gold">CATÁLOGO</span>
              <h2 className="serif-title">Nuestras Experiencias</h2>
            </div>
            <Link to="/services" className="btn-pill-outline">
              Ver todos los servicios
            </Link>
          </div>

          <div className="services-grid">
            {/* Card 1: Nail Care & Art */}
            <article className="service-card">
              <div className="service-card-image-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1632345031435-8727f6897d03?q=80&w=800&auto=format&fit=crop" 
                  alt="Nail Care & Art" 
                  className="service-card-image"
                />
              </div>
              <div className="service-card-content">
                <h3>Nail Care & Art</h3>
                <p>
                  Esmaltado semipermanente, aplicaciones de Softgel y pedicura spa profunda. 
                  Un toque de distinción y cuidado para tus manos y pies.
                </p>
                <Link to="/booking" className="btn-pill-dark">
                  Agendar Manicura y Pedicura
                </Link>
              </div>
            </article>

            {/* Card 2: Professional Massages (Mirrored) */}
            <article className="service-card mirrored">
              <div className="service-card-image-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1519823551278-64ac92734fb1?q=80&w=800&auto=format&fit=crop" 
                  alt="Professional Massages" 
                  className="service-card-image"
                />
              </div>
              <div className="service-card-content">
                <h3>Professional Massages</h3>
                <p>
                  Terapia de masajes relajantes, drenaje linfático y recuperación post-operatoria. 
                  Reconecta con tu bienestar en un ambiente de calma total.
                </p>
                <Link to="/booking" className="btn-pill-dark">
                  Agendar Masaje
                </Link>
              </div>
            </article>

            {/* Card 3: Tratamientos Capilares (Full Width) */}
            <article className="service-card full-width">
              <div className="service-card-image-wrap">
                <img 
                  src="https://images.unsplash.com/photo-1522337660859-02fbefca4702?q=80&w=1200&auto=format&fit=crop" 
                  alt="Tratamientos Capilares" 
                  className="service-card-image"
                />
              </div>
              <div className="service-card-content">
                <h3>Tratamientos Capilares</h3>
                <p>
                  Ofrecemos keratinas avanzadas, tratamientos de hidratación profunda y 
                  rituales de restauración para un cabello deslumbrante, saludable y lleno de vida. 
                  Brillo excepcional desde la primera sesión.
                </p>
                <Link to="/booking" className="btn-pill-dark">
                  Agendar Tratamiento Capilar
                </Link>
              </div>
            </article>
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
