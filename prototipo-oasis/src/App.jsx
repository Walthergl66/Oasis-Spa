import { useState, useEffect, useRef } from 'react'
import ClientHome from './components/ClientHome.jsx'
import ClientServices from './components/ClientServices.jsx'
import ClientReservations from './components/ClientReservations.jsx'
import ClientPromotions from './components/ClientPromotions.jsx'
import ClientProfile from './components/ClientProfile.jsx'
import BookingModal from './components/BookingModal.jsx'
import LunaChat from './components/LunaChat.jsx'
import {
  AdminDashboard, AdminAgenda, AdminServices, AdminSpecialists,
  AdminClients, AdminPromotions, AdminReports,
} from './components/AdminViews.jsx'
import { SERVICES, NOTIFICATIONS, CLIENT_PROFILE } from './data.js'

function NotificationBell() {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const unread = NOTIFICATIONS.filter(n => n.unread).length

  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <div className="notif-wrap" ref={ref}>
      <button className="notif-btn" onClick={() => setOpen(o => !o)}>
        🔔
        {unread > 0 && <span className="notif-dot">{unread}</span>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-head">Notificaciones</div>
          {NOTIFICATIONS.map(n => (
            <div className={`notif-item ${n.unread ? 'unread' : ''}`} key={n.id}>
              <div className="notif-icon">{n.icon}</div>
              <div className="notif-body">
                <div className="notif-title">{n.title}</div>
                <div className="notif-text">{n.text}</div>
                <div className="notif-time">{n.time}</div>
              </div>
            </div>
          ))}
          <div className="notif-foot">Marcar todas como leídas</div>
        </div>
      )}
    </div>
  )
}

function ClientApp() {
  const [tab, setTab] = useState('inicio')
  const [bookingService, setBookingService] = useState(null)
  const [chatOpen, setChatOpen] = useState(false)

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'promociones', label: 'Promociones' },
    { id: 'reservas', label: 'Reservas' },
  ]

  return (
    <div className="app-shell">
      <header className="header">
        <div className="logo" onClick={() => setTab('inicio')} style={{ cursor: 'pointer' }}>Spa<span>&amp; BELLEZA</span></div>
        <nav className="nav">
          {navItems.map(it => (
            <button key={it.id} className={tab === it.id ? 'active' : ''} onClick={() => setTab(it.id)}>{it.label}</button>
          ))}
        </nav>
        <div className="header-right">
          <NotificationBell />
          <button className="user-chip user-chip-btn" onClick={() => setTab('cuenta')}>
            <div className="avatar-dot">{CLIENT_PROFILE.initials}</div>
            <span>{CLIENT_PROFILE.name.split(' ')[0]}</span>
          </button>
        </div>
      </header>

      {tab === 'inicio' && <ClientHome onBook={setBookingService} onNavigate={setTab} />}
      {tab === 'servicios' && <ClientServices onBook={setBookingService} />}
      {tab === 'promociones' && <ClientPromotions onBook={setBookingService} services={SERVICES} />}
      {tab === 'reservas' && <ClientReservations onBook={setBookingService} onNavigate={setTab} />}
      {tab === 'cuenta' && <ClientProfile />}

      {bookingService && <BookingModal service={bookingService} onClose={() => setBookingService(null)} />}

      <button className="luna-fab" onClick={() => setChatOpen(o => !o)}>🌿</button>
      <LunaChat open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  )
}

function AdminApp() {
  const [tab, setTab] = useState('dashboard')
  const items = [
    { id: 'dashboard', label: 'Dashboard', icon: '▤' },
    { id: 'agenda', label: 'Agenda', icon: '🗓' },
    { id: 'servicios', label: 'Servicios', icon: '✦' },
    { id: 'especialistas', label: 'Especialistas', icon: '👤' },
    { id: 'clientes', label: 'Clientes', icon: '☺' },
    { id: 'promociones', label: 'Promociones', icon: '🎁' },
    { id: 'reportes', label: 'Reportes', icon: '📊' },
  ]
  const titles = {
    dashboard: 'Panel administrativo', agenda: 'Agenda del día', servicios: 'Gestión de Servicios',
    especialistas: 'Especialistas', clientes: 'Base de Clientas', promociones: 'Gestión de Promociones', reportes: 'Reportes y Estadísticas',
  }

  return (
    <div className="admin-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">Spa &amp; Belleza</div>
        <nav className="sidebar-nav">
          {items.map(it => (
            <button key={it.id} className={tab === it.id ? 'active' : ''} onClick={() => setTab(it.id)}>
              <span className="sidebar-icon">{it.icon}</span>{it.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="specialist-avatar" style={{ width: 36, height: 36, fontSize: 12 }}>SB</div>
          <div>
            <div className="sidebar-foot-name">Admin</div>
            <div className="sidebar-foot-role">Spa &amp; Belleza</div>
          </div>
        </div>
      </aside>
      <div className="admin-main">
        <div className="admin-topbar">
          <h1>{titles[tab]}</h1>
          <div className="user-chip">Admin · Spa &amp; Belleza</div>
        </div>
        {tab === 'dashboard' && <AdminDashboard />}
        {tab === 'agenda' && <AdminAgenda />}
        {tab === 'servicios' && <AdminServices />}
        {tab === 'especialistas' && <AdminSpecialists />}
        {tab === 'clientes' && <AdminClients />}
        {tab === 'promociones' && <AdminPromotions />}
        {tab === 'reportes' && <AdminReports />}
      </div>
    </div>
  )
}

export default function App() {
  const [view, setView] = useState('cliente')

  return (
    <>
      {view === 'cliente' ? <ClientApp /> : <AdminApp />}

      <div className="proto-switch">
        <button className={view === 'cliente' ? 'active' : ''} onClick={() => setView('cliente')}>Vista Cliente</button>
        <button className={view === 'admin' ? 'active' : ''} onClick={() => setView('admin')}>Vista Admin</button>
      </div>
    </>
  )
}
