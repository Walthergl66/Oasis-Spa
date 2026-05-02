import React from 'react';

export const Profile: React.FC = () => {
  return (
    <div className="profile-page">
      <span className="eyebrow">Perfil</span>
      <h1>Datos del cliente</h1>
      <div className="profile-layout section">
        <form className="card">
          <div className="form-grid">
            <div className="field">
              <label htmlFor="profile-name">Nombre</label>
              <input id="profile-name" defaultValue="Cliente Oasis" />
            </div>
            <div className="field">
              <label htmlFor="profile-email">Correo</label>
              <input id="profile-email" type="email" defaultValue="cliente@oasis.com" />
            </div>
            <div className="field">
              <label htmlFor="profile-phone">Telefono</label>
              <input id="profile-phone" defaultValue="300 000 0000" />
            </div>
            <div className="field">
              <label htmlFor="profile-pref">Preferencia</label>
              <select id="profile-pref" defaultValue="Tarde">
                <option>Manana</option>
                <option>Tarde</option>
                <option>Noche</option>
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn btn-primary" type="button">
              Guardar cambios
            </button>
          </div>
        </form>
        <aside className="card">
          <h2>Historial</h2>
          <ul className="summary-list">
            <li>
              <span>Citas realizadas</span>
              <strong>8</strong>
            </li>
            <li>
              <span>Servicio favorito</span>
              <strong>Masaje</strong>
            </li>
            <li>
              <span>Puntos</span>
              <strong>120</strong>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default Profile;
