import { PartialType } from '@nestjs/mapped-types';
import { CreateAppointmentPublicDto } from './create-appointment-public.dto';

export class UpdateAppointmentPublicDto extends PartialType(
  CreateAppointmentPublicDto,
) {}

