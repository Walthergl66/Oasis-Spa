import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import { Role } from '../../common/enums/role.enum.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto, passwordHash: string): Promise<User> {
    const existing = await this.userRepository.findOne({
      where: { email: createUserDto.email.toLowerCase().trim() },
    });

    if (existing) {
      throw new ConflictException('Ya existe un usuario registrado con este correo electrónico');
    }

    const user = this.userRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase().trim(),
      passwordHash,
      role: createUserDto.role || Role.CLIENT,
    });

    return this.userRepository.save(user);
  }

  async findAll(role?: Role): Promise<User[]> {
    const query = this.userRepository.createQueryBuilder('user');
    if (role) {
      query.where('user.role = :role', { role });
    }
    query.orderBy('user.createdAt', 'DESC');
    return query.getMany();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async updateProfile(id: string, updateDto: UpdateProfileDto): Promise<User> {
    const user = await this.findById(id);

    if (updateDto.firstName !== undefined) user.firstName = updateDto.firstName;
    if (updateDto.lastName !== undefined) user.lastName = updateDto.lastName;
    if (updateDto.phone !== undefined) user.phone = updateDto.phone;

    return this.userRepository.save(user);
  }

  async updateRefreshToken(id: string, refreshTokenHash: string | null): Promise<void> {
    await this.userRepository.update(id, { refreshTokenHash });
  }

  async updateRole(id: string, role: Role): Promise<User> {
    const user = await this.findById(id);
    user.role = role;
    return this.userRepository.save(user);
  }

  async toggleActive(id: string, isActive: boolean): Promise<User> {
    const user = await this.findById(id);
    user.isActive = isActive;
    return this.userRepository.save(user);
  }

  async count(): Promise<number> {
    return this.userRepository.count();
  }
}
