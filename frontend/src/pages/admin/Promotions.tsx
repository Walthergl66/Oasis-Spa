import React, { useState } from 'react';
import { api } from '../../services/api';
import { promotions as mockPromotions, type Promotion } from '../../data/mockData';

export const AdminPromotions: React.FC = () => {
  const [promotions, setPromotions] = useState<Promotion[]>(mockPromotions);
  const [title, setTitle] = useState('');
  const [discount, setDiscount] = useState('10%');

  const createPromotion = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const promotion: Promotion = {
      id: `promo-${Date.now()}`,
      title: title || 'Nueva promoción',
      discount,
      description: 'Promoción creada desde frontend y conectable al endpoint real cuando exista.',
      status: 'Activa',
    };
    const next = [promotion, ...promotions];
    setPromotions(next);
    await api.createPromotion(promotion, next);
    setTitle('');
    setDiscount('10%');
  };

  return (
    <div className="admin-promotions">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Marketing</span>
          <h1>Promociones</h1>
          <p className="lead">Creación ligera de campañas sin depender de cambios en backend.</p>
        </div>
      </div>
      <form className="card promo-form" onSubmit={createPromotion}>
        <div className="field">
          <label htmlFor="promo-title">Nombre</label>
          <input id="promo-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Ritual de luna" />
        </div>
        <div className="field">
          <label htmlFor="promo-discount">Descuento</label>
          <input id="promo-discount" value={discount} onChange={(event) => setDiscount(event.target.value)} />
        </div>
        <button className="btn btn-primary" type="submit">
          Crear promoción
        </button>
      </form>
      <div className="grid two section">
        {promotions.map((promotion) => (
          <article className="card" key={promotion.id}>
            <span className={`badge ${promotion.status === 'Activa' ? 'success' : 'warning'}`}>{promotion.status}</span>
            <h3>{promotion.title}</h3>
            <p className="muted">{promotion.description}</p>
            <p className="price">{promotion.discount}</p>
            <div className="row-actions">
              <button className="btn btn-secondary" type="button">
                Editar
              </button>
              <button className="btn btn-outline" type="button">
                Finalizar
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default AdminPromotions;
