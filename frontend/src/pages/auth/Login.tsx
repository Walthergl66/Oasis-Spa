import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';

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
      // El personal entra directo a su componente; la clienta, a la portada.
      navigate(
        user.role === 'cliente' ? (from ?? '/') : '/admin/dashboard',
        { replace: true },
      );
    } catch {
      setError(useAuthStore.getState().error ?? 'No pudimos iniciar sesión.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-aside">
        <img src="/img/hero.jpg" alt="" aria-hidden="true" />
        <h2>Tu momento de calma empieza aquí.</h2>
        <p>Agenda tus citas, sigue tus puntos de fidelidad y deja que Luna reserve por ti en segundos.</p>
      </div>

      <div className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="logo mb-md">Oasis<span>SPA</span></div>
          <h1>Iniciar sesión</h1>
          <p className="auth-sub">Ingresa con tu correo para ver tus reservas.</p>

          {error && <ErrorMessage message={error} />}

          <Input
            label="CORREO ELECTRÓNICO"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="tu@correo.com"
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

          <div className="auth-switch">
            ¿Aún no tienes cuenta? <Link to="/register">Regístrate</Link>
          </div>

          <div className="auth-demo">
            <strong>Cuentas de prueba</strong><br />
            Clienta: adriana.torres@email.com · demo1234<br />
            Administración: admin@oasisspa.ec · admin1234
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
