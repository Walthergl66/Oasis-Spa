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
 * Por ahora expone lo que necesita el módulo de autenticación; el resto de
 * operaciones (perfil editable, base de clientas del panel) se completa junto
 * con los endpoints de usuarios.
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
