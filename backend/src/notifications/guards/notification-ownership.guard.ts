import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../../common/enums/database.enums';
import type { AuthenticatedRequest } from '../../auth/interfaces/authenticated-request.interface';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationOwnershipGuard implements CanActivate {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationsRepository: Repository<Notification>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const profile = request.profile;
    if (!profile) throw new ForbiddenException('Authorization context is missing');

    if (profile.role === UserRole.SUPER_ADMIN || profile.role === UserRole.ADMIN) {
      return true;
    }

    const notificationId = request.params?.id as string | undefined;
    if (!notificationId) throw new ForbiddenException('Notification id is required');

    const notification = await this.notificationsRepository.findOne({
      where: { id: notificationId },
      select: { id: true, userId: true },
    });
    if (!notification) throw new ForbiddenException('Notification not found');

    if (notification.userId !== profile.id) {
      throw new ForbiddenException('You can only access your own notifications');
    }

    return true;
  }
}

