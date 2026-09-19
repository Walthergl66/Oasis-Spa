import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import { In, Repository } from 'typeorm';
import webpush from 'web-push';
import { PushSubscriptionEntity } from './entities/push-subscription.entity.js';
import { SubscribePushDto } from './dto/subscribe-push.dto.js';
import { Appointment } from '../appointments/entities/appointment.entity.js';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum.js';

export interface PushPayload {
  title: string;
  body: string;
  url?: string;
  tag?: string;
}

export interface SentRecord extends PushPayload {
  userId: string;
  sentAt: string;
  channel: 'push' | 'log';
}

function formatUtc(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString().replace('T', ' ').substring(0, 16) + ' UTC';
}

/** Ventana del recordatorio programado: citas que inician en las próximas 24h */
const REMINDER_WINDOW_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;
  private readonly outbox: SentRecord[] = [];

  constructor(
    @InjectRepository(PushSubscriptionEntity)
    private readonly subscriptionRepository: Repository<PushSubscriptionEntity>,
    @InjectRepository(Appointment)
    private readonly appointmentRepository: Repository<Appointment>,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const publicKey = this.configService.get<string>('VAPID_PUBLIC_KEY', '');
    const privateKey = this.configService.get<string>('VAPID_PRIVATE_KEY', '');
    const subject =
      this.configService.get<string>('VAPID_SUBJECT') ?? 'mailto:soporte@oasisspa.com';

    if (publicKey && privateKey && !publicKey.includes('mock')) {
      webpush.setVapidDetails(subject, publicKey, privateKey);
      this.vapidConfigured = true;
      this.logger.log('Web Push VAPID configurado correctamente.');
    } else {
      this.logger.warn(
        'VAPID con claves mock: las notificaciones se registrarán en log sin envío real.',
      );
    }
  }

  isPushLive(): boolean {
    return this.vapidConfigured;
  }

  getOutbox(limit = 50): SentRecord[] {
    return this.outbox.slice(-limit).reverse();
  }

  async subscribe(
    userId: string,
    dto: SubscribePushDto,
  ): Promise<PushSubscriptionEntity> {
    const existing = await this.subscriptionRepository.findOne({
      where: { endpoint: dto.endpoint },
    });
    if (existing) {
      existing.userId = userId;
      existing.p256dh = dto.keys.p256dh;
      existing.auth = dto.keys.auth;
      existing.userAgent = dto.userAgent || null;
      return this.subscriptionRepository.save(existing);
    }
    const created = this.subscriptionRepository.create({
      userId,
      endpoint: dto.endpoint,
      p256dh: dto.keys.p256dh,
      auth: dto.keys.auth,
      userAgent: dto.userAgent || null,
    });
    return this.subscriptionRepository.save(created);
  }

  async findMySubscriptions(userId: string): Promise<PushSubscriptionEntity[]> {
    return this.subscriptionRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async unsubscribe(userId: string, endpoint: string): Promise<void> {
    await this.subscriptionRepository.delete({ userId, endpoint });
  }

  async sendPushToUser(userId: string, payload: PushPayload): Promise<number> {
    const subscriptions = await this.subscriptionRepository.find({
      where: { userId },
    });
    if (subscriptions.length === 0 || !this.vapidConfigured) {
      this.record({ ...payload, userId, channel: 'log' });
      this.logger.log(`[notify:${payload.tag || 'general'}] user=${userId} :: ${payload.title} - ${payload.body}`);
      return 0;
    }
    let delivered = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload),
        );
        delivered += 1;
      } catch (error) {
        const statusCode =
          typeof error === 'object' && error !== null && 'statusCode' in error
            ? Number((error as { statusCode: unknown }).statusCode)
            : 0;
        if (statusCode === 404 || statusCode === 410) {
          await this.subscriptionRepository.delete({ id: sub.id });
          this.logger.warn(`Suscripción caducada eliminada: ${sub.endpoint.slice(0, 60)}...`);
        } else {
          this.logger.warn(`Fallo envío push a ${userId}: ${String(error)}`);
        }
      }
    }
    this.record({ ...payload, userId, channel: 'push' });
    return delivered;
  }

  @OnEvent('appointment.created')
  async handleAppointmentCreated(appointment: Appointment): Promise<void> {
    await this.sendPushToUser(appointment.clientId, {
      title: 'Cita reservada en Oasis Spa',
      body: `Tu reserva para ${appointment.service?.name ?? 'tu servicio'} quedó en estado pendiente (${formatUtc(appointment.startTime)}). Te avisaremos al confirmarla.`,
      url: '/mis-citas',
      tag: 'appointment.created',
    });
    this.logger.log(`Admin notice: nueva cita ${appointment.id} (${formatUtc(appointment.startTime)})`);
  }

  @OnEvent('appointment.confirmed')
  async handleAppointmentConfirmed(appointment: Appointment): Promise<void> {
    await this.sendPushToUser(appointment.clientId, {
      title: 'Cita confirmada',
      body: `Tu cita de ${appointment.service?.name ?? 'spa'} fue confirmada para el ${formatUtc(appointment.startTime)}. ¡Te esperamos!`,
      url: '/mis-citas',
      tag: 'appointment.confirmed',
    });
  }

  @OnEvent('appointment.cancelled')
  async handleAppointmentCancelled(appointment: Appointment): Promise<void> {
    const reason = appointment.cancellationReason
      ? ` Motivo: ${appointment.cancellationReason}`
      : '';
    await this.sendPushToUser(appointment.clientId, {
      title: 'Cita cancelada',
      body: `Tu cita del ${formatUtc(appointment.startTime)} fue cancelada.${reason}`,
      url: '/mis-citas',
      tag: 'appointment.cancelled',
    });
  }

  @OnEvent('appointment.rescheduled')
  async handleAppointmentRescheduled(appointment: Appointment): Promise<void> {
    await this.sendPushToUser(appointment.clientId, {
      title: 'Cita reprogramada',
      body: `Tu cita se movió al ${formatUtc(appointment.startTime)}. Revisa tu agenda en Mis citas.`,
      url: '/mis-citas',
      tag: 'appointment.rescheduled',
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async sendRemindersForNext24h(): Promise<number> {
    const now = new Date();
    const limit = new Date(now.getTime() + REMINDER_WINDOW_MS);
    const upcoming = await this.appointmentRepository.find({
      where: {
        status: In([AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED]),
      },
    });
    const due = upcoming.filter((a) => {
      if (
        a.status !== AppointmentStatus.PENDING &&
        a.status !== AppointmentStatus.CONFIRMED
      ) {
        return false;
      }
      const start = new Date(a.startTime).getTime();
      return start > now.getTime() && start <= limit.getTime();
    });
    for (const appointment of due) {
      await this.sendPushToUser(appointment.clientId, {
        title: 'Recordatorio: tu cita es mañana',
        body: `Recuerda tu cita de ${appointment.service?.name ?? 'spa'} el ${formatUtc(appointment.startTime)}.`,
        url: '/mis-citas',
        tag: 'appointment.reminder',
      });
    }
    if (due.length > 0) {
      this.logger.log(`Recordatorios enviados para ${due.length} citas próximas.`);
    }
    return due.length;
  }

  private record(entry: Omit<SentRecord, 'sentAt'>): void {
    this.outbox.push({ ...entry, sentAt: new Date().toISOString() });
    if (this.outbox.length > 200) {
      this.outbox.splice(0, this.outbox.length - 200);
    }
  }
}
