import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { Spa } from '../spas/entities/spa.entity';
import { ServiceCategory } from './entities/service-category.entity';
import { Service } from './entities/service.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, ServiceCategory, Spa]),
    AuthModule,
  ],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService],
})
export class ServicesModule {}
