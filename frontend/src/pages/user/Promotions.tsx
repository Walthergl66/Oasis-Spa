import React from 'react';

export const Promotions: React.FC = () => {
  const promotions = [
    { title: 'Duo relajante', description: 'Dos masajes de 60 minutos con 15% de descuento.' },
    { title: 'Facial de temporada', description: 'Limpieza facial con hidratacion incluida.' },
    { title: 'Ritual completo', description: 'Paquete corporal premium para fines de semana.' },
  ];

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
            <div className="row-actions">
              <button className="btn btn-primary" type="button">
                Usar promocion
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default Promotions;
