import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { Employee } from '../employees/entities/employee.entity';
import { Favorite } from './entities/favorite.entity';
import { User } from './entities/user.entity';
import { AuthModule } from '../auth/auth.module';
import { SelfOrAdminGuard } from './guards/self-or-admin.guard';

@Module({
  imports: [TypeOrmModule.forFeature([User, Employee, Favorite]), AuthModule],
  controllers: [UsersController],
  providers: [UsersService, SelfOrAdminGuard],
  exports: [UsersService],
})
export class UsersModule {}
