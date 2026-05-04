import React from 'react';
import { Link } from 'react-router-dom';

export const Login: React.FC = () => {
  return (
    <div className="auth-page">
      <form className="auth-card">
        <span className="eyebrow">Acceso</span>
        <h1>Iniciar sesión</h1>
        <div className="form-grid">
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
            Entrar
          </button>
          <Link to="/register" className="btn btn-outline">
            Crear cuenta
          </Link>
        </div>
      </form>
    </div>
  );
};

export default Login;
