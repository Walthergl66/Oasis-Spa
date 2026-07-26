import { useState } from 'react'
import { SERVICES } from '../data.js'

const CATEGORIES = ['Todos', 'Uñas', 'Masaje', 'Pestañas', 'Cabello', 'Facial', 'Spa']

export default function ClientServices({ onBook }) {
  const [filter, setFilter] = useState('Todos')
  const filtered = filter === 'Todos' ? SERVICES : SERVICES.filter(s => s.category === filter)

  return (
    <div className="page">
      <div className="section-title">
        <div>
          <h2>Elige el tratamiento que tu cuerpo merece</h2>
        </div>
      </div>
      <div className="filters">
        {CATEGORIES.map(c => (
          <button key={c} className={`filter-chip ${filter === c ? 'active' : ''}`} onClick={() => setFilter(c)}>{c}</button>
        ))}
      </div>
      <div className="grid-services">
        {filtered.map(s => (
          <div className="service-card" key={s.id}>
            <div className="service-img">
              <img src={s.img} alt={s.name} loading="lazy" />
              {s.popular && <div className="popular-tag">POPULAR</div>}
              <div className="price-tag">${s.price}</div>
            </div>
            <div className="service-body">
              <div className="service-name">{s.name}</div>
              <div className="service-desc">{s.desc}</div>
              <div className="service-meta">⏱ {s.duration} min</div>
              <button className="btn-outline-book" onClick={() => onBook(s)}>Reservar</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
