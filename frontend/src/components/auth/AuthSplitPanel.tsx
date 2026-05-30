import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const firstInputRef = useRef<HTMLInputElement>(null);
  const setUser = useAuthStore((state) => state.setUser);

  /* ── Manejo de clases del body y scroll ── */
  useEffect(() => {
    if (open) {
      document.body.classList.add('split-login-open');
      document.body.style.overflow = 'hidden';
      const t = setTimeout(() => firstInputRef.current?.focus(), 400);
      return () => clearTimeout(t);
    } else {
      document.body.classList.remove('split-login-open');
      document.body.style.overflow = '';
    }
  }, [open]);

  /* Limpieza de emergencia al desmontar */
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

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.4, ease: 'easeOut' }
    },
    exit: { 
      opacity: 0, 
      transition: { duration: 0.3, ease: 'easeIn', delay: 0.1 } 
    }
  };

  const panelVariants = {
    hidden: { x: '12%', opacity: 0 },
    visible: { 
      x: 0, 
      opacity: 1,
      transition: { 
        ease: [0.22, 1, 0.36, 1], 
        duration: 0.5 
      } 
    },
    exit: { 
      x: '8%', 
      opacity: 0,
      transition: { 
        ease: [0.22, 1, 0.36, 1], 
        duration: 0.4 
      } 
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="split-panel-overlay"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={containerVariants}
          role="dialog"
          aria-modal="true"
          aria-label="Iniciar sesión"
          style={{ pointerEvents: 'auto' }} // Sobrescribir el default de CSS si es necesario
        >
          {/* Lado izquierdo: fondo visual */}
          <motion.div 
            className="split-panel-left" 
            onClick={onClose} 
            aria-label="Cerrar"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="split-panel-left-overlay" />
            <motion.div 
              className="split-panel-left-content"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <p className="split-eyebrow">Oasis Spa</p>
              <h2 className="split-headline">
                Un espacio<br />
                <em>para ti</em>
              </h2>
              <p className="split-subline">Rituales de bienestar · Reservas premium</p>
              <p className="split-close-hint">Haz clic aquí para volver</p>
            </motion.div>
          </motion.div>

          {/* Lado derecho: formulario */}
          <motion.div 
            className="split-panel-right"
            variants={panelVariants}
          >
            <button
              className="split-close-btn"
              type="button"
              onClick={onClose}
              aria-label="Cerrar panel de login"
            >
              ✕
            </button>

            <div className="split-form-wrapper">
              <AnimatePresence mode="wait">
                <motion.h2 
                  key={mode}
                  className="split-form-title"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
                </motion.h2>
              </AnimatePresence>

              {/* Segmented control */}
              <motion.div 
                className="split-segmented" 
                aria-label="Modo de autenticación"
                variants={itemVariants}
                transition={{ delay: 0.5 }}
              >
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
                  registrarse
                </button>
              </motion.div>

              <motion.form 
                className="split-form" 
                onSubmit={submit}
                variants={itemVariants}
                transition={{ delay: 0.6 }}
              >
                <AnimatePresence mode="popLayout">
                  {mode === 'register' && (
                    <motion.div 
                      className="split-field"
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 22 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <label htmlFor="sp-name">Nombre</label>
                      <input
                        id="sp-name"
                        ref={firstInputRef}
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Tu nombre"
                        autoComplete="name"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

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

                {mode === 'login' && (
                  <button type="button" className="split-link-forgot">
                    ¿Olvidaste la contraseña?
                  </button>
                )}

                <AnimatePresence mode="wait">
                  <motion.button 
                    key={mode}
                    className="split-submit-btn" 
                    type="submit"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  >
                    {mode === 'login' ? 'ENTRAR' : 'Registrarme'}
                  </motion.button>
                </AnimatePresence>
              </motion.form>

              <motion.div 
                className="split-footer-invitation"
                variants={itemVariants}
                transition={{ delay: 0.7 }}
              >
                No tienes una cuenta? <button type="button" onClick={() => setMode('register')}>Registrate.</button>
              </motion.div>
            </div>

          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
