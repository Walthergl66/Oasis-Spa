import { SERVICES, PROMOTIONS } from '../data.js'

export default function ClientHome({ onBook, onNavigate }) {
  const promo = PROMOTIONS[0]
  return (
    <div className="page">
      <div className="banner">
        <img className="banner-bg" src="/img/hero.jpg" alt="" aria-hidden="true" />
        <div className="eyebrow">✦ BIENVENIDA</div>
        <h1>Hola, Adriana.</h1>
        <p>Tu próxima cita es en 2 días. Estamos listas para ti.</p>
        <button className="btn-primary" onClick={() => onNavigate('reservas')}>Ver mis reservas →</button>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">PRÓXIMA CITA</div>
          <div className="stat-value">22 Julio</div>
          <div className="stat-sub">14:30 · Uñas</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">RESERVAS ACTIVAS</div>
          <div className="stat-value">2</div>
          <div className="stat-sub">esta semana</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">PUNTOS ACUMULADOS</div>
          <div className="stat-value">340 pts</div>
          <div className="stat-sub">nivel Ámbar</div>
        </div>
      </div>

      <div className="section-title">
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>✦ DESTACADOS</div>
          <h2>Servicios populares</h2>
        </div>
        <button className="link-more" onClick={() => onNavigate('servicios')}>Ver todos →</button>
      </div>
      <div className="grid-services">
        {SERVICES.filter(s => s.popular).map(s => (
          <div className="service-card" key={s.id}>
            <div className="service-img">
              <img src={s.img} alt={s.name} loading="lazy" />
              <div className="popular-tag">POPULAR</div>
              <div className="price-tag">${s.price}</div>
            </div>
            <div className="service-body">
              <div className="service-name">{s.name}</div>
              <div className="service-meta">⏱ {s.duration} min · ★ {s.rating}</div>
              <button className="btn-outline-book" onClick={() => onBook(s)}>Reservar</button>
            </div>
          </div>
        ))}
      </div>

      {/* Banner de promoción */}
      <div className="home-promo" onClick={() => onNavigate('promociones')}>
        <div className="home-promo-badge">{promo.badge}</div>
        <div className="home-promo-text">
          <div className="home-promo-title">{promo.title}</div>
          <div className="home-promo-desc">{promo.desc}</div>
        </div>
        <button className="btn-primary">Ver promociones →</button>
      </div>
    </div>
  )
}
