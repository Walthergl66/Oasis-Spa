import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyLevel, User, UserRole } from './entities/user.entity';

export interface CreateProfileInput {
  /** Identificador emitido por Supabase Auth: es la clave primaria del perfil. */
  id: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  role?: UserRole;
}

/**
 * Perfiles de usuario.
 *
 * Este servicio NO gestiona credenciales: de eso se encarga Supabase Auth. Aquí
 * vive únicamente el dato de dominio (nombre, contacto, rol, fidelidad).
 *
 * Por ahora expone lo que necesita el módulo de autenticación; el perfil
 * editable y la base de clientas del panel se completan junto con el resto de
 * endpoints de usuarios.
 */
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly repository: Repository<User>,
  ) {}

  findById(id: string): Promise<User | null> {
    return this.repository.findOne({ where: { id } });
  }

  async getById(id: string): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException('El usuario no existe.');
    return user;
  }

  findByEmail(email: string): Promise<User | null> {
    return this.repository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Clientas registradas en el mes en curso.
   *
   * El mes se calcula en la zona del spa: una clienta que se registra a las
   * 20:00 del día 31 pertenece a ese mes, no al siguiente por efecto de UTC.
   */
  async countNewClientsThisMonth(): Promise<number> {
    const fila = await this.repository
      .createQueryBuilder('user')
      .select('COUNT(*)::int', 'total')
      .where('user.role = :rol', { rol: UserRole.CLIENTE })
      .andWhere(
        `date_trunc('month', user.created_at AT TIME ZONE 'America/Guayaquil')
         = date_trunc('month', now() AT TIME ZONE 'America/Guayaquil')`,
      )
      .getRawOne<{ total: number }>();
    return Number(fila?.total ?? 0);
  }

  /**
   * Acredita puntos de fidelidad y recalcula el nivel.
   *
   * Un punto por dólar facturado. El nivel se deriva de los puntos, así que se
   * recalcula aquí y no se deja a merced de quien actualice el perfil.
   */
  async addPoints(userId: string, importe: number): Promise<number> {
    const user = await this.getById(userId);
    user.points += Math.round(importe);
    user.level =
      user.points >= 600
        ? LoyaltyLevel.ORO
        : user.points >= 300
          ? LoyaltyLevel.AMBAR
          : LoyaltyLevel.BRONCE;
    await this.repository.save(user);
    return user.points;
  }

  /** Crea el perfil asociado a una cuenta ya existente en Supabase Auth. */
  createProfile(input: CreateProfileInput): Promise<User> {
    const user = this.repository.create({
      id: input.id,
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone?.trim() ?? '',
      city: input.city?.trim() || 'Manta, Manabí',
      role: input.role ?? UserRole.CLIENTE,
      points: 0,
      level: LoyaltyLevel.BRONCE,
      memberSince: new Date().toISOString().slice(0, 10),
      active: true,
    });
    return this.repository.save(user);
  }
}
