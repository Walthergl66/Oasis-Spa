import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ServicesService } from './services.service.js';

describe('ServicesService', () => {
  let service: ServicesService;
  let mockRepository: any;

  beforeEach(() => {
    mockRepository = {
      findOne: vi.fn(),
      create: vi.fn(),
      save: vi.fn(),
      createQueryBuilder: vi.fn(),
      remove: vi.fn(),
    };

    service = new ServicesService(mockRepository);
  });

  it('should create a service successfully when name is unique', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    mockRepository.create.mockReturnValue({
      name: 'Limpieza Facial Profunda',
      durationMinutes: 60,
      price: 45,
      category: 'Facial',
    });
    mockRepository.save.mockResolvedValue({
      id: 'uuid-1',
      name: 'Limpieza Facial Profunda',
      durationMinutes: 60,
      price: 45,
      category: 'Facial',
      isActive: true,
    });

    const result = await service.create({
      name: 'Limpieza Facial Profunda',
      durationMinutes: 60,
      price: 45,
      category: 'Facial',
    });

    expect(result.id).toBe('uuid-1');
    expect(result.name).toBe('Limpieza Facial Profunda');
  });

  it('should throw ConflictException if service name already exists', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 'existing-id',
      name: 'Masaje Sueco',
    });

    await expect(
      service.create({
        name: 'Masaje Sueco',
        durationMinutes: 50,
        price: 40,
      }),
    ).rejects.toThrow('Ya existe un servicio');
  });
});
