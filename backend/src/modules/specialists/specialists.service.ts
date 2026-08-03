import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Specialist, SpecialistStatus } from './entities/specialist.entity';

export interface SpecialistResponse {
  id: string;
  name: string;
  role: string;
  initials: string;
  rating: number;
  status: SpecialistStatus;
  categories: string[];
  active: boolean;
}

@Injectable()
export class SpecialistsService {
  constructor(
    @InjectRepository(Specialist)
    private readonly repository: Repository<Specialist>,
  ) {}

  static toResponse(specialist: Specialist): SpecialistResponse {
    return {
      id: specialist.id,
      name: specialist.name,
      role: specialist.role,
      initials: specialist.initials,
      rating: specialist.rating,
      status: specialist.status,
      categories: (specialist.categories ?? []).map((c) => c.name),
      active: specialist.active,
    };
  }

  async findAll(includeInactive = false): Promise<SpecialistResponse[]> {
    const specialists = await this.repository.find({
      where: includeInactive ? {} : { active: true },
      relations: { categories: true },
      order: { name: 'ASC' },
    });
    return specialists.map((s) => SpecialistsService.toResponse(s));
  }

  async getEntity(id: string): Promise<Specialist> {
    const specialist = await this.repository.findOne({
      where: { id },
      relations: { categories: true },
    });
    if (!specialist) throw new NotFoundException('La especialista no existe.');
    return specialist;
  }

  /**
   * Especialistas que pueden atender una categoría de servicio.
   *
   * Se excluye a quien está en `Descanso`: no es que esté ocupada en ese
   * momento, es que ese día no atiende, así que ninguna de sus franjas debe
   * ofrecerse.
   */
  findAvailableForCategory(categoryId: string): Promise<Specialist[]> {
    return this.repository
      .createQueryBuilder('specialist')
      .innerJoin('specialist.categories', 'category')
      .where('specialist.active = true')
      .andWhere('specialist.status != :descanso', {
        descanso: SpecialistStatus.DESCANSO,
      })
      .andWhere('category.id = :categoryId', { categoryId })
      .orderBy('specialist.name', 'ASC')
      .getMany();
  }
}
