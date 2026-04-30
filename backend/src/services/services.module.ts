import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Spa } from '../spas/entities/spa.entity';
import { User } from '../users/entities/user.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';
import { ServiceOwnershipGuard } from './guards/service-ownership.guard';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceCategory, Spa, User]),
    AuthModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService, ServiceOwnershipGuard],
  exports: [ServicesService],
})
export class ServicesModule {}
