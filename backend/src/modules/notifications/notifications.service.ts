import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

export interface EmitirAviso {
  userId: string;
  type: NotificationType;
  icon: string;
  title: string;
  text: string;
}

/**
 * Avisos dirigidos a un usuario.
 *
 * Es un servicio de salida: otros módulos le piden emitir y él no depende de
 * nadie. Hoy sólo persiste el aviso para la campana de la aplicación; cuando se
 * añada el envío por correo, este será el único punto que haya que tocar.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly repository: Repository<Notification>,
  ) {}

  /**
   * Registra un aviso.
   *
   * Acepta un `EntityManager` opcional para emitirlo dentro de la misma
   * transacción que lo origina: si la cita no llega a crearse, tampoco debe
   * quedar el aviso diciendo que se creó.
   */
  async emit(aviso: EmitirAviso, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(Notification) : this.repository;
    await repo.save(repo.create(aviso));
  }

  findForUser(userId: string): Promise<Notification[]> {
    return this.repository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: 50,
    });
  }

  async markAllRead(userId: string): Promise<void> {
    await this.repository.update({ userId, read: false }, { read: true });
  }
}
