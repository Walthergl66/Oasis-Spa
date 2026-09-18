import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { Role } from '../../common/enums/role.enum.js';

describe('AuthService', () => {
  let authService: AuthService;
  let mockUsersService: any;
  let mockJwtService: any;
  let mockConfigService: any;

  beforeEach(() => {
    mockUsersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      updateRefreshToken: vi.fn(),
    };

    mockJwtService = {
      signAsync: vi.fn().mockResolvedValue('mock_token'),
    };

    mockConfigService = {
      get: vi.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test_jwt_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_jwt_refresh_secret';
        if (key === 'ADMIN_EMAIL') return 'admin@oasisspa.com';
        return undefined;
      }),
    };

    authService = new AuthService(
      mockUsersService,
      mockJwtService,
      mockConfigService,
    );
  });

  it('should hash and compare passwords correctly using bcrypt', async () => {
    const password = 'SecurePassword123!';
    const hash = await authService.hashData(password);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(password);

    const matches = await authService.compareData(password, hash);
    expect(matches).toBe(true);

    const wrongMatches = await authService.compareData('WrongPass', hash);
    expect(wrongMatches).toBe(false);
  });

  it('should register a new client user', async () => {
    mockUsersService.findByEmail.mockResolvedValue(null);
    mockUsersService.create.mockResolvedValue({
      id: 'uuid-1',
      email: 'cliente@test.com',
      firstName: 'Laura',
      lastName: 'Mendoza',
      role: Role.CLIENT,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await authService.register({
      email: 'cliente@test.com',
      password: 'Password123!',
      firstName: 'Laura',
      lastName: 'Mendoza',
    });

    expect(result.user.email).toBe('cliente@test.com');
    expect(result.tokens.accessToken).toBe('mock_token');
    expect(result.tokens.refreshToken).toBe('mock_token');
  });

  it('should reject login if password is incorrect', async () => {
    const passwordHash = await authService.hashData('CorrectPassword');
    mockUsersService.findByEmail.mockResolvedValue({
      id: 'uuid-1',
      email: 'test@test.com',
      passwordHash,
      isActive: true,
    });

    await expect(
      authService.login({
        email: 'test@test.com',
        password: 'WrongPassword',
      }),
    ).rejects.toThrow('Credenciales incorrectas');
  });
});
