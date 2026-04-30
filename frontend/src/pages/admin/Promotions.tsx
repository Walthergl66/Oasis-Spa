import React from 'react';

export const AdminPromotions: React.FC = () => {
  return (
    <div className="admin-promotions">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Marketing</span>
          <h1>Promociones</h1>
        </div>
        <button className="btn btn-primary" type="button">Crear promo</button>
      </div>
      <div className="grid two">
        {[
          ['Duo relajante', '15%', 'Activa'],
          ['Facial temporada', '20%', 'Programada'],
        ].map(([name, discount, status]) => (
          <article className="card" key={name}>
            <span className={`badge ${status === 'Activa' ? 'success' : 'warning'}`}>{status}</span>
            <h3>{name}</h3>
            <p className="muted">Descuento: {discount}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button">Editar</button>
              <button className="btn btn-outline" type="button">Finalizar</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminPromotions;
