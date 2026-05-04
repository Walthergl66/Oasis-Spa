import { useEffect, useRef, useState } from 'react';
import { useAuthStore } from '../../store/authStore';

type AuthSplitPanelProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthSplitPanel({ open, onClose }: AuthSplitPanelProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('Cliente Oasis');
  const [email, setEmail] = useState('cliente@oasis.com');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [visible, setVisible] = useState(false);
  const [rendered, setRendered] = useState(false);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const setUser = useAuthStore((state) => state.setUser);

  /* ── Mount / unmount con animación ── */
  useEffect(() => {
    if (open) {
      setRendered(true);
      const t = setTimeout(() => {
        setVisible(true);
        document.body.classList.add('split-login-open');
        document.body.style.overflow = 'hidden'; // bloquear scroll de fondo
        firstInputRef.current?.focus();
      }, 20);
      return () => clearTimeout(t);
    } else {
      setVisible(false);
      document.body.classList.remove('split-login-open');
      document.body.style.overflow = ''; // restaurar scroll
      const t = setTimeout(() => setRendered(false), 700);
      return () => clearTimeout(t);
    }
  }, [open]);

  /* Limpieza de emergencia al desmontar el componente */
  useEffect(() => {
    return () => {
      document.body.classList.remove('split-login-open');
      document.body.style.overflow = '';
    };
  }, []);


  /* Cerrar con Escape */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!rendered) return null;

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUser({
      id: role === 'admin' ? 'admin-001' : 'client-001',
      name: mode === 'register' ? name : role === 'admin' ? 'Administradora Oasis' : 'Cliente Oasis',
      email,
      role,
      vip: false,
    });
    onClose();
  };

  return (
    <div
      className={`split-panel-overlay${visible ? ' split-panel-overlay--visible' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar sesión"
    >
      {/* Lado izquierdo: fondo visual */}
      <div className="split-panel-left" onClick={onClose} aria-label="Cerrar">
        <div className="split-panel-left-overlay" />
        <div className="split-panel-left-content">
          <p className="split-eyebrow">Oasis Spa</p>
          <h2 className="split-headline">
            Un espacio<br />
            <em>para ti</em>
          </h2>
          <p className="split-subline">Rituales de bienestar · Reservas premium</p>
          <p className="split-close-hint">Haz clic aquí para volver</p>
        </div>
      </div>

      {/* Lado derecho: formulario */}
      <div className="split-panel-right">
        <button
          className="split-close-btn"
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de login"
        >
          ✕
        </button>

        <div className="split-form-wrapper">
          <p className="split-eyebrow" style={{ color: 'var(--gold)' }}>Acceso privado</p>
          <h2 className="split-form-title">
            {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
          </h2>

          {/* Segmented control */}
          <div className="split-segmented" aria-label="Modo de autenticación">
            <button
              type="button"
              className={`split-seg-btn${mode === 'login' ? ' split-seg-btn--active' : ''}`}
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              className={`split-seg-btn${mode === 'register' ? ' split-seg-btn--active' : ''}`}
              onClick={() => setMode('register')}
            >
              Registrarme
            </button>
          </div>

          <form className="split-form" onSubmit={submit}>
            {mode === 'register' && (
              <div className="split-field">
                <label htmlFor="sp-name">Nombre</label>
                <input
                  id="sp-name"
                  ref={firstInputRef}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Tu nombre"
                  autoComplete="name"
                />
              </div>
            )}

            <div className="split-field">
              <label htmlFor="sp-email">Correo electrónico</label>
              <input
                id="sp-email"
                ref={mode === 'login' ? firstInputRef : undefined}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
            </div>

            <div className="split-field">
              <label htmlFor="sp-password">Contraseña</label>
              <input
                id="sp-password"
                type="password"
                defaultValue="oasis123"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="split-field">
              <label htmlFor="sp-role">Entrar como</label>
              <select
                id="sp-role"
                value={role}
                onChange={(e) => setRole(e.target.value as 'user' | 'admin')}
              >
                <option value="user">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>

            <button className="split-submit-btn" type="submit">
              {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
            </button>
          </form>

          <p className="split-note">Autenticación simulada · no modifica el backend</p>
        </div>
      </div>
    </div>
  );
}
