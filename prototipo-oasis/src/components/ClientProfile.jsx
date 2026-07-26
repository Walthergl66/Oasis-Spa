import { CLIENT_PROFILE } from '../data.js'

export default function ClientProfile() {
  const p = CLIENT_PROFILE
  const progreso = Math.round((p.puntos / p.puntosSiguienteNivel) * 100)
  const faltan = p.puntosSiguienteNivel - p.puntos

  return (
    <div className="page">
      <h2 style={{ fontSize: 30, marginBottom: 6 }}>Mi cuenta</h2>
      <p style={{ color: 'var(--text-muted)', marginBottom: 26 }}>Tus datos, tu progreso y tus preferencias.</p>

      <div className="profile-layout">
        <div className="profile-main">
          {/* Tarjeta de fidelidad */}
          <div className="loyalty-card">
            <div className="loyalty-top">
              <div>
                <div className="loyalty-label">PROGRAMA DE FIDELIDAD</div>
                <div className="loyalty-level">Nivel {p.nivel}</div>
              </div>
              <div className="loyalty-points">
                <div className="loyalty-points-num">{p.puntos}</div>
                <div className="loyalty-points-lbl">PUNTOS</div>
              </div>
            </div>
            <div className="loyalty-bar">
              <div className="loyalty-bar-fill" style={{ width: `${progreso}%` }} />
            </div>
            <div className="loyalty-hint">Te faltan <strong>{faltan} puntos</strong> para alcanzar el nivel Oro y desbloquear beneficios exclusivos.</div>
          </div>

          {/* Datos personales */}
          <div className="profile-block">
            <div className="profile-block-head">
              <h3>Datos personales</h3>
              <button className="link-edit">Editar</button>
            </div>
            <div className="profile-fields">
              <div className="profile-field">
                <span className="pf-label">Nombre completo</span>
                <span className="pf-value">{p.name}</span>
              </div>
              <div className="profile-field">
                <span className="pf-label">Correo electrónico</span>
                <span className="pf-value">{p.email}</span>
              </div>
              <div className="profile-field">
                <span className="pf-label">Teléfono</span>
                <span className="pf-value">{p.phone}</span>
              </div>
              <div className="profile-field">
                <span className="pf-label">Ciudad</span>
                <span className="pf-value">{p.ciudad}</span>
              </div>
            </div>
          </div>

          {/* Métodos de pago */}
          <div className="profile-block">
            <div className="profile-block-head">
              <h3>Métodos de pago</h3>
              <button className="link-edit">+ Agregar</button>
            </div>
            {p.metodosPago.map(m => (
              <div className="pay-row" key={m.id}>
                <div className="pay-icon">{m.tipo === 'Visa' ? '💳' : '💳'}</div>
                <div className="pay-info">
                  <div className="pay-name">{m.tipo} •••• {m.ultimos}</div>
                  <div className="pay-sub">{m.principal ? 'Tarjeta principal' : 'Tarjeta secundaria'}</div>
                </div>
                {m.principal && <span className="badge green">Principal</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Panel lateral */}
        <div className="profile-side">
          <div className="profile-avatar-big">{p.initials}</div>
          <div className="profile-side-name">{p.name}</div>
          <div className="profile-side-sub">Miembro desde {p.miembroDesde}</div>

          <div className="profile-side-stats">
            <div className="pss">
              <div className="pss-num">{p.visitas}</div>
              <div className="pss-lbl">VISITAS</div>
            </div>
            <div className="pss">
              <div className="pss-num">${p.gastado}</div>
              <div className="pss-lbl">INVERTIDO</div>
            </div>
          </div>

          <div className="side-block-label">SERVICIOS FAVORITOS</div>
          {p.serviciosFavoritos.map(f => (
            <div className="fav-chip" key={f}>♡ {f}</div>
          ))}

          <button className="btn-logout">Cerrar sesión</button>
        </div>
      </div>
    </div>
  )
}
