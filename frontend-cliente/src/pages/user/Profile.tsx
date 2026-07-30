import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ErrorMessage, Loader } from '../../components/ui/Feedback';
import { Input } from '../../components/ui/Input';
import { errorMessage } from '../../api/http';
import { userService } from '../../services/user.service';
import { useAppointmentsStore } from '../../store/appointmentsStore';
import { useAuthStore } from '../../store/authStore';
import { useUIStore } from '../../store/uiStore';
import type { ClientSummary } from '../../types';
import { formatShortDate } from '../../utils/date';
import { levelProgress } from '../../utils/loyalty';

export const Profile: React.FC = () => {
  const user = useAuthStore(state => state.user);
  const setUser = useAuthStore(state => state.setUser);
  const logout = useAuthStore(state => state.logout);
  const loadAppointments = useAppointmentsStore(state => state.load);
  const toast = useUIStore(state => state.toast);
  const navigate = useNavigate();

  const [summary, setSummary] = useState<ClientSummary | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', city: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setForm({ name: user.name, email: user.email, phone: user.phone, city: user.city });
    void userService.getSummary(user.id).then(setSummary);
    void loadAppointments(user.id);
  }, [user, loadAppointments]);

  if (!user || !summary) return <Loader text="Cargando tu perfil…" />;

  const progress = levelProgress(user.points);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const updated = await userService.updateProfile(user!.id, form);
      setUser(updated);
      setEditing(false);
      toast('Datos actualizados.');
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  async function removeFavorite(serviceName: string) {
    const updated = await userService.toggleFavorite(user!.id, serviceName);
    setUser(updated);
  }

  return (
    <div className="page">
      <h2 className="page-title">Mi cuenta</h2>
      <p className="page-subtitle">Tus datos, tu progreso y tus preferencias.</p>

      <div className="profile-layout">
        <div className="profile-main">
          <div className="loyalty-card">
            <div className="loyalty-top">
              <div>
                <div className="loyalty-label">PROGRAMA DE FIDELIDAD</div>
                <div className="loyalty-level">Nivel {user.level}</div>
              </div>
              <div className="loyalty-points">
                <div className="loyalty-points-num">{user.points}</div>
                <div className="loyalty-points-lbl">PUNTOS</div>
              </div>
            </div>
            <div className="loyalty-bar">
              <div className="loyalty-bar-fill" style={{ width: `${progress.pct}%` }} />
            </div>
            <div className="loyalty-hint">
              {progress.next
                ? <>Te faltan <strong>{progress.missing} puntos</strong> para alcanzar el nivel {progress.next} y desbloquear beneficios exclusivos.</>
                : <>Alcanzaste el nivel máximo. <strong>¡Gracias por acompañarnos!</strong></>}
            </div>
          </div>

          <div className="profile-block">
            <div className="profile-block-head">
              <h3>Datos personales</h3>
              {!editing && <button className="link-edit" onClick={() => setEditing(true)}>Editar</button>}
            </div>

            {error && <ErrorMessage message={error} />}

            {editing ? (
              <form onSubmit={save}>
                <div className="form-grid">
                  <Input label="NOMBRE COMPLETO" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                  <Input label="CORREO ELECTRÓNICO" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                  <Input label="TELÉFONO" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                  <Input label="CIUDAD" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                </div>
                <div className="row gap-md">
                  <button className="btn-primary" type="submit" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
                  <button className="btn-mini-ghost" type="button" onClick={() => setEditing(false)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <div className="profile-fields">
                <div className="profile-field">
                  <span className="pf-label">Nombre completo</span>
                  <span className="pf-value">{user.name}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Correo electrónico</span>
                  <span className="pf-value">{user.email}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Teléfono</span>
                  <span className="pf-value">{user.phone || '—'}</span>
                </div>
                <div className="profile-field">
                  <span className="pf-label">Ciudad</span>
                  <span className="pf-value">{user.city}</span>
                </div>
              </div>
            )}
          </div>

          <div className="profile-block">
            <div className="profile-block-head">
              <h3>Actividad</h3>
            </div>
            <div className="profile-fields">
              <div className="profile-field">
                <span className="pf-label">Visitas completadas</span>
                <span className="pf-value">{summary.visits}</span>
              </div>
              <div className="profile-field">
                <span className="pf-label">Total invertido</span>
                <span className="pf-value">${summary.spent}</span>
              </div>
              <div className="profile-field">
                <span className="pf-label">Última visita</span>
                <span className="pf-value">{summary.lastVisit ? formatShortDate(summary.lastVisit) : 'Sin visitas aún'}</span>
              </div>
              <div className="profile-field">
                <span className="pf-label">Estado</span>
                <span className="pf-value">{summary.status}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-side">
          <div className="profile-avatar-big">{user.initials}</div>
          <div className="profile-side-name">{user.name}</div>
          <div className="profile-side-sub">Miembro desde {formatShortDate(`${user.memberSince}T12:00:00`)}</div>

          <div className="profile-side-stats">
            <div className="pss">
              <div className="pss-num">{summary.visits}</div>
              <div className="pss-lbl">VISITAS</div>
            </div>
            <div className="pss">
              <div className="pss-num">${summary.spent}</div>
              <div className="pss-lbl">INVERTIDO</div>
            </div>
          </div>

          <div className="side-block-label" style={{ color: 'var(--text-muted)' }}>SERVICIOS FAVORITOS</div>
          {user.favoriteServices.length === 0 && <div className="text-sm muted mb-sm">Marca tus favoritos desde el catálogo.</div>}
          {user.favoriteServices.map(favorite => (
            <button key={favorite} className="fav-chip" onClick={() => void removeFavorite(favorite)} title="Quitar de favoritos">
              <span>♥ {favorite}</span>
              <span className="muted">✕</span>
            </button>
          ))}

          <button
            className="btn-logout"
            onClick={() => {
              logout();
              navigate('/');
            }}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </div>
  );
};

export default Profile;
