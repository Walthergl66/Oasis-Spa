/**
 * Carga de datos iniciales.
 *
 * Reproduce en PostgreSQL exactamente el mismo conjunto de datos que hoy usa el
 * frontend en modo local (`frontend/src/mocks/seed.ts`), para que al conectar la
 * API en la Fase 2 la aplicación se vea igual y las comparaciones de la tesis
 * sean válidas.
 *
 * Las citas se generan relativas a la fecha de ejecución: la agenda, el
 * dashboard y los reportes siempre tienen datos vivos.
 *
 * Uso:  npm run seed
 */
import { createClient } from '@supabase/supabase-js';
import { AppDataSource } from '../data-source';
import {
  Appointment,
  Category,
  Notification,
  Promotion,
  Review,
  Service,
  Specialist,
  User,
} from '../entities';
import { AppointmentStatus } from '../../modules/appointments/entities/appointment.entity';
import { NotificationType } from '../../modules/notifications/entities/notification.entity';
import { PromotionColor } from '../../modules/promotions/entities/promotion.entity';
import { SpecialistStatus } from '../../modules/specialists/entities/specialist.entity';
import {
  LoyaltyLevel,
  UserRole,
} from '../../modules/users/entities/user.entity';

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const addDays = (date: Date, days: number): Date => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

/**
 * Cliente administrativo de Supabase. La clave service_role sólo se usa desde
 * el servidor: crea las cuentas de demostración ya confirmadas, sin correo.
 */
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? 'http://127.0.0.1:54321',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } },
);

/**
 * Crea la cuenta en Supabase Auth y devuelve su id, que será la clave primaria
 * del perfil. Si ya existe (al re-ejecutar el seed) se reutiliza: TRUNCATE
 * borra los perfiles, pero no las cuentas de auth.users.
 */
async function ensureAuthUser(
  email: string,
  password: string,
  name: string,
): Promise<string> {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (data?.user) return data.user.id;

  const yaExiste = /already|registered|exists/i.test(error?.message ?? '');
  if (!yaExiste) {
    throw new Error(`No se pudo crear la cuenta ${email}: ${error?.message}`);
  }

  const { data: list, error: listError } =
    await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;

  const encontrada = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase(),
  );
  if (!encontrada) throw new Error(`La cuenta ${email} existe pero no se encontró.`);

  await supabaseAdmin.auth.admin.updateUserById(encontrada.id, { password });
  return encontrada.id;
}

/** Construye una fecha con hora local a partir de un desfase en días. */
const at = (offsetDays: number, time: string): Date => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = addDays(new Date(), offsetDays);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  console.log('Conectado a la base de datos. Cargando datos iniciales…');

  await dataSource.transaction(async (manager) => {
    // Se limpia en orden inverso a las dependencias para poder re-ejecutar.
    await manager.query(`
      TRUNCATE TABLE
        "notifications", "reviews", "appointments", "promotion_services", "promotions",
        "user_favorite_services", "specialist_categories", "specialists", "services",
        "users", "categories"
      RESTART IDENTITY CASCADE
    `);

    // ---------- Categorías ----------
    const categoryData = [
      { name: 'Uñas', color: '#C17A54' },
      { name: 'Masaje', color: '#C79A2E' },
      { name: 'Pestañas', color: '#9B6B8F' },
      { name: 'Cabello', color: '#6B8F9B' },
      { name: 'Facial', color: '#609C69' },
      { name: 'Spa', color: '#8F6B9B' },
    ];
    const categories = await manager.save(
      categoryData.map((data) => manager.create(Category, data)),
    );
    const category = (name: string): Category =>
      categories.find((item) => item.name === name)!;

    // ---------- Servicios ----------
    const serviceData = [
      {
        name: 'Manicura Glossy',
        category: category('Uñas'),
        price: 28,
        durationMin: 60,
        description:
          'Acabado glossy de larga duración con base nutritiva y detalles a elección. Incluye limado y cutícula.',
        popular: true,
        imageUrl: '/img/manicura.jpg',
        rating: 4.9,
        reviewsCount: 128,
      },
      {
        name: 'Masaje Relajante',
        category: category('Masaje'),
        price: 55,
        durationMin: 90,
        description:
          'Masaje de cuerpo completo con aceites esenciales de lavanda y jojoba. Alivio de tensiones musculares.',
        popular: true,
        imageUrl: '/img/masaje.jpg',
        rating: 4.8,
        reviewsCount: 96,
      },
      {
        name: 'Diseño de Pestañas',
        category: category('Pestañas'),
        price: 65,
        durationMin: 120,
        description:
          'Extensión de pestañas pelo a pelo con fibra de seda. Efecto natural o volumen según preferencia.',
        popular: false,
        imageUrl: '/img/pestanas.jpg',
        rating: 4.7,
        reviewsCount: 74,
      },
      {
        name: 'Tratamiento Capilar',
        category: category('Cabello'),
        price: 45,
        durationMin: 75,
        description:
          'Hidratación profunda con keratina vegetal, sellado de puntas y brillo intenso.',
        popular: false,
        imageUrl: '/img/cabello.jpg',
        rating: 4.6,
        reviewsCount: 61,
      },
      {
        name: 'Facial Express',
        category: category('Facial'),
        price: 38,
        durationMin: 55,
        description:
          'Limpieza profunda, exfoliación suave e hidratación intensiva. Piel luminosa en menos de una hora.',
        popular: true,
        imageUrl: '/img/facial.jpg',
        rating: 4.9,
        reviewsCount: 112,
      },
      {
        name: 'Ritual Spa Completo',
        category: category('Spa'),
        price: 93,
        durationMin: 180,
        description:
          'Experiencia integral: envoltura corporal y facial hidratante. El lujo de un día completo.',
        popular: false,
        imageUrl: '/img/spa.jpg',
        rating: 5.0,
        reviewsCount: 43,
      },
    ];
    const services = await manager.save(
      serviceData.map((data) => manager.create(Service, data)),
    );
    const service = (name: string): Service =>
      services.find((item) => item.name === name)!;

    // ---------- Especialistas ----------
    const specialistData = [
      {
        name: 'Tatiana Aguirre',
        role: 'Nail art & manicura',
        rating: 4.9,
        status: SpecialistStatus.DISPONIBLE,
        categories: ['Uñas', 'Pestañas'],
      },
      {
        name: 'Valeria Mora',
        role: 'Uñas & pestañas',
        rating: 4.7,
        status: SpecialistStatus.DISPONIBLE,
        categories: ['Uñas', 'Pestañas', 'Facial'],
      },
      {
        name: 'Gabriela Wilson',
        role: 'Masajes & spa',
        rating: 4.8,
        status: SpecialistStatus.EN_CITA,
        categories: ['Masaje', 'Spa'],
      },
      {
        name: 'Daniela Cedeño',
        role: 'Facial & cuidado de piel',
        rating: 4.8,
        status: SpecialistStatus.DISPONIBLE,
        categories: ['Facial', 'Spa'],
      },
      {
        name: 'Karla Bravo',
        role: 'Estilismo & cabello',
        rating: 4.6,
        status: SpecialistStatus.DESCANSO,
        categories: ['Cabello'],
      },
    ];
    const specialists = await manager.save(
      specialistData.map((data) =>
        manager.create(Specialist, {
          name: data.name,
          role: data.role,
          rating: data.rating,
          status: data.status,
          initials: initials(data.name),
          categories: data.categories.map(category),
        }),
      ),
    );
    const specialist = (name: string): Specialist =>
      specialists.find((item) => item.name === name)!;

    // ---------- Usuarios ----------
    // Contraseñas de demostración, guardadas con bcrypt como cualquier otra.
    const CLIENT_PASSWORD = 'demo1234';
    const ADMIN_PASSWORD = 'admin1234';

    const userData = [
      {
        name: 'Adriana Torres',
        email: 'adriana.torres@email.com',
        phone: '099 812 4471',
        points: 340,
        level: LoyaltyLevel.AMBAR,
        memberSince: '2025-03-12',
        favorites: ['Manicura Glossy', 'Diseño de Pestañas'],
      },
      {
        name: 'Camila Ríos',
        email: 'camila.rios@email.com',
        phone: '098 334 1290',
        points: 210,
        level: LoyaltyLevel.BRONCE,
        memberSince: '2025-06-02',
        favorites: ['Facial Express'],
      },
      {
        name: 'Sofía Cedeño',
        email: 'sofia.cedeno@email.com',
        phone: '096 771 5583',
        points: 620,
        level: LoyaltyLevel.ORO,
        memberSince: '2024-11-20',
        favorites: ['Ritual Spa Completo'],
      },
      {
        name: 'María Zambrano',
        email: 'maria.zambrano@email.com',
        phone: '099 205 6612',
        points: 130,
        level: LoyaltyLevel.BRONCE,
        memberSince: '2025-09-08',
        favorites: [],
      },
      {
        name: 'Valentina Ponce',
        email: 'valentina.ponce@email.com',
        phone: '097 448 9021',
        points: 40,
        level: LoyaltyLevel.BRONCE,
        memberSince: '2026-05-30',
        favorites: [],
      },
      {
        name: 'Isabel Loor',
        email: 'isabel.loor@email.com',
        phone: '098 917 3345',
        points: 540,
        level: LoyaltyLevel.ORO,
        memberSince: '2024-08-14',
        favorites: ['Manicura Glossy'],
      },
      {
        name: 'Paola Mendoza',
        email: 'paola.mendoza@email.com',
        phone: '096 620 7788',
        points: 20,
        level: LoyaltyLevel.BRONCE,
        memberSince: '2026-01-19',
        favorites: [],
      },
    ];

    // Cada perfil se enlaza a su cuenta de Supabase Auth, ya confirmada: el
    // flujo real de confirmación por correo se prueba con altas nuevas.
    const clients: User[] = [];
    for (const data of userData) {
      const authId = await ensureAuthUser(
        data.email,
        CLIENT_PASSWORD,
        data.name,
      );
      clients.push(
        await manager.save(
          manager.create(User, {
            id: authId,
            name: data.name,
            email: data.email,
            phone: data.phone,
            role: UserRole.CLIENTE,
            points: data.points,
            level: data.level,
            memberSince: data.memberSince,
            favoriteServices: data.favorites.map(service),
          }),
        ),
      );
    }

    const adminId = await ensureAuthUser(
      'admin@oasisspa.ec',
      ADMIN_PASSWORD,
      'Administración Spa',
    );
    await manager.save(
      manager.create(User, {
        id: adminId,
        name: 'Administración Spa',
        email: 'admin@oasisspa.ec',
        phone: '052 620 118',
        role: UserRole.ADMIN,
        memberSince: '2024-01-01',
      }),
    );

    const client = (name: string): User =>
      clients.find((item) => item.name === name)!;

    // ---------- Citas ----------
    const appointmentData: {
      offset: number;
      time: string;
      client: string;
      service: string;
      specialist: string;
      status: AppointmentStatus;
    }[] = [
      // Hoy: alimenta la agenda y el dashboard
      {
        offset: 0,
        time: '09:00',
        client: 'Adriana Torres',
        service: 'Manicura Glossy',
        specialist: 'Tatiana Aguirre',
        status: AppointmentStatus.CONFIRMADA,
      },
      {
        offset: 0,
        time: '10:00',
        client: 'Isabel Loor',
        service: 'Facial Express',
        specialist: 'Daniela Cedeño',
        status: AppointmentStatus.CONFIRMADA,
      },
      {
        offset: 0,
        time: '10:30',
        client: 'Paola Mendoza',
        service: 'Manicura Glossy',
        specialist: 'Valeria Mora',
        status: AppointmentStatus.PENDIENTE,
      },
      {
        offset: 0,
        time: '11:00',
        client: 'Sofía Cedeño',
        service: 'Masaje Relajante',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.CONFIRMADA,
      },
      {
        offset: 0,
        time: '15:00',
        client: 'María Zambrano',
        service: 'Tratamiento Capilar',
        specialist: 'Karla Bravo',
        status: AppointmentStatus.CONFIRMADA,
      },
      {
        offset: 0,
        time: '16:00',
        client: 'Valentina Ponce',
        service: 'Ritual Spa Completo',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.PENDIENTE,
      },
      // Próximos días
      {
        offset: 1,
        time: '09:30',
        client: 'Camila Ríos',
        service: 'Facial Express',
        specialist: 'Daniela Cedeño',
        status: AppointmentStatus.CONFIRMADA,
      },
      {
        offset: 2,
        time: '14:30',
        client: 'Adriana Torres',
        service: 'Manicura Glossy',
        specialist: 'Tatiana Aguirre',
        status: AppointmentStatus.CONFIRMADA,
      },
      {
        offset: 3,
        time: '11:00',
        client: 'Sofía Cedeño',
        service: 'Diseño de Pestañas',
        specialist: 'Valeria Mora',
        status: AppointmentStatus.PENDIENTE,
      },
      {
        offset: 5,
        time: '12:00',
        client: 'Adriana Torres',
        service: 'Masaje Relajante',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.CONFIRMADA,
      },
      // Historial
      {
        offset: -2,
        time: '16:00',
        client: 'Isabel Loor',
        service: 'Masaje Relajante',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.CANCELADA,
      },
      {
        offset: -4,
        time: '14:00',
        client: 'Valentina Ponce',
        service: 'Manicura Glossy',
        specialist: 'Valeria Mora',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -6,
        time: '09:00',
        client: 'Isabel Loor',
        service: 'Manicura Glossy',
        specialist: 'Tatiana Aguirre',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -8,
        time: '15:00',
        client: 'Camila Ríos',
        service: 'Facial Express',
        specialist: 'Daniela Cedeño',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -12,
        time: '10:00',
        client: 'Sofía Cedeño',
        service: 'Ritual Spa Completo',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -20,
        time: '11:00',
        client: 'María Zambrano',
        service: 'Masaje Relajante',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -29,
        time: '11:00',
        client: 'Adriana Torres',
        service: 'Facial Express',
        specialist: 'Daniela Cedeño',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -43,
        time: '16:00',
        client: 'Adriana Torres',
        service: 'Tratamiento Capilar',
        specialist: 'Karla Bravo',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -58,
        time: '10:00',
        client: 'Adriana Torres',
        service: 'Diseño de Pestañas',
        specialist: 'Valeria Mora',
        status: AppointmentStatus.COMPLETADA,
      },
      {
        offset: -76,
        time: '13:00',
        client: 'Adriana Torres',
        service: 'Ritual Spa Completo',
        specialist: 'Gabriela Wilson',
        status: AppointmentStatus.CANCELADA,
      },
    ];

    const appointments = await manager.save(
      appointmentData.map((data) => {
        const bookedService = service(data.service);
        return manager.create(Appointment, {
          client: client(data.client),
          service: bookedService,
          specialist: specialist(data.specialist),
          startsAt: at(data.offset, data.time),
          durationMin: bookedService.durationMin,
          price: bookedService.price,
          status: data.status,
          createdVia: 'seed',
          cancelledAt:
            data.status === AppointmentStatus.CANCELADA
              ? at(data.offset - 1, '12:00')
              : null,
        });
      }),
    );

    // ---------- Reseñas (sólo sobre citas completadas) ----------
    const completed = appointments.filter(
      (item) => item.status === AppointmentStatus.COMPLETADA,
    );
    const reviewTexts = [
      {
        rating: 5,
        text: 'Una experiencia increíble de principio a fin. El ambiente, la atención y el resultado… salí como nueva. Volveré sin duda.',
      },
      {
        rating: 5,
        text: 'Mi piel quedó luminosa y súper hidratada. Me explicaron cada paso y me recomendaron una rutina en casa. Muy profesional.',
      },
      {
        rating: 4,
        text: 'El acabado dura muchísimo y el diseño quedó precioso. Solo esperé unos minutos de más, pero valió la pena.',
      },
      {
        rating: 5,
        text: 'Justo lo que necesitaba después de una semana pesada. La presión perfecta y los aceites de lavanda son un sueño.',
      },
    ];

    await manager.save(
      completed.slice(0, reviewTexts.length).map((appointment, index) =>
        manager.create(Review, {
          appointment,
          client: appointment.client,
          service: appointment.service,
          rating: reviewTexts[index].rating,
          text: reviewTexts[index].text,
        }),
      ),
    );

    // ---------- Promociones ----------
    await manager.save([
      manager.create(Promotion, {
        title: 'Combo Relax Total',
        description:
          'Masaje Relajante + Facial Express con 30% de descuento. Tu momento de calma completa.',
        badge: '-30%',
        color: PromotionColor.TERRACOTA,
        validText: 'Hasta fin de mes',
        priceBefore: 93,
        priceNow: 65,
        imageUrl: '/img/masaje.jpg',
        services: [service('Masaje Relajante'), service('Facial Express')],
      }),
      manager.create(Promotion, {
        title: 'Martes de Uñas',
        description:
          'Todas las manicuras a mitad de precio los días martes. Reserva con anticipación.',
        badge: '-50%',
        color: PromotionColor.ROSA,
        validText: 'Todos los martes',
        priceBefore: 28,
        priceNow: 14,
        imageUrl: '/img/manicura.jpg',
        services: [service('Manicura Glossy')],
      }),
      manager.create(Promotion, {
        title: 'Primera Visita',
        description:
          'Bienvenida especial: 20% de descuento en tu primer servicio con nosotras.',
        badge: '-20%',
        color: PromotionColor.VERDE,
        validText: 'Clientes nuevas',
        priceBefore: null,
        priceNow: null,
        imageUrl: '/img/facial.jpg',
        services: [service('Facial Express')],
      }),
      manager.create(Promotion, {
        title: 'Día de Spa para Dos',
        description:
          'Trae a una amiga y disfruten el Ritual Spa Completo con precio especial de pareja.',
        badge: '2x1',
        color: PromotionColor.DORADO,
        validText: 'Hasta agotar cupos',
        priceBefore: 186,
        priceNow: 140,
        imageUrl: '/img/spa.jpg',
        services: [service('Ritual Spa Completo')],
      }),
    ]);

    // ---------- Notificaciones de la clienta de demostración ----------
    const demo = client('Adriana Torres');
    await manager.save([
      manager.create(Notification, {
        user: demo,
        type: NotificationType.RECORDATORIO,
        icon: '📅',
        title: 'Recordatorio de cita',
        text: 'Tienes una cita de Manicura Glossy próximamente.',
      }),
      manager.create(Notification, {
        user: demo,
        type: NotificationType.PROMOCION,
        icon: '🎁',
        title: 'Nueva promoción',
        text: 'Combo Relax Total con 30% de descuento hasta fin de mes.',
      }),
      manager.create(Notification, {
        user: demo,
        type: NotificationType.FIDELIDAD,
        icon: '⭐',
        title: '¡Ganaste puntos!',
        text: 'Sumaste 40 puntos por tu última visita.',
        read: true,
      }),
    ]);

    console.log(
      `Listo: ${categories.length} categorías, ${services.length} servicios, ` +
        `${specialists.length} especialistas, ${clients.length + 1} usuarios, ` +
        `${appointments.length} citas.`,
    );
  });

  await dataSource.destroy();
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error cargando los datos iniciales:', error);
    process.exit(1);
  });
