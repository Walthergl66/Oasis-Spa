import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { isForeignKeyViolation } from '../../common/database-errors';
import { CategoriesService } from '../categories/categories.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Service } from './entities/service.entity';

/**
 * Forma en la que el catálogo sale hacia el frontend.
 *
 * La categoría se aplana a su nombre y `imageUrl` se expone como `image`
 * porque es el contrato que las vistas ya consumen. Traducir aquí evita tocar
 * componentes al conectar la API.
 */
export interface ServiceResponse {
  id: string;
  name: string;
  category: string;
  description: string;
  durationMin: number;
  price: number;
  image: string;
  popular: boolean;
  rating: number;
  reviewsCount: number;
  active: boolean;
}

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly repository: Repository<Service>,
    private readonly categories: CategoriesService,
  ) {}

  static toResponse(service: Service): ServiceResponse {
    return {
      id: service.id,
      name: service.name,
      category: service.category?.name ?? '',
      description: service.description,
      durationMin: service.durationMin,
      price: service.price,
      image: service.imageUrl,
      popular: service.popular,
      rating: service.rating,
      reviewsCount: service.reviewsCount,
      active: service.active,
    };
  }

  /** Entidad completa (con su categoría). La usan citas y promociones. */
  async getEntity(id: string): Promise<Service> {
    const service = await this.repository.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!service) throw new NotFoundException('El servicio no existe.');
    return service;
  }

  async findAll(
    options: { includeInactive?: boolean; category?: string } = {},
  ): Promise<ServiceResponse[]> {
    const query = this.repository
      .createQueryBuilder('service')
      .innerJoinAndSelect('service.category', 'category')
      .orderBy('service.name', 'ASC');

    if (!options.includeInactive) {
      query.andWhere('service.active = true');
    }
    if (options.category) {
      query.andWhere('LOWER(category.name) = LOWER(:category)', {
        category: options.category,
      });
    }

    const services = await query.getMany();
    return services.map((service) => ServicesService.toResponse(service));
  }

  async findOne(id: string): Promise<ServiceResponse> {
    return ServicesService.toResponse(await this.getEntity(id));
  }

  async create(dto: CreateServiceDto): Promise<ServiceResponse> {
    const category = await this.categories.getByName(dto.category);

    const service = this.repository.create({
      name: dto.name.trim(),
      description: dto.description?.trim() ?? '',
      category,
      categoryId: category.id,
      durationMin: dto.durationMin,
      price: dto.price,
      imageUrl: dto.image ?? '',
      popular: dto.popular ?? false,
      active: dto.active ?? true,
    });

    return ServicesService.toResponse(await this.repository.save(service));
  }

  async update(id: string, dto: UpdateServiceDto): Promise<ServiceResponse> {
    const service = await this.getEntity(id);

    if (dto.category) {
      const category = await this.categories.getByName(dto.category);
      service.category = category;
      service.categoryId = category.id;
    }
    if (dto.name !== undefined) service.name = dto.name.trim();
    if (dto.description !== undefined)
      service.description = dto.description.trim();
    if (dto.durationMin !== undefined) service.durationMin = dto.durationMin;
    if (dto.price !== undefined) service.price = dto.price;
    if (dto.image !== undefined) service.imageUrl = dto.image;
    if (dto.popular !== undefined) service.popular = dto.popular;
    if (dto.active !== undefined) service.active = dto.active;

    return ServicesService.toResponse(await this.repository.save(service));
  }

  /**
   * Baja del catálogo.
   *
   * Un servicio con citas registradas no puede borrarse: rompería el historial
   * y los reportes. En lugar de contar citas —lo que obligaría a este módulo a
   * leer la tabla de otro— se intenta el borrado y se deja que decida la clave
   * foránea `RESTRICT` de la base. Si la integridad lo impide, se desactiva.
   *
   * Así la regla vive en un solo sitio (el esquema) y no puede quedar
   * desincronizada con una consulta escrita aquí.
   */
  async remove(
    id: string,
  ): Promise<{ deleted: boolean; deactivated: boolean }> {
    const service = await this.getEntity(id);

    try {
      await this.repository.remove(service);
      return { deleted: true, deactivated: false };
    } catch (error) {
      if (!isForeignKeyViolation(error)) throw error;

      // `remove` vacía el id de la entidad en memoria; se recarga para guardar.
      const vigente = await this.getEntity(id);
      vigente.active = false;
      await this.repository.save(vigente);
      return { deleted: false, deactivated: true };
    }
  }
}
