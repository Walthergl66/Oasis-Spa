import { Injectable } from '@nestjs/common';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';

@Injectable()
export class SpasService {
  create(createSpaDto: CreateSpaDto) {
    return 'This action adds a new spa';
  }

  findAll() {
    return `This action returns all spas`;
  }

  findOne(id: number) {
    return `This action returns a #${id} spa`;
  }

  update(id: number, updateSpaDto: UpdateSpaDto) {
    return `This action updates a #${id} spa`;
  }

  remove(id: number) {
    return `This action removes a #${id} spa`;
  }
}
