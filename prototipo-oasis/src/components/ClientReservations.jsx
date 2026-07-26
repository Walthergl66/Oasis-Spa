import { useState } from 'react'
import { RESERVATIONS, RESERVATIONS_HISTORIAL, SERVICES } from '../data.js'

export default function ClientReservations({ onBook, onNavigate }) {
  const [tab, setTab] = useState('proximas')

  return (
    <div className="page">
      <div className="section-title">
        <div>
          <h2 style={{ fontSize: 30, marginBottom: 6 }}>Mis Reservas</h2>
          <p style={{ color: 'var(--text-muted)' }}>Cuidado y bienestar, a tu ritmo.</p>
        </div>
        <button className="btn-primary" onClick={() => onNavigate('servicios')}>+ Nueva reserva</button>
      </div>

      <div className="reservas-layout">
        <div>
          <div className="tabs">
            <button className={tab === 'proximas' ? 'active' : ''} onClick={() => setTab('proximas')}>Próximas</button>
            <button className={tab === 'historial' ? 'active' : ''} onClick={() => setTab('historial')}>Historial</button>
          </div>

          {tab === 'proximas' && RESERVATIONS.map(r => (
            <div className="reserva-item" key={r.id}>
              <div className="reserva-thumb">
                <img src={r.img} alt={r.service} loading="lazy" />
              </div>
              <div className="reserva-info">
                <div className="reserva-name">{r.service}</div>
                <div className="reserva-meta">📅 {r.date}</div>
                <div className="reserva-meta">🕐 {r.time}</div>
                <div className="reserva-meta">👤 {r.specialist}</div>
                <div className="reserva-actions">
                  <span className="badge green">{r.status}</span>
                  <button className="btn-mini-outline">Reprogramar</button>
                  <button className="btn-mini-ghost">Cancelar</button>
                </div>
              </div>
            </div>
          ))}

          {tab === 'historial' && RESERVATIONS_HISTORIAL.map(r => (
            <div className="reserva-item" key={r.id}>
              <div className="reserva-thumb">
                <img src={r.img} alt={r.service} loading="lazy" />
              </div>
              <div className="reserva-info">
                <div className="reserva-name">{r.service}</div>
                <div className="reserva-meta">📅 {r.date} · {r.time}</div>
                <div className="reserva-meta">👤 {r.specialist}</div>
                <div className="reserva-actions">
                  <span className={`badge ${r.status === 'Completada' ? 'gray' : 'red'}`}>{r.status}</span>
                  {r.status === 'Completada' && (
                    <>
                      <button
                        className="btn-mini-outline"
                        onClick={() => {
                          const svc = SERVICES.find(s => r.service.includes(s.name))
                          if (svc) onBook(svc)
                        }}
                      >
                        Reservar de nuevo
                      </button>
                      {!r.reviewed && <button className="btn-mini-ghost">⭐ Dejar reseña</button>}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="side-panel">
          <div className="eyebrow" style={{ marginBottom: 16 }}>✦ RESUMEN</div>
          <div className="side-stats">
            <div className="side-stat">
              <div className="num">2</div>
              <div className="lbl">ACTIVAS</div>
            </div>
            <div className="side-stat">
              <div className="num">12</div>
              <div className="lbl">COMPLETADAS</div>
            </div>
          </div>
          <div className="side-block-label">UBICACIÓN</div>
          <div className="location-name">📍 Spa &amp; Belleza</div>
          <div className="location-addr">Manta, Manabí, Ecuador</div>
          <div className="side-block-label" style={{ marginTop: 22 }}>HORARIO DE ATENCIÓN</div>
          <div className="location-addr">Lun a Sáb · 09:00 – 18:00</div>
          <div className="location-addr">Dom · 10:00 – 14:00</div>
          <div className="side-block-label" style={{ marginTop: 22 }}>CONTACTO</div>
          <div className="location-addr">📞 099 812 4471</div>
          <div className="location-addr">✉ citas@spaybelleza.ec</div>
        </div>
      </div>
    </div>
  )
}
