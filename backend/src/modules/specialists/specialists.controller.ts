import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { SpecialistsService } from './specialists.service';
import { CreateSpecialistDto } from './dto/create-specialist.dto';
import { UpdateSpecialistDto } from './dto/update-specialist.dto';

/** Pendiente de implementar: oculto en la documentación. */
@ApiExcludeController()
@Controller('specialists')
export class SpecialistsController {
  constructor(private readonly specialistsService: SpecialistsService) {}

  @Post()
  create(@Body() createSpecialistDto: CreateSpecialistDto) {
    return this.specialistsService.create(createSpecialistDto);
  }

  @Get()
  findAll() {
    return this.specialistsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.specialistsService.findOne(+id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateSpecialistDto: UpdateSpecialistDto,
  ) {
    return this.specialistsService.update(+id, updateSpecialistDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specialistsService.remove(+id);
  }
}
