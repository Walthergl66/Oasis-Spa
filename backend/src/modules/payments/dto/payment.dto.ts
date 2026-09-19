import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod, PaymentStatus } from '../entities/payment.entity.js';

export class RegisterPaymentDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174010', description: 'Cita que respalda el anticipo' })
  @IsUUID('4', { message: 'El appointmentId debe ser un UUID válido' })
  @IsNotEmpty()
  appointmentId: string;

  @ApiProperty({ example: 20, description: 'Monto del anticipo (mayor a 0)' })
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'El monto debe ser numérico con 2 decimales máximo' })
  @IsPositive({ message: 'El monto debe ser mayor a 0' })
  amount: number;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.EFECTIVO })
  @IsEnum(PaymentMethod)
  method: PaymentMethod;

  @ApiPropertyOptional({ example: 'Anticipo del 40% en efectivo.' })
  @IsString()
  @IsOptional()
  @MaxLength(300)
  notes?: string;
}

export class PaymentFilterDto {
  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ description: 'Filtrar por cita' })
  @IsUUID('4')
  @IsOptional()
  appointmentId?: string;
}
