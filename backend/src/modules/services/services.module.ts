import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceEntity } from './entities/service.entity.js';
import { ServicesService } from './services.service.js';
import { ServicesController } from './services.controller.js';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceEntity])],
  controllers: [ServicesController],
  providers: [ServicesService],
  exports: [ServicesService, TypeOrmModule],
})
export class ServicesModule {}
