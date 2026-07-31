import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LoyaltyLevel, User, UserRole } from './entities/user.entity';

export interface CreateProfileInput {
  name: string;
  email: string;
  /** Hash bcrypt; el módulo de autenticación es quien lo calcula. */
  passwordHash: string;
  phone?: string;
  city?: string;
  role?: UserRole;
}

/**
 * Usuarios del sistema.
 *
 * Por ahora expone lo que necesita la autenticación; el perfil editable y la
 * base de clientas del panel se completan junto con el resto del módulo.
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
   * Igual que `findByEmail`, pero incluyendo el hash de la contraseña.
   *
   * Existe como método aparte para que traer el hash sea siempre una decisión
   * consciente: la columna está marcada `select: false` justamente para que no
   * aparezca por accidente en ninguna otra consulta.
   */
  findByEmailWithPassword(email: string): Promise<User | null> {
    return this.repository
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .where('LOWER(user.email) = LOWER(:email)', { email: email.trim() })
      .getOne();
  }

  createProfile(input: CreateProfileInput): Promise<User> {
    const user = this.repository.create({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      passwordHash: input.passwordHash,
      phone: input.phone?.trim() ?? '',
      city: input.city?.trim() || 'Manta, Manabí',
      role: input.role ?? UserRole.CLIENTE,
      emailVerified: false,
      points: 0,
      level: LoyaltyLevel.BRONCE,
      memberSince: new Date().toISOString().slice(0, 10),
      active: true,
    });
    return this.repository.save(user);
  }
}
