import { PROMOTIONS, REVIEWS } from '../data.js'

export default function ClientPromotions({ onBook, services }) {
  return (
    <div className="page">
      <div className="section-title">
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>✦ OFERTAS DE TEMPORADA</div>
          <h2>Promociones para consentirte</h2>
        </div>
      </div>

      <div className="promo-grid">
        {PROMOTIONS.map(p => (
          <div className={`promo-card promo-${p.color}`} key={p.id}>
            <img className="promo-bg" src={p.img} alt="" aria-hidden="true" />
            <div className="promo-overlay" />
            <div className="promo-content">
              <div className="promo-badge">{p.badge}</div>
              <div className="promo-title">{p.title}</div>
              <div className="promo-desc">{p.desc}</div>
              <div className="promo-footer">
                <div className="promo-price">
                  {p.ahora != null ? (
                    <>
                      <span className="promo-antes">${p.antes}</span>
                      <span className="promo-ahora">${p.ahora}</span>
                    </>
                  ) : (
                    <span className="promo-valid-inline">{p.valid}</span>
                  )}
                </div>
                <button
                  className="btn-promo"
                  onClick={() => {
                    const svc = services.find(s => p.servicios.includes(s.name))
                    if (svc) onBook(svc)
                  }}
                >
                  Reservar
                </button>
              </div>
              <div className="promo-valid">🕐 {p.valid}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="section-title" style={{ marginTop: 50 }}>
        <div>
          <div className="eyebrow" style={{ marginBottom: 6 }}>✦ LO QUE DICEN DE NOSOTRAS</div>
          <h2>Reseñas de clientas</h2>
        </div>
      </div>

      <div className="reviews-grid">
        {REVIEWS.map(r => (
          <div className="review-card" key={r.id}>
            <div className="review-head">
              <div className="review-avatar">{r.initials}</div>
              <div>
                <div className="review-name">{r.name}</div>
                <div className="review-service">{r.service}</div>
              </div>
              <div className="review-stars">{'★'.repeat(r.rating)}{'☆'.repeat(5 - r.rating)}</div>
            </div>
            <p className="review-text">"{r.text}"</p>
            <div className="review-date">{r.date}</div>
          </div>
        ))}
      </div>
    </div>
  )
}
