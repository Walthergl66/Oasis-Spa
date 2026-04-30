import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SpasService } from './spas.service';
import { SpasController } from './spas.controller';
import { Spa } from './entities/spa.entity';
import { SpaImage } from './entities/spa-image.entity';
import { User } from '../users/entities/user.entity';
import { SpaOwnershipGuard } from './guards/spa-ownership.guard';

@Module({
  imports: [TypeOrmModule.forFeature([Spa, SpaImage, User]), AuthModule],
  controllers: [SpasController],
  providers: [SpasService, SpaOwnershipGuard],
  exports: [SpasService],
})
export class SpasModule {}
