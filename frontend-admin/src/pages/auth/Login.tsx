import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

/**
 * Acceso al panel.
 *
 * No hay enlace de registro: las cuentas de personal y administración las crea
 * la propia administración, nunca se auto-registran.
 */
export const Login: React.FC = () => {
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      if (user.role === 'cliente') {
        // Una clienta con credenciales válidas no tiene nada que hacer aquí.
        useAuthStore.getState().logout();
        setError('Esta cuenta no tiene acceso al panel administrativo.');
        return;
      }
      navigate(from ?? '/dashboard', { replace: true });
    } catch {
      setError(useAuthStore.getState().error ?? 'No pudimos iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-aside">
        <img src="/img/spa.jpg" alt="" aria-hidden="true" />
        <h2>Panel administrativo</h2>
        <p>Agenda del día, catálogo de servicios, equipo, clientas y reportes de Oasis Spa.</p>
      </div>

      <div className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="logo mb-md">Oasis<span>SPA</span></div>
          <h1>Acceso interno</h1>
          <p className="auth-sub">Ingresa con tu cuenta de personal o administración.</p>

          {error && <ErrorMessage message={error} />}

          <Input
            label="CORREO ELECTRÓNICO"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="admin@oasisspa.ec"
            autoComplete="email"
            required
          />
          <Input
            label="CONTRASEÑA"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
          />

          <button className="btn-continue" type="submit" disabled={loading}>
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>

          <div className="auth-demo">
            <strong>Cuenta de prueba</strong><br />
            admin@oasisspa.ec · admin1234
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
