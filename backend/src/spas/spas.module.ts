import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { SpasService } from './spas.service';
import { SpasController } from './spas.controller';
import { Spa } from './entities/spa.entity';
import { SpaImage } from './entities/spa-image.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Spa, SpaImage, User]), AuthModule],
  controllers: [SpasController],
  providers: [SpasService],
  exports: [SpasService],
})
export class SpasModule {}
