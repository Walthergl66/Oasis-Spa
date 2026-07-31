import { PartialType } from '@nestjs/mapped-types';
import { CreateServiceDto } from './create-service.dto';

/** Todos los campos del alta, opcionales. */
export class UpdateServiceDto extends PartialType(CreateServiceDto) {}
