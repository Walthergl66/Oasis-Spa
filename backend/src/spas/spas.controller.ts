import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SpasService } from './spas.service';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';

@ApiTags('Spas')
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
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.spasService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSpaDto: UpdateSpaDto,
  ) {
    return this.spasService.update(id, updateSpaDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.spasService.remove(id);
  }
}
