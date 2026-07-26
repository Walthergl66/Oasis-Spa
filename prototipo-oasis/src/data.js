export const SERVICES = [
  { id: 1, name: 'Manicura Glossy', category: 'Uñas', price: 28, duration: 60, desc: 'Acabado glossy de larga duración con base nutritiva y detalles a elección. Incluye limado y cutícula.', popular: true, img: '/img/manicura.jpg', rating: 4.9, reviews: 128 },
  { id: 2, name: 'Masaje Relajante', category: 'Masaje', price: 55, duration: 90, desc: 'Masaje de cuerpo completo con aceites esenciales de lavanda y jojoba. Alivio de tensiones musculares.', popular: true, img: '/img/masaje.jpg', rating: 4.8, reviews: 96 },
  { id: 3, name: 'Diseño de Pestañas', category: 'Pestañas', price: 65, duration: 120, desc: 'Extensión de pestañas pelo a pelo con fibra de seda. Efecto natural o volumen según preferencia.', popular: false, img: '/img/pestanas.jpg', rating: 4.7, reviews: 74 },
  { id: 4, name: 'Tratamiento Capilar', category: 'Cabello', price: 45, duration: 75, desc: 'Hidratación profunda con keratina vegetal, sellado de puntas y brillo intenso.', popular: false, img: '/img/cabello.jpg', rating: 4.6, reviews: 61 },
  { id: 5, name: 'Facial Express', category: 'Facial', price: 38, duration: 55, desc: 'Limpieza profunda, exfoliación suave e hidratación intensiva. Piel luminosa en menos de una hora.', popular: true, img: '/img/facial.jpg', rating: 4.9, reviews: 112 },
  { id: 6, name: 'Ritual Spa Completo', category: 'Spa', price: 93, duration: 180, desc: 'Experiencia integral: envoltura corporal y facial hidratante. El lujo de un día completo.', popular: false, img: '/img/spa.jpg', rating: 5.0, reviews: 43 },
]

export const SPECIALISTS = [
  { id: 1, name: 'Tatiana Aguirre', role: 'Nail art & manicura', rating: 4.9, status: 'Disponible', initials: 'TA', citas: 6, especialidad: ['Uñas', 'Pestañas'] },
  { id: 2, name: 'Valeria Mora', role: 'Uñas & pestañas', rating: 4.7, status: 'Disponible', initials: 'VM', citas: 5, especialidad: ['Uñas', 'Pestañas', 'Facial'] },
  { id: 3, name: 'Gabriela Wilson', role: 'Masajes & spa', rating: 4.8, status: 'En cita', initials: 'GW', citas: 4, especialidad: ['Masaje', 'Spa'] },
  { id: 4, name: 'Daniela Cedeño', role: 'Facial & cuidado de piel', rating: 4.8, status: 'Disponible', initials: 'DC', citas: 5, especialidad: ['Facial', 'Spa'] },
  { id: 5, name: 'Karla Bravo', role: 'Estilismo & cabello', rating: 4.6, status: 'Descanso', initials: 'KB', citas: 0, especialidad: ['Cabello'] },
]

export const DAYS = [
  { dow: 'LUN', num: 20 }, { dow: 'MAR', num: 21 }, { dow: 'MIÉ', num: 22 },
  { dow: 'JUE', num: 23 }, { dow: 'VIE', num: 24 }, { dow: 'SÁB', num: 25 },
]

export const TIMES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

export const RESERVATIONS = [
  { id: 1, service: 'Manicura Glossy', date: 'Miércoles, 22 de Julio 2026', time: '14:30 PM', specialist: 'Esp. Tatiana Aguirre', status: 'Confirmada', img: '/img/manicura.jpg' },
  { id: 2, service: 'Masaje Relajante de cuerpo completo', date: 'Sábado, 25 de Julio 2026', time: '12:00 PM', specialist: 'Esp. Gabriela Wilson', status: 'Confirmada', img: '/img/masaje.jpg' },
]

export const RESERVATIONS_HISTORIAL = [
  { id: 101, service: 'Facial Express', date: '28 de Junio 2026', time: '11:00 AM', specialist: 'Esp. Daniela Cedeño', status: 'Completada', img: '/img/facial.jpg', reviewed: true },
  { id: 102, service: 'Tratamiento Capilar', date: '14 de Junio 2026', time: '16:00 PM', specialist: 'Esp. Karla Bravo', status: 'Completada', img: '/img/cabello.jpg', reviewed: true },
  { id: 103, service: 'Diseño de Pestañas', date: '30 de Mayo 2026', time: '10:00 AM', specialist: 'Esp. Valeria Mora', status: 'Completada', img: '/img/pestanas.jpg', reviewed: false },
  { id: 104, service: 'Ritual Spa Completo', date: '12 de Mayo 2026', time: '13:00 PM', specialist: 'Esp. Gabriela Wilson', status: 'Cancelada', img: '/img/spa.jpg', reviewed: false },
]

export const AGENDA_HOY = [
  { time: '09:00', client: 'Adriana Torres', service: 'Manicura Glossy', specialist: 'Tatiana Aguirre', status: 'Confirmada' },
  { time: '10:30', client: 'Camila Ríos', service: 'Facial Express', specialist: 'Daniela Cedeño', status: 'Confirmada' },
  { time: '11:00', client: 'Sofía Cedeño', service: 'Masaje Relajante', specialist: 'Gabriela Wilson', status: 'Pendiente' },
  { time: '14:30', client: 'Adriana Torres', service: 'Diseño de Pestañas', specialist: 'Tatiana Aguirre', status: 'Confirmada' },
  { time: '16:00', client: 'María Zambrano', service: 'Ritual Spa Completo', specialist: 'Gabriela Wilson', status: 'Confirmada' },
]

// Agenda por franja horaria para la vista de línea de tiempo del administrador
export const AGENDA_TIMELINE = [
  { time: '09:00', citas: [
    { client: 'Adriana Torres', service: 'Manicura Glossy', specialist: 'Tatiana Aguirre', status: 'Confirmada', duration: 60 },
  ]},
  { time: '10:00', citas: [
    { client: 'Lucía Franco', service: 'Facial Express', specialist: 'Daniela Cedeño', status: 'Confirmada', duration: 55 },
    { client: 'Paola Mendoza', service: 'Manicura Glossy', specialist: 'Valeria Mora', status: 'Pendiente', duration: 60 },
  ]},
  { time: '11:00', citas: [
    { client: 'Sofía Cedeño', service: 'Masaje Relajante', specialist: 'Gabriela Wilson', status: 'Confirmada', duration: 90 },
  ]},
  { time: '12:00', citas: [] },
  { time: '14:00', citas: [
    { client: 'María Zambrano', service: 'Tratamiento Capilar', specialist: 'Karla Bravo', status: 'Confirmada', duration: 75 },
  ]},
  { time: '15:00', citas: [
    { client: 'Adriana Torres', service: 'Diseño de Pestañas', specialist: 'Tatiana Aguirre', status: 'Confirmada', duration: 120 },
    { client: 'Isabel Loor', service: 'Facial Express', specialist: 'Daniela Cedeño', status: 'Confirmada', duration: 55 },
  ]},
  { time: '16:00', citas: [
    { client: 'Valentina Ponce', service: 'Ritual Spa Completo', specialist: 'Gabriela Wilson', status: 'Pendiente', duration: 180 },
  ]},
  { time: '17:00', citas: [] },
]

// Clientes registrados — para el CRM del administrador
export const CLIENTS = [
  { id: 1, name: 'Adriana Torres', initials: 'AT', email: 'adriana.torres@email.com', phone: '099 812 4471', visitas: 14, gastado: 512, ultima: '22 Jul 2026', nivel: 'Ámbar', estado: 'Activa' },
  { id: 2, name: 'Camila Ríos', initials: 'CR', email: 'camila.rios@email.com', phone: '098 334 1290', visitas: 9, gastado: 348, ultima: '20 Jul 2026', nivel: 'Bronce', estado: 'Activa' },
  { id: 3, name: 'Sofía Cedeño', initials: 'SC', email: 'sofia.cedeno@email.com', phone: '096 771 5583', visitas: 21, gastado: 894, ultima: '18 Jul 2026', nivel: 'Oro', estado: 'Activa' },
  { id: 4, name: 'María Zambrano', initials: 'MZ', email: 'maria.zambrano@email.com', phone: '099 205 6612', visitas: 6, gastado: 231, ultima: '15 Jul 2026', nivel: 'Bronce', estado: 'Activa' },
  { id: 5, name: 'Valentina Ponce', initials: 'VP', email: 'valentina.ponce@email.com', phone: '097 448 9021', visitas: 3, gastado: 118, ultima: '10 Jul 2026', nivel: 'Bronce', estado: 'Nueva' },
  { id: 6, name: 'Isabel Loor', initials: 'IL', email: 'isabel.loor@email.com', phone: '098 917 3345', visitas: 17, gastado: 663, ultima: '08 Jul 2026', nivel: 'Oro', estado: 'Activa' },
  { id: 7, name: 'Paola Mendoza', initials: 'PM', email: 'paola.mendoza@email.com', phone: '096 620 7788', visitas: 2, gastado: 76, ultima: '02 Jul 2026', nivel: 'Bronce', estado: 'Inactiva' },
]

// Promociones vigentes
export const PROMOTIONS = [
  { id: 1, title: 'Combo Relax Total', desc: 'Masaje Relajante + Facial Express con 30% de descuento. Tu momento de calma completa.', badge: '-30%', valid: 'Hasta el 31 de julio', color: 'terracota', servicios: ['Masaje Relajante', 'Facial Express'], antes: 93, ahora: 65, img: '/img/masaje.jpg' },
  { id: 2, title: 'Martes de Uñas', desc: 'Todas las manicuras a mitad de precio los días martes. Reserva con anticipación.', badge: '-50%', valid: 'Todos los martes', color: 'rosa', servicios: ['Manicura Glossy'], antes: 28, ahora: 14, img: '/img/manicura.jpg' },
  { id: 3, title: 'Primera Visita', desc: 'Bienvenida especial: 20% de descuento en tu primer servicio con nosotras.', badge: '-20%', valid: 'Clientes nuevas', color: 'verde', servicios: ['Cualquier servicio'], antes: null, ahora: null, img: '/img/facial.jpg' },
  { id: 4, title: 'Día de Spa para Dos', desc: 'Trae a una amiga y disfruten el Ritual Spa Completo con precio especial de pareja.', badge: '2x1', valid: 'Hasta agotar cupos', color: 'dorado', servicios: ['Ritual Spa Completo'], antes: 186, ahora: 140, img: '/img/spa.jpg' },
]

// Reseñas de clientes
export const REVIEWS = [
  { id: 1, name: 'Sofía Cedeño', initials: 'SC', service: 'Ritual Spa Completo', rating: 5, date: 'Hace 3 días', text: 'Una experiencia increíble de principio a fin. El ambiente, la atención de Gabriela y el resultado… salí como nueva. Volveré sin duda.' },
  { id: 2, name: 'Camila Ríos', initials: 'CR', service: 'Facial Express', rating: 5, date: 'Hace 1 semana', text: 'Mi piel quedó luminosa y súper hidratada. Daniela explicó cada paso y me recomendó una rutina en casa. Muy profesional.' },
  { id: 3, name: 'Isabel Loor', initials: 'IL', service: 'Manicura Glossy', rating: 4, date: 'Hace 2 semanas', text: 'El acabado glossy dura muchísimo y el diseño quedó precioso. Solo esperé unos minutos de más, pero valió la pena.' },
  { id: 4, name: 'María Zambrano', initials: 'MZ', service: 'Masaje Relajante', rating: 5, date: 'Hace 3 semanas', text: 'Justo lo que necesitaba después de una semana pesada. La presión perfecta y los aceites de lavanda son un sueño.' },
]

// Notificaciones para la campana del header
export const NOTIFICATIONS = [
  { id: 1, icon: '📅', title: 'Recordatorio de cita', text: 'Tu cita de Manicura Glossy es mañana a las 14:30.', time: 'Hace 2 h', unread: true },
  { id: 2, icon: '🎁', title: 'Nueva promoción', text: 'Combo Relax Total con 30% de descuento hasta fin de mes.', time: 'Hace 1 día', unread: true },
  { id: 3, icon: '⭐', title: '¡Ganaste puntos!', text: 'Sumaste 40 puntos por tu última visita. Ya tienes 340 pts.', time: 'Hace 3 días', unread: false },
  { id: 4, icon: '✓', title: 'Reserva confirmada', text: 'Tu Masaje Relajante del 25 de julio quedó confirmado.', time: 'Hace 4 días', unread: false },
]

// Perfil de la clienta (Mi cuenta)
export const CLIENT_PROFILE = {
  name: 'Adriana Torres',
  email: 'adriana.torres@email.com',
  phone: '099 812 4471',
  initials: 'AT',
  ciudad: 'Manta, Manabí',
  miembroDesde: 'Marzo 2025',
  nivel: 'Ámbar',
  puntos: 340,
  puntosSiguienteNivel: 500,
  visitas: 14,
  gastado: 512,
  serviciosFavoritos: ['Manicura Glossy', 'Diseño de Pestañas'],
  metodosPago: [
    { id: 1, tipo: 'Visa', ultimos: '4471', principal: true },
    { id: 2, tipo: 'Mastercard', ultimos: '8820', principal: false },
  ],
}

// Datos para el módulo de Reportes del administrador
export const REPORT_INGRESOS_SEMANA = [
  { dia: 'Lun', valor: 420 },
  { dia: 'Mar', valor: 510 },
  { dia: 'Mié', valor: 380 },
  { dia: 'Jue', valor: 620 },
  { dia: 'Vie', valor: 740 },
  { dia: 'Sáb', valor: 890 },
  { dia: 'Dom', valor: 260 },
]

export const REPORT_SERVICIOS_TOP = [
  { name: 'Manicura Glossy', citas: 128, pct: 100 },
  { name: 'Facial Express', citas: 112, pct: 87 },
  { name: 'Masaje Relajante', citas: 96, pct: 75 },
  { name: 'Diseño de Pestañas', citas: 74, pct: 58 },
  { name: 'Tratamiento Capilar', citas: 61, pct: 48 },
]

export const REPORT_CATEGORIAS = [
  { cat: 'Uñas', pct: 34, color: '#C17A54' },
  { cat: 'Facial', pct: 24, color: '#609C69' },
  { cat: 'Masaje', pct: 20, color: '#C79A2E' },
  { cat: 'Pestañas', pct: 14, color: '#9B6B8F' },
  { cat: 'Cabello', pct: 8, color: '#6B8F9B' },
]

export const REPORT_KPIS = [
  { label: 'Ingresos del mes', value: '$12,840', delta: '+18% vs mes anterior', positivo: true },
  { label: 'Citas atendidas', value: '486', delta: '+42 citas', positivo: true },
  { label: 'Nuevas clientas', value: '38', delta: '+11%', positivo: true },
  { label: 'Tasa de cancelación', value: '4.2%', delta: '-1.3%', positivo: true },
]

// Simula la disponibilidad real que el backend consultaría en base de datos
export function consultarDisponibilidad(serviceName, day, time) {
  const ocupado = ['11:00', '15:00']
  return {
    disponible: !ocupado.includes(time),
    especialista: SPECIALISTS.find(s => s.status === 'Disponible')?.name || 'Tatiana Aguirre',
  }
}
