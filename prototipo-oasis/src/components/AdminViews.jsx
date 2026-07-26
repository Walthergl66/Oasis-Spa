import { useState } from 'react'
import {
  SERVICES, SPECIALISTS, AGENDA_HOY, AGENDA_TIMELINE, CLIENTS, PROMOTIONS,
  REPORT_INGRESOS_SEMANA, REPORT_SERVICIOS_TOP, REPORT_CATEGORIAS, REPORT_KPIS,
} from '../data.js'

/* ============ DASHBOARD ============ */
export function AdminDashboard() {
  const maxIngreso = Math.max(...REPORT_INGRESOS_SEMANA.map(d => d.valor))
  return (
    <div className="admin-content">
      <div className="kpi-row">
        <div className="kpi-card">
          <div className="kpi-label">Citas hoy</div>
          <div className="kpi-value">14</div>
          <div className="kpi-delta">+3 vs ayer</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ingresos del día</div>
          <div className="kpi-value">$486</div>
          <div className="kpi-delta">+12%</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Ocupación</div>
          <div className="kpi-value">82%</div>
          <div className="kpi-delta">especialistas</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Cancelaciones</div>
          <div className="kpi-value">2</div>
          <div className="kpi-delta" style={{ color: 'var(--yellow)' }}>esta semana</div>
        </div>
      </div>

      <div className="dash-2col">
        <div className="admin-panel">
          <div className="admin-panel-title">Ingresos de la semana</div>
          <div className="bar-chart">
            {REPORT_INGRESOS_SEMANA.map(d => (
              <div className="bar-col" key={d.dia}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${(d.valor / maxIngreso) * 100}%` }}>
                    <span className="bar-val">${d.valor}</span>
                  </div>
                </div>
                <div className="bar-label">{d.dia}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Especialistas hoy</div>
          <div className="mini-spec-list">
            {SPECIALISTS.map(s => (
              <div className="mini-spec" key={s.id}>
                <div className="specialist-avatar" style={{ width: 38, height: 38, fontSize: 12 }}>{s.initials}</div>
                <div style={{ flex: 1 }}>
                  <div className="mini-spec-name">{s.name}</div>
                  <div className="mini-spec-role">{s.citas} citas hoy</div>
                </div>
                <span className={`badge ${s.status === 'Disponible' ? 'green' : s.status === 'En cita' ? 'yellow' : 'gray'}`}>{s.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-title">Agenda de hoy</div>
        <table className="admin-table">
          <thead>
            <tr><th>HORA</th><th>CLIENTE</th><th>SERVICIO</th><th>ESPECIALISTA</th><th>ESTADO</th></tr>
          </thead>
          <tbody>
            {AGENDA_HOY.map((r, i) => (
              <tr key={i}>
                <td style={{ fontWeight: 600 }}>{r.time}</td>
                <td>{r.client}</td>
                <td style={{ color: 'var(--text-muted)' }}>{r.service}</td>
                <td style={{ color: 'var(--text-muted)' }}>{r.specialist}</td>
                <td><span className={`badge ${r.status === 'Confirmada' ? 'green' : 'yellow'}`}>{r.status}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ============ AGENDA (línea de tiempo) ============ */
export function AdminAgenda() {
  const [dia, setDia] = useState('Hoy')
  const dias = ['Ayer', 'Hoy', 'Mañana']
  return (
    <div className="admin-content">
      <div className="agenda-toolbar">
        <div className="agenda-daytabs">
          {dias.map(d => (
            <button key={d} className={dia === d ? 'active' : ''} onClick={() => setDia(d)}>{d}</button>
          ))}
        </div>
        <div className="agenda-date">📅 {dia === 'Hoy' ? 'Lunes, 20 de Julio 2026' : dia === 'Mañana' ? 'Martes, 21 de Julio 2026' : 'Domingo, 19 de Julio 2026'}</div>
        <button className="add-btn">+ Nueva cita</button>
      </div>

      <div className="timeline">
        {AGENDA_TIMELINE.map(slot => (
          <div className="timeline-row" key={slot.time}>
            <div className="timeline-time">{slot.time}</div>
            <div className="timeline-slot">
              {slot.citas.length === 0 ? (
                <div className="timeline-empty">Disponible</div>
              ) : (
                slot.citas.map((c, i) => (
                  <div className={`timeline-cita ${c.status === 'Pendiente' ? 'pend' : ''}`} key={i}>
                    <div className="tc-bar" />
                    <div className="tc-info">
                      <div className="tc-service">{c.service}</div>
                      <div className="tc-meta">{c.client} · {c.duration} min</div>
                    </div>
                    <div className="tc-spec">{c.specialist}</div>
                    <span className={`badge ${c.status === 'Confirmada' ? 'green' : 'yellow'}`}>{c.status}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ SERVICIOS ============ */
export function AdminServices() {
  return (
    <div className="admin-content">
      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div className="admin-panel-title" style={{ marginBottom: 0 }}>Catálogo de servicios</div>
          <button className="add-btn">+ Nuevo servicio</button>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>SERVICIO</th><th>CATEGORÍA</th><th>DURACIÓN</th><th>PRECIO</th><th>VALORACIÓN</th><th>ACCIONES</th></tr>
          </thead>
          <tbody>
            {SERVICES.map(s => (
              <tr key={s.id}>
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.category}</td>
                <td style={{ color: 'var(--text-muted)' }}>{s.duration} min</td>
                <td style={{ fontWeight: 600 }}>${s.price}</td>
                <td style={{ color: 'var(--text-muted)' }}>★ {s.rating} ({s.reviews})</td>
                <td>
                  <button className="link-edit">Editar</button>
                  <button className="link-del">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ============ ESPECIALISTAS ============ */
export function AdminSpecialists() {
  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="add-btn">+ Nuevo especialista</button>
      </div>
      <div className="specialist-grid">
        {SPECIALISTS.map(s => (
          <div className="specialist-card" key={s.id}>
            <div className="specialist-avatar">{s.initials}</div>
            <div className="specialist-name">{s.name}</div>
            <div className="specialist-role">{s.role}</div>
            <div className="rating">{s.rating}</div>
            <div className="spec-tags">
              {s.especialidad.map(e => <span className="spec-tag" key={e}>{e}</span>)}
            </div>
            <span className={`badge ${s.status === 'Disponible' ? 'green' : s.status === 'En cita' ? 'yellow' : 'gray'}`}>{s.status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ CLIENTES (CRM) ============ */
export function AdminClients() {
  const [q, setQ] = useState('')
  const filtered = CLIENTS.filter(c => c.name.toLowerCase().includes(q.toLowerCase()))
  return (
    <div className="admin-content">
      <div className="admin-panel">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 16, flexWrap: 'wrap' }}>
          <div className="admin-panel-title" style={{ marginBottom: 0 }}>Base de clientas ({filtered.length})</div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input className="admin-search" placeholder="Buscar clienta..." value={q} onChange={e => setQ(e.target.value)} />
            <button className="add-btn">+ Nueva clienta</button>
          </div>
        </div>
        <table className="admin-table">
          <thead>
            <tr><th>CLIENTA</th><th>CONTACTO</th><th>VISITAS</th><th>TOTAL GASTADO</th><th>ÚLTIMA VISITA</th><th>NIVEL</th><th>ESTADO</th></tr>
          </thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="specialist-avatar" style={{ width: 34, height: 34, fontSize: 11 }}>{c.initials}</div>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                  </div>
                </td>
                <td style={{ color: 'var(--text-muted)' }}>{c.email}<br />{c.phone}</td>
                <td style={{ fontWeight: 600 }}>{c.visitas}</td>
                <td style={{ fontWeight: 600 }}>${c.gastado}</td>
                <td style={{ color: 'var(--text-muted)' }}>{c.ultima}</td>
                <td><span className={`badge ${c.nivel === 'Oro' ? 'yellow' : c.nivel === 'Ámbar' ? 'amber' : 'gray'}`}>{c.nivel}</span></td>
                <td><span className={`badge ${c.estado === 'Activa' ? 'green' : c.estado === 'Nueva' ? 'blue' : 'gray'}`}>{c.estado}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

/* ============ PROMOCIONES (gestión) ============ */
export function AdminPromotions() {
  return (
    <div className="admin-content">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="add-btn">+ Nueva promoción</button>
      </div>
      <div className="promo-admin-grid">
        {PROMOTIONS.map(p => (
          <div className="promo-admin-card" key={p.id}>
            <div className="promo-admin-head">
              <span className={`promo-badge-sm promo-${p.color}`}>{p.badge}</span>
              <label className="switch">
                <input type="checkbox" defaultChecked />
                <span className="slider" />
              </label>
            </div>
            <div className="promo-admin-title">{p.title}</div>
            <div className="promo-admin-desc">{p.desc}</div>
            <div className="promo-admin-foot">
              <span className="promo-admin-valid">🕐 {p.valid}</span>
              <button className="link-edit">Editar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ============ REPORTES ============ */
export function AdminReports() {
  const maxIngreso = Math.max(...REPORT_INGRESOS_SEMANA.map(d => d.valor))

  // Donut de categorías (stroke-dasharray sobre un círculo)
  const radius = 60
  const circ = 2 * Math.PI * radius
  let offset = 0

  return (
    <div className="admin-content">
      <div className="kpi-row">
        {REPORT_KPIS.map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value">{k.value}</div>
            <div className="kpi-delta" style={{ color: k.positivo ? 'var(--green)' : 'var(--accent)' }}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="dash-2col">
        <div className="admin-panel">
          <div className="admin-panel-title">Ingresos por día (esta semana)</div>
          <div className="bar-chart">
            {REPORT_INGRESOS_SEMANA.map(d => (
              <div className="bar-col" key={d.dia}>
                <div className="bar-track">
                  <div className="bar-fill" style={{ height: `${(d.valor / maxIngreso) * 100}%` }}>
                    <span className="bar-val">${d.valor}</span>
                  </div>
                </div>
                <div className="bar-label">{d.dia}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-panel">
          <div className="admin-panel-title">Servicios por categoría</div>
          <div className="donut-wrap">
            <svg width="150" height="150" viewBox="0 0 150 150">
              <g transform="rotate(-90 75 75)">
                {REPORT_CATEGORIAS.map((c, i) => {
                  const len = (c.pct / 100) * circ
                  const seg = (
                    <circle
                      key={i}
                      cx="75" cy="75" r={radius}
                      fill="none"
                      stroke={c.color}
                      strokeWidth="22"
                      strokeDasharray={`${len} ${circ - len}`}
                      strokeDashoffset={-offset}
                    />
                  )
                  offset += len
                  return seg
                })}
              </g>
            </svg>
            <div className="donut-legend">
              {REPORT_CATEGORIAS.map(c => (
                <div className="donut-leg-item" key={c.cat}>
                  <span className="donut-dot" style={{ background: c.color }} />
                  {c.cat} <strong>{c.pct}%</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-title">Servicios más solicitados</div>
        <div className="rank-list">
          {REPORT_SERVICIOS_TOP.map((s, i) => (
            <div className="rank-row" key={s.name}>
              <div className="rank-num">{i + 1}</div>
              <div className="rank-name">{s.name}</div>
              <div className="rank-track">
                <div className="rank-fill" style={{ width: `${s.pct}%` }} />
              </div>
              <div className="rank-count">{s.citas} citas</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
