import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
};

export function AuthModal({ open, onClose }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('Cliente Oasis');
  const [email, setEmail] = useState('cliente@oasis.com');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const setUser = useAuthStore((state) => state.setUser);

  if (!open) {
    return null;
  }

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="auth-modal">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          x
        </button>
        <span className="eyebrow">Acceso privado</span>
        <h2 id="auth-title">{mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}</h2>
        <div className="segmented" aria-label="Modo de autenticacion">
          <button className={mode === 'login' ? 'active' : ''} type="button" onClick={() => setMode('login')}>
            Login
          </button>
          <button className={mode === 'register' ? 'active' : ''} type="button" onClick={() => setMode('register')}>
            Registro
          </button>
        </div>
        <form onSubmit={submit}>
          {mode === 'register' && (
            <div className="field">
              <label htmlFor="modal-name">Nombre</label>
              <input id="modal-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
          )}
          <div className="field">
            <label htmlFor="modal-email">Correo</label>
            <input id="modal-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="modal-password">Contraseña</label>
            <input id="modal-password" type="password" defaultValue="oasis123" />
          </div>
          <div className="field">
            <label htmlFor="modal-role">Entrar como</label>
            <select id="modal-role" value={role} onChange={(event) => setRole(event.target.value as 'user' | 'admin')}>
              <option value="user">Cliente</option>
              <option value="admin">Administrador</option>
            </select>
          </div>
          <button className="btn btn-primary full-width" type="submit">
            {mode === 'login' ? 'Entrar' : 'Registrarme'}
          </button>
        </form>
        <p className="modal-note">Autenticacion simulada en frontend para no modificar el backend.</p>
      </div>
    </div>
  );
}
