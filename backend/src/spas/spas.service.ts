import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { CreateSpaDto } from './dto/create-spa.dto';
import { UpdateSpaDto } from './dto/update-spa.dto';
import { Spa } from './entities/spa.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class SpasService extends BaseCrudService<Spa> {
  constructor(
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super(spasRepository, 'Spa');
  }

  async create(createSpaDto: CreateSpaDto) {
    await this.ensureOwnerExists(createSpaDto.ownerId);
    return super.create(createSpaDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['owner', 'images', 'services', 'employees'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['owner', 'images', 'services', 'employees', 'reviews'],
    });
  }

  async update(id: string, updateSpaDto: UpdateSpaDto) {
    if (updateSpaDto.ownerId) {
      await this.ensureOwnerExists(updateSpaDto.ownerId);
    }

    return super.update(id, updateSpaDto);
  }

  private async ensureOwnerExists(ownerId: string): Promise<void> {
    await this.ensureExists(this.usersRepository, ownerId, 'Owner');
  }
}
