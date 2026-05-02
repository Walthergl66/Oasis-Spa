import React from 'react';
import { Link } from 'react-router-dom';
import { promotions } from '../../data/mockData';

export const Promotions: React.FC = () => {
  return (
    <div className="promotions-page">
      <span className="eyebrow">Promociones</span>
      <h1>Ofertas activas</h1>
      <div className="grid section">
        {promotions.map((promo) => (
          <article className="card" key={promo.title}>
            <span className="badge warning">Disponible</span>
            <h3>{promo.title}</h3>
            <p className="muted">{promo.description}</p>
            <p className="price">{promo.discount}</p>
            <div className="row-actions">
              <Link className="btn btn-primary" to="/booking">
                Usar promocion
              </Link>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Promotions;
