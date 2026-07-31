import { Controller, Get } from '@nestjs/common';
import { Public } from '../auth/decorators/public.decorator';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/categories
   *
   * Pública: la clienta filtra el catálogo por categoría antes de tener cuenta.
   * Devuelve sólo los nombres, que es lo que consumen los filtros de la interfaz.
   */
  @Public()
  @Get()
  async findAll(): Promise<string[]> {
    const categories = await this.categoriesService.findAll();
    return categories.map((category) => category.name);
  }
}
