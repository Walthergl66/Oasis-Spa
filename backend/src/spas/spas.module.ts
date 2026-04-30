import { Module } from '@nestjs/common';
import { SpasService } from './spas.service';
import { SpasController } from './spas.controller';

@Module({
  controllers: [SpasController],
  providers: [SpasService],
})
export class SpasModule {}
