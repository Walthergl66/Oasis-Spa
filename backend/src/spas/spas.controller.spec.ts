import { Test, TestingModule } from '@nestjs/testing';
import { SpasController } from './spas.controller';
import { SpasService } from './spas.service';

describe('SpasController', () => {
  let controller: SpasController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpasController],
      providers: [SpasService],
    }).compile();

    controller = module.get<SpasController>(SpasController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
