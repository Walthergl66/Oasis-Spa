import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './entities/category.entity';

/**
 * Categorías del catálogo.
 *
 * Es el módulo base del que dependen servicios y especialistas: una categoría
 * agrupa servicios y, a la vez, define qué puede atender cada especialista.
 */
@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly repository: Repository<Category>,
  ) {}

  findAll(includeInactive = false): Promise<Category[]> {
    return this.repository.find({
      where: includeInactive ? {} : { active: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Resuelve una categoría por su nombre.
   *
   * El frontend trabaja con el nombre ("Uñas"), no con el uuid, así que la API
   * acepta el nombre y aquí se traduce a la entidad. La búsqueda ignora
   * mayúsculas para que "uñas" y "Uñas" no creen ambigüedad.
   */
  async getByName(name: string): Promise<Category> {
    const category = await this.repository
      .createQueryBuilder('category')
      .where('LOWER(category.name) = LOWER(:name)', { name: name.trim() })
      .getOne();

    if (!category) {
      const disponibles = (await this.findAll()).map((c) => c.name).join(', ');
      throw new BadRequestException(
        `La categoría "${name}" no existe. Disponibles: ${disponibles}.`,
      );
    }
    return category;
  }
}
