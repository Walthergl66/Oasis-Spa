import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateEmployeeDto } from './create-employee.dto.js';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class UpdateEmployeeDto extends PartialType(CreateEmployeeDto) {
  @ApiPropertyOptional({
    example: ['123e4567-e89b-12d3-a456-426614174001'],
    description: 'Actualizar lista de servicios asociados',
  })
  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  serviceIds?: string[];
}
