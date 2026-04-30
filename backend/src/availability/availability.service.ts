import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { Employee } from '../employees/entities/employee.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { Availability } from './entities/availability.entity';

@Injectable()
export class AvailabilityService extends BaseCrudService<Availability> {
  constructor(
    @InjectRepository(Availability)
    private readonly availabilityRepository: Repository<Availability>,
    @InjectRepository(Employee)
    private readonly employeesRepository: Repository<Employee>,
  ) {
    super(availabilityRepository, 'Availability');
  }

  async create(createAvailabilityDto: CreateAvailabilityDto) {
    await this.ensureExists(
      this.employeesRepository,
      createAvailabilityDto.employeeId,
      'Employee',
    );

    return super.create(createAvailabilityDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['employee'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['employee'],
    });
  }

  async update(id: string, updateAvailabilityDto: UpdateAvailabilityDto) {
    if (updateAvailabilityDto.employeeId) {
      await this.ensureExists(
        this.employeesRepository,
        updateAvailabilityDto.employeeId,
        'Employee',
      );
    }

    return super.update(id, updateAvailabilityDto);
  }
}
