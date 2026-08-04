/**
 * Cuentas y citas TEMPORALES para verificar los reportes contra datos reales.
 * Todo lleva el prefijo `qa-` y se elimina con `... eliminar`.
 */
import { createClient } from '@supabase/supabase-js';
import { AppDataSource } from '../data-source';
import { Service, Specialist, User } from '../entities';
import { UserRole } from '../../modules/users/entities/user.entity';
import { AppointmentStatus } from '../../modules/appointments/entities/appointment.entity';

const admin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } },
);

const CUENTAS = [
  { email: 'qa-clienta@oasisspa.test', name: 'QA Clienta', role: UserRole.CLIENTE },
  { email: 'qa-admin@oasisspa.test', name: 'QA Admin', role: UserRole.ADMIN },
];
const PASSWORD = 'QaPrueba2026!segura';

/** Citas de prueba: desfase en días, hora, servicio y estado final. */
const CITAS: {
  offset: number;
  hora: string;
  servicio: string;
  estado: AppointmentStatus;
}[] = [
  { offset: 0, hora: '09:00', servicio: 'Manicura Glossy', estado: AppointmentStatus.CONFIRMADA },
  { offset: 0, hora: '11:00', servicio: 'Facial Express', estado: AppointmentStatus.CONFIRMADA },
  { offset: -1, hora: '10:00', servicio: 'Manicura Glossy', estado: AppointmentStatus.COMPLETADA },
  { offset: -2, hora: '15:00', servicio: 'Masaje Relajante', estado: AppointmentStatus.COMPLETADA },
  { offset: -3, hora: '11:00', servicio: 'Manicura Glossy', estado: AppointmentStatus.COMPLETADA },
  { offset: -4, hora: '16:00', servicio: 'Tratamiento Capilar', estado: AppointmentStatus.CANCELADA },
];

function fechaSpa(offset: number, hora: string): Date {
  const hoy = new Date(
    new Date().toLocaleString('en-US', { timeZone: 'America/Guayaquil' }),
  );
  hoy.setDate(hoy.getDate() + offset);
  const iso = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
  return new Date(`${iso}T${hora}:00-05:00`);
}

async function crear() {
  const ds = await AppDataSource.initialize();
  const idPorCorreo = new Map<string, string>();

  for (const c of CUENTAS) {
    const { data, error } = await admin.auth.admin.createUser({
      email: c.email,
      password: PASSWORD,
      email_confirm: true,
      user_metadata: { name: c.name },
    });
    let id = data?.user?.id;
    if (!id) {
      if (!/already|registered|exists/i.test(error?.message ?? '')) throw error;
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const usuarios = list.users as { id: string; email?: string }[];
      id = usuarios.find((u) => u.email === c.email)!.id;
    }
    const repo = ds.getRepository(User);
    if (!(await repo.findOne({ where: { id } }))) {
      await repo.save(repo.create({ id, name: c.name, email: c.email, role: c.role }));
    }
    idPorCorreo.set(c.email, id);
    console.log(`${c.role}: ${c.email}`);
  }

  const clientaId = idPorCorreo.get('qa-clienta@oasisspa.test')!;
  const servicios = await ds.getRepository(Service).find({ relations: { category: true } });
  const especialistas = await ds
    .getRepository(Specialist)
    .find({ relations: { categories: true } });

  let creadas = 0;
  for (const c of CITAS) {
    const servicio = servicios.find((s) => s.name === c.servicio);
    if (!servicio) continue;
    const especialista = especialistas.find((e) =>
      e.categories.some((cat) => cat.id === servicio.categoryId),
    );
    if (!especialista) continue;

    await ds.query(
      `INSERT INTO appointments
         (client_id, service_id, specialist_id, starts_at, duration_min, price, status, created_via)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'qa')`,
      [
        clientaId,
        servicio.id,
        especialista.id,
        fechaSpa(c.offset, c.hora).toISOString(),
        servicio.durationMin,
        servicio.price,
        c.estado,
      ],
    );
    creadas += 1;
  }
  console.log(`citas de prueba creadas: ${creadas}`);
  await ds.destroy();
}

async function eliminar() {
  const ds = await AppDataSource.initialize();
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const usuarios = list.users as { id: string; email?: string }[];

  await ds.query("DELETE FROM appointments WHERE created_via = 'qa'");
  for (const c of CUENTAS) {
    const cuenta = usuarios.find((u) => u.email === c.email);
    if (!cuenta) continue;
    await ds.query('DELETE FROM appointments WHERE client_id = $1', [cuenta.id]);
    await ds.query('DELETE FROM notifications WHERE user_id = $1', [cuenta.id]);
    await admin.auth.admin.deleteUser(cuenta.id);
    console.log(`eliminada: ${c.email}`);
  }
  const [{ perfiles }] = await ds.query(
    "SELECT count(*)::int AS perfiles FROM users WHERE email LIKE 'qa-%'",
  );
  const [{ citas }] = await ds.query(
    "SELECT count(*)::int AS citas FROM appointments WHERE created_via = 'qa'",
  );
  console.log(`residuos -> perfiles: ${perfiles} | citas: ${citas}`);
  await ds.destroy();
}

const accion = process.argv[2] === 'eliminar' ? eliminar : crear;
accion()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
