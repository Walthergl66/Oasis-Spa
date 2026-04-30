import React from 'react';

export const Booking: React.FC = () => {
  return (
    <div className="booking-page">
      <span className="eyebrow">Reservas</span>
      <h1>Crear solicitud de cita</h1>
      <p className="lead">
        Formulario visual listo para conectar cuando el backend tenga endpoints de reservas.
      </p>

      <div className="booking-layout section">
        <form className="card">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="name">Nombre</label>
              <input id="name" placeholder="Tu nombre" />
            </div>
            <div className="field">
              <label htmlFor="phone">Telefono</label>
              <input id="phone" placeholder="300 000 0000" />
            </div>
            <div className="field">
              <label htmlFor="service">Servicio</label>
              <select id="service" defaultValue="">
                <option value="" disabled>
                  Selecciona un servicio
                </option>
                <option>Masaje relajante</option>
                <option>Limpieza facial</option>
                <option>Ritual corporal</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="date">Fecha</label>
              <input id="date" type="date" />
            </div>
            <div className="field">
              <label htmlFor="time">Hora</label>
              <select id="time" defaultValue="">
                <option value="" disabled>
                  Elige hora
                </option>
                <option>09:00</option>
                <option>11:30</option>
                <option>15:00</option>
                <option>17:30</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="people">Personas</label>
              <input id="people" type="number" min="1" defaultValue="1" />
            </div>
            <div className="field full">
              <label htmlFor="notes">Notas</label>
              <textarea id="notes" placeholder="Preferencias, alergias o comentarios" />
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="button">
              Guardar borrador
            </button>
            <button className="btn btn-outline" type="reset">
              Limpiar
            </button>
          </div>
        </form>

        <aside className="panel card">
          <span className="eyebrow">Resumen</span>
          <h2>Flujo preparado</h2>
          <ul className="summary-list">
            <li>
              <span>Endpoint actual</span>
              <strong>GET /</strong>
            </li>
            <li>
              <span>Reservas</span>
              <strong>Pendiente API</strong>
            </li>
            <li>
              <span>Estado</span>
              <strong>Interfaz lista</strong>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default Booking;
