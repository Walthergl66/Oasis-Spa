import { PartialType } from '@nestjs/mapped-types';
import { CreateSpaDto } from './create-spa.dto';

export class UpdateSpaDto extends PartialType(CreateSpaDto) {}
