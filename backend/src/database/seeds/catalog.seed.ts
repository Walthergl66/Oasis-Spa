/**
 * Carga inicial del catálogo — apta para producción.
 *
 * A diferencia de `seed.ts` (demostración), este script:
 *
 *   - NO borra nada: inserta sólo lo que falta, comparando por nombre.
 *   - NO crea clientas de prueba, ni citas, ni reseñas inventadas.
 *   - Crea una única cuenta de administración, con la contraseña que se le
 *     indique por variable de entorno. Nunca una contraseña por defecto.
 *
 * Es el que debe ejecutarse contra el proyecto de Supabase en la nube para
 * dejar el sistema listo antes de que el spa empiece a usarlo.
 *
 * Uso:
 *   ADMIN_EMAIL=admin@oasisspa.ec ADMIN_PASSWORD=... npm run seed:catalogo
 */
import { createClient } from '@supabase/supabase-js';
import { EntityManager } from 'typeorm';
import { AppDataSource } from '../data-source';
import { Category, Promotion, Service, Specialist, User } from '../entities';
import { PromotionColor } from '../../modules/promotions/entities/promotion.entity';
import { SpecialistStatus } from '../../modules/specialists/entities/specialist.entity';
import { UserRole } from '../../modules/users/entities/user.entity';

const initials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL ?? '',
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CATEGORIAS = [
  { name: 'Uñas', color: '#C17A54' },
  { name: 'Masaje', color: '#C79A2E' },
  { name: 'Pestañas', color: '#9B6B8F' },
  { name: 'Cabello', color: '#6B8F9B' },
  { name: 'Facial', color: '#609C69' },
  { name: 'Spa', color: '#8F6B9B' },
];

const SERVICIOS = [
  {
    name: 'Manicura Glossy',
    categoria: 'Uñas',
    price: 28,
    durationMin: 60,
    description:
      'Acabado glossy de larga duración con base nutritiva y detalles a elección. Incluye limado y cutícula.',
    popular: true,
    imageUrl: '/img/manicura.jpg',
  },
  {
    name: 'Masaje Relajante',
    categoria: 'Masaje',
    price: 55,
    durationMin: 90,
    description:
      'Masaje de cuerpo completo con aceites esenciales de lavanda y jojoba. Alivio de tensiones musculares.',
    popular: true,
    imageUrl: '/img/masaje.jpg',
  },
  {
    name: 'Diseño de Pestañas',
    categoria: 'Pestañas',
    price: 65,
    durationMin: 120,
    description:
      'Extensión de pestañas pelo a pelo con fibra de seda. Efecto natural o volumen según preferencia.',
    popular: false,
    imageUrl: '/img/pestanas.jpg',
  },
  {
    name: 'Tratamiento Capilar',
    categoria: 'Cabello',
    price: 45,
    durationMin: 75,
    description:
      'Hidratación profunda con keratina vegetal, sellado de puntas y brillo intenso.',
    popular: false,
    imageUrl: '/img/cabello.jpg',
  },
  {
    name: 'Facial Express',
    categoria: 'Facial',
    price: 38,
    durationMin: 55,
    description:
      'Limpieza profunda, exfoliación suave e hidratación intensiva. Piel luminosa en menos de una hora.',
    popular: true,
    imageUrl: '/img/facial.jpg',
  },
  {
    name: 'Ritual Spa Completo',
    categoria: 'Spa',
    price: 93,
    durationMin: 180,
    description:
      'Experiencia integral: envoltura corporal y facial hidratante. El lujo de un día completo.',
    popular: false,
    imageUrl: '/img/spa.jpg',
  },
];

const ESPECIALISTAS = [
  {
    name: 'Tatiana Aguirre',
    role: 'Nail art & manicura',
    categorias: ['Uñas', 'Pestañas'],
  },
  {
    name: 'Valeria Mora',
    role: 'Uñas & pestañas',
    categorias: ['Uñas', 'Pestañas', 'Facial'],
  },
  {
    name: 'Gabriela Wilson',
    role: 'Masajes & spa',
    categorias: ['Masaje', 'Spa'],
  },
  {
    name: 'Daniela Cedeño',
    role: 'Facial & cuidado de piel',
    categorias: ['Facial', 'Spa'],
  },
  { name: 'Karla Bravo', role: 'Estilismo & cabello', categorias: ['Cabello'] },
];

const PROMOCIONES = [
  {
    title: 'Combo Relax Total',
    description:
      'Masaje Relajante + Facial Express con 30% de descuento. Tu momento de calma completa.',
    badge: '-30%',
    color: PromotionColor.TERRACOTA,
    validText: 'Hasta fin de mes',
    priceBefore: 93,
    priceNow: 65,
    imageUrl: '/img/masaje.jpg',
    servicios: ['Masaje Relajante', 'Facial Express'],
  },
  {
    title: 'Martes de Uñas',
    description:
      'Todas las manicuras a mitad de precio los días martes. Reserva con anticipación.',
    badge: '-50%',
    color: PromotionColor.ROSA,
    validText: 'Todos los martes',
    priceBefore: 28,
    priceNow: 14,
    imageUrl: '/img/manicura.jpg',
    servicios: ['Manicura Glossy'],
  },
  {
    title: 'Primera Visita',
    description:
      'Bienvenida especial: 20% de descuento en tu primer servicio con nosotras.',
    badge: '-20%',
    color: PromotionColor.VERDE,
    validText: 'Clientes nuevas',
    priceBefore: null,
    priceNow: null,
    imageUrl: '/img/facial.jpg',
    servicios: ['Facial Express'],
  },
];

/** Crea la cuenta de administración si no existe. Nunca usa clave por defecto. */
async function crearAdministracion(manager: EntityManager): Promise<void> {
  const email = (process.env.ADMIN_EMAIL ?? '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? '';

  if (!email || !password) {
    console.log(
      '  (sin ADMIN_EMAIL/ADMIN_PASSWORD: no se crea cuenta de administración)',
    );
    return;
  }
  if (password.length < 12) {
    throw new Error(
      'ADMIN_PASSWORD debe tener al menos 12 caracteres: es la cuenta con acceso total al sistema.',
    );
  }

  const existente = await manager.findOne(User, { where: { email } });
  if (existente) {
    console.log(`  administración: ya existe (${email})`);
    return;
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name: 'Administración Oasis Spa' },
  });
  if (error || !data.user) {
    throw new Error(
      `No se pudo crear la cuenta de administración: ${error?.message}`,
    );
  }

  await manager.save(
    manager.create(User, {
      id: data.user.id,
      name: 'Administración Oasis Spa',
      email,
      role: UserRole.ADMIN,
      memberSince: new Date().toISOString().slice(0, 10),
    }),
  );
  console.log(`  administración: creada (${email})`);
}

async function cargarCatalogo(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  console.log(`Conectado a ${process.env.DB_HOST}. Cargando catálogo…`);

  await dataSource.transaction(async (manager) => {
    // ---------- Categorías ----------
    let nuevasCategorias = 0;
    for (const data of CATEGORIAS) {
      const existe = await manager.findOne(Category, {
        where: { name: data.name },
      });
      if (existe) continue;
      await manager.save(manager.create(Category, data));
      nuevasCategorias += 1;
    }
    const categorias = await manager.find(Category);
    const categoria = (name: string): Category =>
      categorias.find((c) => c.name === name)!;
    console.log(
      `  categorías: ${nuevasCategorias} nuevas de ${CATEGORIAS.length}`,
    );

    // ---------- Servicios ----------
    let nuevosServicios = 0;
    for (const data of SERVICIOS) {
      const existe = await manager.findOne(Service, {
        where: { name: data.name },
      });
      if (existe) continue;
      await manager.save(
        manager.create(Service, {
          name: data.name,
          description: data.description,
          category: categoria(data.categoria),
          durationMin: data.durationMin,
          price: data.price,
          imageUrl: data.imageUrl,
          popular: data.popular,
        }),
      );
      nuevosServicios += 1;
    }
    const servicios = await manager.find(Service);
    const servicio = (name: string): Service =>
      servicios.find((s) => s.name === name)!;
    console.log(
      `  servicios: ${nuevosServicios} nuevos de ${SERVICIOS.length}`,
    );

    // ---------- Especialistas ----------
    let nuevasEspecialistas = 0;
    for (const data of ESPECIALISTAS) {
      const existe = await manager.findOne(Specialist, {
        where: { name: data.name },
      });
      if (existe) continue;
      await manager.save(
        manager.create(Specialist, {
          name: data.name,
          role: data.role,
          initials: initials(data.name),
          status: SpecialistStatus.DISPONIBLE,
          categories: data.categorias.map(categoria),
        }),
      );
      nuevasEspecialistas += 1;
    }
    console.log(
      `  especialistas: ${nuevasEspecialistas} nuevas de ${ESPECIALISTAS.length}`,
    );

    // ---------- Promociones ----------
    let nuevasPromociones = 0;
    for (const data of PROMOCIONES) {
      const existe = await manager.findOne(Promotion, {
        where: { title: data.title },
      });
      if (existe) continue;
      await manager.save(
        manager.create(Promotion, {
          title: data.title,
          description: data.description,
          badge: data.badge,
          color: data.color,
          validText: data.validText,
          priceBefore: data.priceBefore,
          priceNow: data.priceNow,
          imageUrl: data.imageUrl,
          services: data.servicios.map(servicio),
        }),
      );
      nuevasPromociones += 1;
    }
    console.log(
      `  promociones: ${nuevasPromociones} nuevas de ${PROMOCIONES.length}`,
    );

    // ---------- Administración ----------
    await crearAdministracion(manager);
  });

  await dataSource.destroy();
  console.log('Catálogo listo. No se borró ni modificó ningún dato existente.');
}

cargarCatalogo()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error cargando el catálogo:', error);
    process.exit(1);
  });
