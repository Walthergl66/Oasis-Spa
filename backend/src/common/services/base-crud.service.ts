import { Injectable, NotFoundException } from '@nestjs/common';
import { DeepPartial, FindManyOptions, FindOneOptions, Repository } from 'typeorm';

@Injectable()
export class BaseCrudService<T extends { id: string }> {
  constructor(
    protected readonly repository: Repository<T>,
    protected readonly entityName: string,
  ) {}

  async create(data: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(data);
    return this.repository.save(entity);
  }

  async findAll(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  async findOneOrFail(id: string, options?: FindOneOptions<T>): Promise<T> {
    const entity = await this.repository.findOne({
      where: { id } as FindOneOptions<T>['where'],
      ...options,
    });

    if (!entity) {
      throw new NotFoundException(`${this.entityName} not found`);
    }

    return entity;
  }

  async update(id: string, data: DeepPartial<T>): Promise<T> {
    const entity = await this.findOneOrFail(id);
    const merged = this.repository.merge(entity, data);
    return this.repository.save(merged);
  }

  protected async ensureExists<Entity extends { id: string }>(
    repository: Repository<Entity>,
    id: string,
    entityName: string,
  ): Promise<void> {
    const exists = await repository.existsBy({ id } as never);

    if (!exists) {
      throw new NotFoundException(`${entityName} not found`);
    }
  }

  async remove(id: string): Promise<{ message: string }> {
    const entity = await this.findOneOrFail(id);
    await this.repository.remove(entity);
    return { message: `${this.entityName} deleted successfully` };
  }
}
