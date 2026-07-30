import React from 'react';
import type { Service } from '../../types';

interface ServiceCardProps {
  service: Service;
  onBook: (service: Service) => void;
  /** Muestra la descripción completa (vista de catálogo). */
  detailed?: boolean;
  isFavorite?: boolean;
  onToggleFavorite?: (service: Service) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service, onBook, detailed = false, isFavorite = false, onToggleFavorite,
}) => (
  <div className="service-card">
    <div className="service-img">
      <img src={service.image} alt={service.name} loading="lazy" />
      {service.popular && <div className="popular-tag">POPULAR</div>}
      {onToggleFavorite && (
        <button
          className={`fav-btn ${isFavorite ? 'on' : ''}`.trim()}
          onClick={() => onToggleFavorite(service)}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        >
          {isFavorite ? '♥' : '♡'}
        </button>
      )}
      <div className="price-tag">${service.price}</div>
    </div>
    <div className="service-body">
      <div className="service-name">{service.name}</div>
      {detailed && <div className="service-desc">{service.description}</div>}
      <div className="service-meta">
        <span>⏱ {service.durationMin} min</span>
        <span>★ {service.rating} ({service.reviewsCount})</span>
      </div>
      <button className="btn-outline-book" onClick={() => onBook(service)}>Reservar</button>
    </div>
  </div>
);
