import React from 'react';
import { Link } from 'react-router-dom';

export const Register: React.FC = () => {
  return (
    <div className="auth-page">
      <form className="auth-card">
        <span className="eyebrow">Registro</span>
        <h1>Crear cuenta</h1>
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="name">Nombre</label>
            <input id="name" placeholder="Tu nombre" />
          </div>
          <div className="field full">
            <label htmlFor="email">Correo</label>
            <input id="email" type="email" placeholder="tu@correo.com" />
          </div>
          <div className="field full">
            <label htmlFor="password">Contraseña</label>
            <input id="password" type="password" placeholder="********" />
          </div>
        </div>
        <div className="form-actions">
          <button className="btn btn-primary" type="button">
            Registrarme
          </button>
          <Link to="/login" className="btn btn-outline">
            Ya tengo cuenta
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Register;
