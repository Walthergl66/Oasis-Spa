import React from 'react';
import { EmptyState, Loader } from '../../components/ui/Feedback';
import { useBooking } from '../../hooks/useBooking';
import { useCatalogStore } from '../../store/catalogStore';
import { useUIStore } from '../../store/uiStore';
import { timeAgo } from '../../utils/date';

export const Promotions: React.FC = () => {
  const promotions = useCatalogStore(state => state.promotions);
  const reviews = useCatalogStore(state => state.reviews);
  const loading = useCatalogStore(state => state.loading);
  const { bookById } = useBooking();
  const toast = useUIStore(state => state.toast);

  if (loading && promotions.length === 0) return <Loader />;

  return (
    <div className="page">
      <div className="section-title">
        <div>
          <div className="eyebrow mb-sm">✦ OFERTAS DE TEMPORADA</div>
          <h2>Promociones para consentirte</h2>
        </div>
      </div>

      {promotions.length === 0 ? (
        <EmptyState icon="🎁" title="Sin promociones vigentes" text="Vuelve pronto: publicamos nuevas ofertas cada mes." />
      ) : (
        <div className="promo-grid">
          {promotions.map(promotion => (
            <div className={`promo-card promo-${promotion.color}`} key={promotion.id}>
              <img className="promo-bg" src={promotion.image} alt="" aria-hidden="true" />
              <div className="promo-overlay" />
              <div className="promo-content">
                <div className="promo-badge">{promotion.badge}</div>
                <div className="promo-title">{promotion.title}</div>
                <div className="promo-desc">{promotion.description}</div>
                <div className="promo-footer">
                  <div className="promo-price">
                    {promotion.priceNow != null ? (
                      <>
                        {promotion.priceBefore != null && <span className="promo-antes">${promotion.priceBefore}</span>}
                        <span className="promo-ahora">${promotion.priceNow}</span>
                      </>
                    ) : (
                      <span className="promo-valid-inline">{promotion.validText}</span>
                    )}
                  </div>
                  <button
                    className="btn-promo"
                    onClick={() => {
                      const serviceId = promotion.serviceIds[0];
                      if (serviceId) bookById(serviceId);
                      else toast('Esta promoción aplica a cualquier servicio del catálogo.', 'info');
                    }}
                  >
                    Reservar
                  </button>
                </div>
                <div className="promo-valid">🕐 {promotion.validText}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="section-title mt-lg">
        <div>
          <div className="eyebrow mb-sm">✦ LO QUE DICEN DE NOSOTRAS</div>
          <h2>Reseñas de clientas</h2>
        </div>
      </div>

      {reviews.length === 0 ? (
        <EmptyState icon="⭐" title="Todavía no hay reseñas" text="Después de tu próxima visita podrás dejar la primera." />
      ) : (
        <div className="reviews-grid">
          {reviews.slice(0, 6).map(review => (
            <div className="review-card" key={review.id}>
              <div className="review-head">
                <div className="review-avatar">{review.initials}</div>
                <div>
                  <div className="review-name">{review.clientName}</div>
                  <div className="review-service">{review.serviceName}</div>
                </div>
                <div className="review-stars">{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</div>
              </div>
              <p className="review-text">"{review.text}"</p>
              <div className="review-date">{timeAgo(review.createdAt)}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Promotions;
