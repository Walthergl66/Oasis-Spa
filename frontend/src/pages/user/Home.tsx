import React from 'react';
import { Link } from 'react-router-dom';
import { ExperiencesSection } from '../../components/home/ExperiencesSection';
import { promotions } from '../../data/mockData';
import { useAuthStore } from '../../store/authStore';

export const Home: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);

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
        <ExperiencesSection />
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
