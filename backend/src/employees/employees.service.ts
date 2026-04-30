import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { Employee } from './entities/employee.entity';

@Injectable()
export class EmployeesService extends BaseCrudService<Employee> {
  constructor(
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Spa)
    private readonly spasRepository: Repository<Spa>,
  ) {
    super(employeesRepository, 'Employee');
  }

  async create(createEmployeeDto: CreateEmployeeDto) {
    await Promise.all([
      this.ensureExists(this.usersRepository, createEmployeeDto.userId, 'User'),
      this.ensureExists(this.spasRepository, createEmployeeDto.spaId, 'Spa'),
    ]);

    return super.create(createEmployeeDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['user', 'spa', 'availabilities'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['user', 'spa', 'availabilities', 'appointments'],
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    if (updateEmployeeDto.userId) {
      await this.ensureExists(this.usersRepository, updateEmployeeDto.userId, 'User');
    }

    if (updateEmployeeDto.spaId) {
      await this.ensureExists(this.spasRepository, updateEmployeeDto.spaId, 'Spa');
    }

    return super.update(id, updateEmployeeDto);
  }
}
