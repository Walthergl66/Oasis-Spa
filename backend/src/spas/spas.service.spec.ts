import { Test, TestingModule } from '@nestjs/testing';
import { SpasService } from './spas.service';

describe('SpasService', () => {
  let service: SpasService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpasService],
    }).compile();

    service = module.get<SpasService>(SpasService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
