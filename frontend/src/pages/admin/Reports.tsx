import React from 'react';

export const AdminReports: React.FC = () => {
  return (
    <div className="admin-reports">
      <div className="admin-header">
        <div>
          <span className="eyebrow">Reportes</span>
          <h1>Indicadores</h1>
        </div>
      </div>
      <div className="admin-content-grid">
        <section className="card">
          <h2>Servicios mas reservados</h2>
          <ul className="data-list">
            <li className="data-row"><span>Masaje relajante</span><strong>42%</strong></li>
            <li className="data-row"><span>Limpieza facial</span><strong>28%</strong></li>
            <li className="data-row"><span>Ritual corporal</span><strong>18%</strong></li>
          </ul>
        </section>
        <section className="card">
          <h2>Resumen mensual</h2>
          <ul className="data-list">
            <li className="data-row"><span>Citas completadas</span><strong>128</strong></li>
            <li className="data-row"><span>Cancelaciones</span><strong>9</strong></li>
            <li className="data-row"><span>Satisfaccion</span><strong>4.8/5</strong></li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default AdminReports;
