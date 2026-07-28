import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ErrorMessage } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';

export const Register: React.FC = () => {
  const register = useAuthStore(state => state.register);
  const toast = useUIStore(state => state.toast);
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', phone: '', city: 'Manta, Manabí', password: '', confirm: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof typeof form, value: string) => setForm(current => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, password: form.password, phone: form.phone, city: form.city });
      toast('¡Cuenta creada! Bienvenida a Spa & Belleza.');
      navigate('/', { replace: true });
    } catch {
      setError(useAuthStore.getState().error ?? 'No pudimos crear tu cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-aside">
        <img src="/img/spa.jpg" alt="" aria-hidden="true" />
        <h2>Crea tu cuenta y gana beneficios.</h2>
        <p>Acumula puntos en cada visita, guarda tus servicios favoritos y recibe recordatorios de tus citas.</p>
      </div>

      <div className="auth-panel">
        <form className="auth-form" onSubmit={submit}>
          <div className="logo mb-md">Spa<span>&amp; BELLEZA</span></div>
          <h1>Crear cuenta</h1>
          <p className="auth-sub">Es rápido: sólo necesitamos tus datos de contacto.</p>

          {error && <ErrorMessage message={error} />}

          <Input label="NOMBRE COMPLETO" value={form.name} onChange={e => set('name', e.target.value)} placeholder="Adriana Torres" required />
          <Input label="CORREO ELECTRÓNICO" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" autoComplete="email" required />
          <div className="form-grid">
            <Input label="TELÉFONO" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="099 000 0000" />
            <Input label="CIUDAD" value={form.city} onChange={e => set('city', e.target.value)} />
            <Input label="CONTRASEÑA" type="password" value={form.password} onChange={e => set('password', e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" required />
            <Input label="REPETIR CONTRASEÑA" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} autoComplete="new-password" required />
          </div>

          <button className="btn-continue" type="submit" disabled={loading}>
            {loading ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>

          <div className="auth-switch">
            ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
