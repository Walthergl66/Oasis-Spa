import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Spa } from '../spas/entities/spa.entity';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';

@Injectable()
export class ServicesService extends BaseCrudService<Service> {
  constructor(
    @InjectRepository(Service)
    private readonly servicesRepository: Repository<Service>,
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
    @InjectRepository(ServiceCategory)
    private readonly serviceCategoriesRepository: Repository<ServiceCategory>,
  ) {
    super(servicesRepository, 'Service');
  }

  async create(createServiceDto: CreateServiceDto) {
    await this.ensureExists(this.spasRepository, createServiceDto.spaId, 'Spa');

    if (createServiceDto.categoryId) {
      await this.ensureExists(
        this.serviceCategoriesRepository,
        createServiceDto.categoryId,
        'Service category',
      );
    }

    return super.create(createServiceDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['spa', 'category'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['spa', 'category'],
    });
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    if (updateServiceDto.spaId) {
      await this.ensureExists(this.spasRepository, updateServiceDto.spaId, 'Spa');
    }

    if (updateServiceDto.categoryId) {
      await this.ensureExists(
        this.serviceCategoriesRepository,
        updateServiceDto.categoryId,
        'Service category',
      );
    }

    return super.update(id, updateServiceDto);
  }
}
