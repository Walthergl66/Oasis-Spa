import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseCrudService } from '../common/services/base-crud.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService extends BaseCrudService<User> {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {
    super(usersRepository, 'User');
  }

  async create(createUserDto: CreateUserDto) {
    const existingUser = await this.usersRepository.findOne({
      where: { id: createUserDto.id },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    return super.create(createUserDto);
  }

  async findAll() {
    return super.findAll({
      relations: ['ownedSpas', 'employeeProfiles', 'favorites'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    return this.findOneOrFail(id, {
      relations: ['ownedSpas', 'employeeProfiles', 'notifications', 'favorites'],
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    return super.update(id, updateUserDto);
  }
}
