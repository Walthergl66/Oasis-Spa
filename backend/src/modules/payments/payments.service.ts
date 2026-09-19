import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment, PaymentStatus } from './entities/payment.entity.js';
import { PaymentFilterDto, RegisterPaymentDto } from './dto/payment.dto.js';
import { AppointmentsService } from '../appointments/appointments.service.js';
import { AppointmentStatus } from '../appointments/enums/appointment-status.enum.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly appointmentsService: AppointmentsService,
  ) {}

  async register(receivedById: string, dto: RegisterPaymentDto): Promise<Payment> {
    if (dto.amount <= 0) {
      throw new BadRequestException('El monto del anticipo debe ser mayor a 0');
    }
    const appointment = await this.appointmentsService.findById(dto.appointmentId);
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se puede registrar anticipo en una cita cancelada');
    }
    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede registrar anticipo en una cita ya completada');
    }

    const existing = await this.paymentRepository.findOne({
      where: { appointmentId: dto.appointmentId, status: PaymentStatus.REGISTRADO },
    });
    if (existing) {
      throw new ConflictException('Esta cita ya tiene un anticipo registrado. Anúlelo antes de registrar otro.');
    }

    const payment = this.paymentRepository.create({
      appointmentId: dto.appointmentId,
      amount: dto.amount,
      method: dto.method,
      notes: dto.notes || null,
      receivedById,
      status: PaymentStatus.REGISTRADO,
    });
    return this.paymentRepository.save(payment);
  }

  async findAll(filter?: PaymentFilterDto): Promise<Payment[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.appointment', 'appointment')
      .leftJoinAndSelect('payment.receivedBy', 'receivedBy');

    if (filter?.status) {
      query.andWhere('payment.status = :status', { status: filter.status });
    }
    if (filter?.appointmentId) {
      query.andWhere('payment.appointmentId = :appointmentId', {
        appointmentId: filter.appointmentId,
      });
    }
    return query.orderBy('payment.createdAt', 'DESC').getMany();
  }

  async findByAppointment(appointmentId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { appointmentId },
      relations: { receivedBy: true },
      order: { createdAt: 'DESC' },
    });
  }

  async annul(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({ where: { id } });
    if (!payment) {
      throw new NotFoundException(`Anticipo ${id} no encontrado`);
    }
    if (payment.status === PaymentStatus.ANULADO) {
      throw new BadRequestException('Este anticipo ya fue anulado');
    }
    payment.status = PaymentStatus.ANULADO;
    return this.paymentRepository.save(payment);
  }
}
