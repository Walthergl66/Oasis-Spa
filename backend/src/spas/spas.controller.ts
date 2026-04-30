import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { SpasService } from './spas.service';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';

@Controller('spas')
export class SpasController {
  constructor(private readonly spasService: SpasService) {}

  @Post()
  create(@Body() createSpaDto: CreateSpaDto) {
    return this.spasService.create(createSpaDto);
  }

  @Get()
  findAll() {
    return this.spasService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.spasService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateSpaDto: UpdateSpaDto) {
    return this.spasService.update(+id, updateSpaDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.spasService.remove(+id);
  }
}
