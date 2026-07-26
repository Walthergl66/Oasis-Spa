import { useState, useRef, useEffect } from 'react'
import { consultarDisponibilidad, DAYS, TIMES, SERVICES } from '../data.js'

// Este componente simula, del lado del cliente, el comportamiento que en el
// sistema real ejecuta el backend: interpretar la intención del usuario,
// invocar una función (consultarDisponibilidad, registrarCita) y responder
// con el resultado real de esa función, no con una redirección de texto.

let msgId = 0
const nextId = () => ++msgId

function detectIntent(text) {
  const t = text.toLowerCase()
  if (t.includes('reserv') || t.includes('agend') || t.includes('cita')) return 'reservar'
  if (t.includes('precio') || t.includes('cuesta') || t.includes('vale')) return 'precios'
  if (t.includes('horario') || t.includes('hora') || t.includes('abren')) return 'horarios'
  if (t.includes('especialista') || t.includes('quien') || t.includes('quién')) return 'especialistas'
  if (t.includes('promo') || t.includes('descuento')) return 'promociones'
  return 'desconocido'
}

function extractService(text) {
  const t = text.toLowerCase()
  return SERVICES.find(s => t.includes(s.name.toLowerCase().split(' ')[0].toLowerCase()))
}

export default function LunaChat({ open, onClose }) {
  const [messages, setMessages] = useState([
    { id: nextId(), from: 'bot', text: '¡Hola, Adriana! Soy Luna, tu asistente de Spa & Belleza. ¿En qué puedo ayudarte hoy?' }
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [bookingFlow, setBookingFlow] = useState(null) // {step, service, day, time}
  const bodyRef = useRef(null)

  useEffect(() => {
    if (bodyRef.current) bodyRef.current.scrollTop = bodyRef.current.scrollHeight
  }, [messages, typing])

  function pushBot(text, fnTag) {
    setTyping(true)
    return new Promise(resolve => {
      setTimeout(() => {
        setTyping(false)
        setMessages(m => [...m, { id: nextId(), from: 'bot', text, fnTag }])
        resolve()
      }, 700 + Math.random() * 500)
    })
  }

  function pushUser(text) {
    setMessages(m => [...m, { id: nextId(), from: 'user', text }])
  }

  async function handleSend(rawText) {
    const text = rawText ?? input
    if (!text.trim()) return
    pushUser(text)
    setInput('')

    // Si estamos dentro de un flujo de reserva activo, continuar ese flujo
    if (bookingFlow) {
      await continueBooking(text)
      return
    }

    const intent = detectIntent(text)

    if (intent === 'reservar') {
      const svc = extractService(text) || SERVICES[0]
      await pushBot(`Perfecto, ¿te gustaría reservar ${svc.name}? Elige el día que prefieras.`)
      setBookingFlow({ step: 'day', service: svc })
      return
    }
    if (intent === 'precios') {
      const lista = SERVICES.slice(0, 4).map(s => `${s.name} — $${s.price}`).join(' · ')
      await pushBot(`Estos son algunos de nuestros precios: ${lista}. ¿Quieres ver el catálogo completo o reservar alguno?`)
      return
    }
    if (intent === 'horarios') {
      await pushBot('Atendemos todos los días, con disponibilidad flexible según el especialista. ¿Para qué día te gustaría reservar?')
      return
    }
    if (intent === 'especialistas') {
      await pushBot('Contamos con Tatiana Aguirre (uñas), Valeria Mora (uñas y pestañas) y Gabriela Wilson (masajes y spa). ¿Con quién te gustaría agendar?')
      return
    }
    if (intent === 'promociones') {
      await pushBot('Tenemos 30% de descuento en Masaje + Facial esta semana. ¿Quieres que te reserve ese combo?')
      return
    }
    await pushBot('Puedo ayudarte a reservar una cita, consultar precios, horarios o especialistas disponibles. ¿Qué necesitas?')
  }

  async function continueBooking(text) {
    const flow = bookingFlow
    if (flow.step === 'day') {
      const day = DAYS.find(d => text.includes(String(d.num))) || DAYS[5]
      await pushBot(`Entendido, ${day.dow} ${day.num}. ¿A qué hora te gustaría? Horarios disponibles: ${TIMES.join(', ')}.`)
      setBookingFlow({ ...flow, step: 'time', day })
      return
    }
    if (flow.step === 'time') {
      const time = TIMES.find(t => text.includes(t.split(':')[0])) || '10:00'
      await pushBot(`Consultando disponibilidad de ${flow.service.name} para ${flow.day.dow} ${flow.day.num} a las ${time}...`, 'consultarDisponibilidad()')
      const result = consultarDisponibilidad(flow.service.name, flow.day, time)
      if (!result.disponible) {
        await pushBot(`Ese horario ya está reservado. ¿Probamos con otro? Disponibles cercanos: 10:00, 12:00, 14:00.`)
        setBookingFlow({ ...flow, step: 'time' })
        return
      }
      await pushBot(`${result.especialista} está disponible en ese horario. ¿Confirmo tu reserva de ${flow.service.name}, ${flow.day.dow} ${flow.day.num}, ${time} con ${result.especialista}?`)
      setBookingFlow({ ...flow, step: 'confirm', time, especialista: result.especialista })
      return
    }
    if (flow.step === 'confirm') {
      const yes = /s[ií]|confirma|dale|ok|claro/i.test(text)
      if (yes) {
        await pushBot(`Reserva confirmada. Te enviaré un recordatorio antes de tu cita. ¡Nos vemos pronto! 🌿`, 'registrarCita()')
        setBookingFlow(null)
      } else {
        await pushBot('Sin problema, cancelé esa solicitud. ¿En qué más puedo ayudarte?')
        setBookingFlow(null)
      }
      return
    }
  }

  if (!open) return null

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-name">Luna</div>
          <div className="chat-header-status">Asistente virtual · En línea</div>
        </div>
        <button className="chat-close" onClick={onClose}>✕</button>
      </div>
      <div className="chat-body" ref={bodyRef}>
        {messages.map(m => (
          <div key={m.id} className={`msg ${m.from}`}>
            {m.text}
            {m.fnTag && <div className="fn-tag">{m.fnTag}</div>}
          </div>
        ))}
        {typing && (
          <div className="msg bot typing"><span></span><span></span><span></span></div>
        )}
      </div>
      <div className="chat-chips">
        <button onClick={() => handleSend('Quiero reservar')}>Quiero reservar</button>
        <button onClick={() => handleSend('Ver promociones')}>Ver promociones</button>
        <button onClick={() => handleSend('Precios')}>Precios</button>
        <button onClick={() => handleSend('Horarios')}>Horarios</button>
        <button onClick={() => handleSend('Especialistas')}>Especialistas</button>
      </div>
      <div className="chat-input-row">
        <input
          placeholder="Escribe tu consulta..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button className="chat-send" onClick={() => handleSend()}>➤</button>
      </div>
    </div>
  )
}
