import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ServiceList } from '../../components/services/ServiceList';
import { Loader } from '../../components/ui/Feedback';
import { useBooking } from '../../hooks/useBooking';
import { useAppointmentsStore } from '../../store/appointmentsStore';
import { useAuthStore } from '../../store/authStore';
import { useCatalogStore } from '../../store/catalogStore';
import { daysFromToday, formatShortDate, toTime } from '../../utils/date';

export const Home: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const services = useCatalogStore(state => state.services);
  const promotions = useCatalogStore(state => state.promotions);
  const loading = useCatalogStore(state => state.loading);
  const upcoming = useAppointmentsStore(state => state.upcoming);
  const loadAppointments = useAppointmentsStore(state => state.load);
  const { book } = useBooking();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) void loadAppointments(user.id);
  }, [user, loadAppointments]);

  const next = upcoming[0];
  const promo = promotions[0];
  const popular = services.filter(service => service.popular);

  const greeting = (() => {
    if (!user) return 'Bienvenida a Oasis Spa.';
    if (!next) return 'No tienes citas próximas. ¿Nos vemos pronto?';
    const days = daysFromToday(next.start);
    if (days === 0) return `Tu cita de ${next.serviceName} es hoy a las ${toTime(next.start)}.`;
    if (days === 1) return `Tu cita de ${next.serviceName} es mañana a las ${toTime(next.start)}.`;
    return `Tu próxima cita es en ${days} días. Estamos listas para ti.`;
  })();

  if (loading && services.length === 0) return <Loader />;

  return (
    <div className="page">
      <div className="banner">
        <img className="banner-bg" src="/img/hero.jpg" alt="" aria-hidden="true" />
        <div className="eyebrow">✦ BIENVENIDA</div>
        <h1>{user ? `Hola, ${user.name.split(' ')[0]}.` : 'Tu momento de calma.'}</h1>
        <p>{greeting}</p>
        <button className="btn-primary" onClick={() => navigate(user ? '/appointments' : '/services')}>
          {user ? 'Ver mis reservas →' : 'Explorar servicios →'}
        </button>
      </div>

      {user && (
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-label">PRÓXIMA CITA</div>
            <div className="stat-value">{next ? formatShortDate(next.start) : '—'}</div>
            <div className="stat-sub">{next ? `${toTime(next.start)} · ${next.serviceName}` : 'Sin citas agendadas'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">RESERVAS ACTIVAS</div>
            <div className="stat-value">{upcoming.length}</div>
            <div className="stat-sub">{upcoming.length === 1 ? 'cita confirmada' : 'citas confirmadas'}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">PUNTOS ACUMULADOS</div>
            <div className="stat-value">{user.points} pts</div>
            <div className="stat-sub">nivel {user.level}</div>
          </div>
        </div>
      )}

      <div className="section-title">
        <div>
          <div className="eyebrow mb-sm">✦ DESTACADOS</div>
          <h2>Servicios populares</h2>
        </div>
        <button className="link-more" onClick={() => navigate('/services')}>Ver todos →</button>
      </div>
      <ServiceList services={popular} onBook={book} />

      {promo && (
        <div className="home-promo" onClick={() => navigate('/promotions')} role="button" tabIndex={0}>
          <div className="home-promo-badge">{promo.badge}</div>
          <div className="home-promo-text">
            <div className="home-promo-title">{promo.title}</div>
            <div className="home-promo-desc">{promo.description}</div>
          </div>
          <button className="btn-primary">Ver promociones →</button>
        </div>
      )}
    </div>
  );
};

export default Home;
