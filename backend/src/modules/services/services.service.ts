import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceEntity } from './entities/service.entity.js';
import { CreateServiceDto } from './dto/create-service.dto.js';
import { UpdateServiceDto } from './dto/update-service.dto.js';
import { ServiceFilterDto } from './dto/service-filter.dto.js';

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(ServiceEntity)
    private readonly serviceRepository: Repository<ServiceEntity>,
  ) {}

  async create(createServiceDto: CreateServiceDto): Promise<ServiceEntity> {
    const existing = await this.serviceRepository.findOne({
      where: { name: createServiceDto.name.trim() },
    });
    if (existing) {
      throw new ConflictException(
        `Ya existe un servicio registrado con el nombre "${createServiceDto.name}"`,
      );
    }

    const service = this.serviceRepository.create({
      ...createServiceDto,
      name: createServiceDto.name.trim(),
    });

    return this.serviceRepository.save(service);
  }

  async findAll(filter?: ServiceFilterDto): Promise<ServiceEntity[]> {
    const query = this.serviceRepository.createQueryBuilder('service');

    if (filter?.category) {
      query.andWhere('LOWER(service.category) = LOWER(:category)', {
        category: filter.category,
      });
    }

    if (filter?.isActive !== undefined) {
      query.andWhere('service.isActive = :isActive', {
        isActive: filter.isActive,
      });
    }

    if (filter?.search) {
      query.andWhere(
        '(LOWER(service.name) LIKE LOWER(:search) OR LOWER(service.description) LIKE LOWER(:search))',
        { search: `%${filter.search}%` },
      );
    }

    query.orderBy('service.category', 'ASC').addOrderBy('service.name', 'ASC');

    return query.getMany();
  }

  async findAllActive(category?: string): Promise<ServiceEntity[]> {
    return this.findAll({ isActive: true, category });
  }

  async findById(id: string): Promise<ServiceEntity> {
    const service = await this.serviceRepository.findOne({ where: { id } });
    if (!service) {
      throw new NotFoundException(`Servicio con ID ${id} no encontrado`);
    }
    return service;
  }

  async update(
    id: string,
    updateServiceDto: UpdateServiceDto,
  ): Promise<ServiceEntity> {
    const service = await this.findById(id);

    if (updateServiceDto.name && updateServiceDto.name.trim() !== service.name) {
      const duplicate = await this.serviceRepository.findOne({
        where: { name: updateServiceDto.name.trim() },
      });
      if (duplicate && duplicate.id !== id) {
        throw new ConflictException(
          `Ya existe otro servicio registrado con el nombre "${updateServiceDto.name}"`,
        );
      }
    }

    Object.assign(service, updateServiceDto);
    return this.serviceRepository.save(service);
  }

  async toggleStatus(id: string, isActive: boolean): Promise<ServiceEntity> {
    const service = await this.findById(id);
    service.isActive = isActive;
    return this.serviceRepository.save(service);
  }

  async remove(id: string): Promise<{ message: string }> {
    const service = await this.findById(id);
    await this.serviceRepository.remove(service);
    return { message: `Servicio "${service.name}" eliminado correctamente` };
  }
}
