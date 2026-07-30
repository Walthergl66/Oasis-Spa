import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

export const ROLES_KEY = 'roles';

/**
 * Restringe un endpoint a determinados roles.
 *
 * Ejemplo: `@Roles(UserRole.ADMIN, UserRole.ESPECIALISTA)` en la agenda, que
 * ven tanto administración como el personal, pero no las clientas.
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
