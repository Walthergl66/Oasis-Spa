export type Service = {
  id: string;
  name: string;
  duration: string;
  price: number;
  tag: string;
  description: string;
  vipOnly?: boolean;
};

export type Promotion = {
  id: string;
  title: string;
  discount: string;
  description: string;
  status: 'Activa' | 'Programada';
};

export type Appointment = {
  id: string;
  client: string;
  serviceId: string;
  service: string;
  employee: string;
  date: string;
  time: string;
  status: 'Confirmada' | 'Pendiente' | 'Cancelada';
  vip?: boolean;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  phone: string;
  vip: boolean;
  visits: number;
};

export const services: Service[] = [
  {
    id: 'relax',
    name: 'Masaje relajante',
    duration: '60 min',
    price: 145000,
    tag: 'Mas solicitado',
    description: 'Presion suave, aromaterapia y respiracion guiada para soltar tension profunda.',
  },
  {
    id: 'facial',
    name: 'Limpieza facial profunda',
    duration: '50 min',
    price: 118000,
    tag: 'Facial',
    description: 'Diagnostico de piel, exfoliacion delicada, extraccion e hidratacion luminosa.',
  },
  {
    id: 'ritual',
    name: 'Ritual corporal Oasis',
    duration: '90 min',
    price: 220000,
    tag: 'Premium',
    description: 'Exfoliacion botanica, envoltura tibia y masaje con aceites nutritivos.',
  },
  {
    id: 'stones',
    name: 'Piedras calientes',
    duration: '70 min',
    price: 185000,
    tag: 'Terapia',
    description: 'Calor mineral y movimientos lentos para relajar espalda, cuello y hombros.',
  },
  {
    id: 'vip-garden',
    name: 'Ceremonia VIP Jardín',
    duration: '110 min',
    price: 290000,
    tag: 'VIP',
    description: 'Ritual privado con infusión, masaje a cuatro manos y zona de descanso exclusiva.',
    vipOnly: true,
  },
  {
    id: 'vip-couple',
    name: 'Suite VIP pareja',
    duration: '120 min',
    price: 360000,
    tag: 'VIP',
    description: 'Experiencia para dos con hidroterapia, facial express y brindis sin alcohol.',
    vipOnly: true,
  },
];

export const promotions: Promotion[] = [
  {
    id: 'duo',
    title: 'Duo relajante',
    discount: '15%',
    description: 'Dos masajes de 60 minutos con aroma a lavanda y te de bienvenida.',
    status: 'Activa',
  },
  {
    id: 'facial-season',
    title: 'Facial de temporada',
    discount: '20%',
    description: 'Limpieza facial profunda con hidratacion de velo botanico incluida.',
    status: 'Activa',
  },
  {
    id: 'ritual-weekend',
    title: 'Ritual completo',
    discount: '12%',
    description: 'Paquete corporal premium para viernes y sabados en agenda seleccionada.',
    status: 'Programada',
  },
];

export const appointments: Appointment[] = [
  {
    id: 'apt-001',
    client: 'María López',
    serviceId: 'relax',
    service: 'Masaje relajante',
    employee: 'Laura Méndez',
    date: '2026-05-04',
    time: '10:00',
    status: 'Confirmada',
    vip: true,
  },
  {
    id: 'apt-002',
    client: 'Camila Torres',
    serviceId: 'ritual',
    service: 'Ritual corporal Oasis',
    employee: 'Sofía Duarte',
    date: '2026-05-04',
    time: '15:00',
    status: 'Pendiente',
  },
  {
    id: 'apt-003',
    client: 'Andrés Ruiz',
    serviceId: 'facial',
    service: 'Limpieza facial profunda',
    employee: 'Nicolás Peña',
    date: '2026-05-05',
    time: '11:30',
    status: 'Confirmada',
  },
];

export const users: UserRecord[] = [
  { id: 'u-001', name: 'María López', email: 'maria@oasis.com', phone: '300 111 2233', vip: true, visits: 14 },
  { id: 'u-002', name: 'Camila Torres', email: 'camila@oasis.com', phone: '310 222 4455', vip: false, visits: 4 },
  { id: 'u-003', name: 'Andrés Ruiz', email: 'andres@oasis.com', phone: '315 333 6677', vip: false, visits: 7 },
  { id: 'u-004', name: 'Valentina Mora', email: 'vale@oasis.com', phone: '320 444 8899', vip: true, visits: 21 },
];

export const employees = ['Laura Méndez', 'Sofía Duarte', 'Nicolás Peña', 'Elena Vargas'];

export const timeSlots = ['09:00', '10:30', '12:00', '14:00', '15:30', '17:00'];

export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
