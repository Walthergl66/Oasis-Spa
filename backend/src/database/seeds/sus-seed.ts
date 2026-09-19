/**
 * Seed de datos realistas para la evaluación SUS (Sprint 8).
 * Idempotente: omite lo que ya exista (por email o nombre).
 * Uso: `npm run seed` (requiere PostgreSQL en marcha).
 */
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NestFactory } from '@nestjs/core';
import bcrypt from 'bcryptjs';
import { validate } from '../../config/env.validation.js';
import { typeOrmConfigAsync } from '../../config/database.config.js';
import { UsersModule } from '../../modules/users/users.module.js';
import { UsersService } from '../../modules/users/users.service.js';
import { ServicesModule } from '../../modules/services/services.module.js';
import { ServicesService } from '../../modules/services/services.service.js';
import { EmployeesModule } from '../../modules/employees/employees.module.js';
import { EmployeesService } from '../../modules/employees/employees.service.js';
import { Role } from '../../common/enums/role.enum.js';

const SERVICES = [
  { name: 'Masaje Relajante', description: 'Masaje corporal con aceites esenciales y presión moderada.', durationMinutes: 60, price: 45, category: 'Masaje' },
  { name: 'Masaje Descontracturante', description: 'Alivio de tensión muscular en espalda, cuello y hombros.', durationMinutes: 50, price: 50, category: 'Masaje' },
  { name: 'Limpieza Facial Profunda', description: 'Exfoliación, extracción suave e hidratación facial.', durationMinutes: 60, price: 40, category: 'Facial' },
  { name: 'Hidratación Facial con Vitamina C', description: 'Tratamiento iluminador para pieles opacas o cansadas.', durationMinutes: 45, price: 48, category: 'Facial' },
  { name: 'Exfoliación Corporal', description: 'Renovación de la piel con sales marinas y aceites.', durationMinutes: 40, price: 38, category: 'Corporal' },
  { name: 'Chocolaterapia Corporal', description: 'Envoltura de chocolate con efecto relajante y nutritivo.', durationMinutes: 60, price: 55, category: 'Corporal' },
  { name: 'Manicura Spa', description: 'Cuidado de manos con exfoliación y esmaltado semipermanente.', durationMinutes: 45, price: 25, category: 'Manos y Pies' },
  { name: 'Pedicura Spa', description: 'Cuidado de pies con masaje relajante y esmaltado.', durationMinutes: 50, price: 28, category: 'Manos y Pies' },
];

const SPECIALISTS = [
  { email: 'ana.paz@oasisspa.com', password: 'Terapeuta123*', firstName: 'Ana', lastName: 'Paz', specialty: 'Masoterapia', bio: 'Especialista en masajes relajantes y descontracturantes.' },
  { email: 'luis.vega@oasisspa.com', password: 'Terapeuta123*', firstName: 'Luis', lastName: 'Vega', specialty: 'Estética facial', bio: 'Experto en limpiezas e hidrataciones faciales.' },
  { email: 'carla.ruiz@oasisspa.com', password: 'Terapeuta123*', firstName: 'Carla', lastName: 'Ruiz', specialty: 'Tratamientos corporales', bio: 'Especialista en exfoliaciones y chocolaterapia.' },
];

const TEST_CLIENTS = [
  { email: 'cliente.sus@oasisspa.com', password: 'Cliente123*', firstName: 'Sofía', lastName: 'Mendoza' },
  { email: 'cliente2.sus@oasisspa.com', password: 'Cliente123*', firstName: 'Diego', lastName: 'Torres' },
];

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync(typeOrmConfigAsync),
    UsersModule,
    ServicesModule,
    EmployeesModule,
  ],
})
class SeedModule {}

async function main() {
  const context = await NestFactory.createApplicationContext(SeedModule, { logger: ['log', 'warn', 'error'] });
  try {
    const usersService = context.get(UsersService);
    const servicesService = context.get(ServicesService);
    const employeesService = context.get(EmployeesService);

    let servicesCreated = 0;
    const serviceIds: string[] = [];
    for (const s of SERVICES) {
      const existing = await servicesService.findAll({ search: s.name });
      const match = existing.find((e) => e.name === s.name);
      if (match) {
        serviceIds.push(match.id);
        continue;
      }
      const created = await servicesService.create(s);
      serviceIds.push(created.id);
      servicesCreated += 1;
    }

    let specialistsCreated = 0;
    for (const [index, sp] of SPECIALISTS.entries()) {
      let user = await usersService.findByEmail(sp.email);
      if (!user) {
        user = await usersService.create(
          {
            email: sp.email,
            password: sp.password,
            firstName: sp.firstName,
            lastName: sp.lastName,
            role: Role.EMPLOYEE,
          },
          await bcrypt.hash(sp.password, 10),
        );
        specialistsCreated += 1;
      }
      try {
        await employeesService.findByUserId(user.id);
      } catch {
        await employeesService.create({
          userId: user.id,
          specialty: sp.specialty,
          bio: sp.bio,
          serviceIds: serviceIds.filter((_, i) => i % 3 === index % 3).slice(0, 4),
        });
      }
    }

    let clientsCreated = 0;
    for (const c of TEST_CLIENTS) {
      const existing = await usersService.findByEmail(c.email);
      if (!existing) {
        await usersService.create(
          { email: c.email, password: c.password, firstName: c.firstName, lastName: c.lastName, role: Role.CLIENT },
          await bcrypt.hash(c.password, 10),
        );
        clientsCreated += 1;
      }
    }

    // eslint-disable-next-line no-console
    console.log(
      `SUS seed OK: ${servicesCreated} servicios nuevos, ${specialistsCreated} especialistas nuevos, ${clientsCreated} clientes de prueba nuevos.`,
    );
  } finally {
    await context.close();
  }
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error('SUS seed FAILED:', error);
  process.exit(1);
});
