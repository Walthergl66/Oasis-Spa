import { useState } from 'react'
import { DAYS, TIMES, SPECIALISTS } from '../data.js'

export default function BookingModal({ service, onClose }) {
  const [step, setStep] = useState(1) // 1 = fecha y hora, 2 = detalles, 3 = confirmado
  const [day, setDay] = useState(DAYS[5])
  const [time, setTime] = useState('10:00')
  const [specialistId, setSpecialistId] = useState(1)
  const busyTimes = ['11:00', '15:00']

  const specialist = SPECIALISTS.find(s => s.id === specialistId)

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-img">
          <img src={service.img} alt={service.name} />
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-eyebrow">{service.category.toUpperCase()}</div>
          <div className="modal-title">{service.name}</div>
          <div className="modal-meta">⏱ {service.duration} min · ${service.price}</div>

          {step < 3 && (
            <div className="steps">
              <div className={`step-dot ${step === 1 ? 'active' : 'done'}`}>{step > 1 ? '✓' : '1'}</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: step === 1 ? 'var(--dark)' : 'var(--text-muted)' }}>Fecha y hora</span>
              <div className="step-line" />
              <div className={`step-dot ${step === 2 ? 'active' : ''}`}>2</div>
              <span style={{ fontSize: 13, fontWeight: 600, color: step === 2 ? 'var(--dark)' : 'var(--text-muted)' }}>Detalles</span>
            </div>
          )}

          {step === 1 && (
            <>
              <div className="field-label">SELECCIONA EL DÍA — JULIO 2026</div>
              <div className="day-grid">
                {DAYS.map(d => (
                  <div key={d.num} className={`day-cell ${d.num === day.num ? 'selected' : ''}`} onClick={() => setDay(d)}>
                    <span className="dow">{d.dow}</span>{d.num}
                  </div>
                ))}
              </div>
              <div className="field-label">HORARIO DISPONIBLE</div>
              <div className="time-grid">
                {TIMES.map(t => (
                  <div
                    key={t}
                    className={`time-cell ${t === time ? 'selected' : ''} ${busyTimes.includes(t) ? 'disabled' : ''}`}
                    onClick={() => !busyTimes.includes(t) && setTime(t)}
                  >
                    {t}
                  </div>
                ))}
              </div>
              <button className="btn-continue" onClick={() => setStep(2)}>Continuar →</button>
            </>
          )}

          {step === 2 && (
            <>
              <div className="field-label">ESPECIALISTA</div>
              {SPECIALISTS.filter(s => s.status === 'Disponible').map(s => (
                <div key={s.id} className={`specialist-row ${s.id === specialistId ? 'selected' : ''}`} onClick={() => setSpecialistId(s.id)}>
                  <div className="specialist-avatar">{s.initials}</div>
                  <div>
                    <div className="specialist-name">{s.name}</div>
                    <div className="specialist-role">{s.role}</div>
                  </div>
                  <div className={`check-circle ${s.id === specialistId ? 'on' : ''}`} />
                </div>
              ))}
              <div className="field-label" style={{ marginTop: 18 }}>NOTAS ADICIONALES</div>
              <textarea className="notes" rows={3} placeholder="Ej. alergia a ciertos productos, preferencias de presión, color que deseas..." />
              <button className="btn-continue" onClick={() => setStep(3)}>Confirmar reserva</button>
            </>
          )}

          {step === 3 && (
            <div className="confirm-success">
              <div className="confirm-icon">✓</div>
              <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>¡Reserva confirmada!</div>
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, lineHeight: 1.6 }}>
                {service.name}<br />
                {day.dow} {day.num} de julio · {time}<br />
                Con {specialist.name}
              </div>
              <button className="btn-continue" onClick={onClose}>Listo</button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
