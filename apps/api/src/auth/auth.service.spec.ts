import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('AuthService', () => {
  let service: AuthService;
  const mockUsersService = {
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateSelfProfile: jest.fn(),
  };
  const mockJwtService = { sign: jest.fn(), verify: jest.fn() };
  const mockConfigService = { get: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();
    service = module.get(AuthService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('validateUser', () => {
    it('should return null if user not found', async () => {
      mockUsersService.findOne.mockResolvedValue(null);
      await expect(service.validateUser('test', 'pass')).resolves.toBeNull();
    });
  });

  describe('login', () => {
    it('should return token', async () => {
      mockUsersService.findOne.mockResolvedValue({ id: '1', username: 'u' });
      mockJwtService.sign.mockReturnValue('token');
      mockConfigService.get.mockReturnValue('secret');
      const result = await service.login({ id: '1', username: 'u' } as any);
      expect(result).toHaveProperty('access_token');
    });
  });

  describe('refreshToken', () => {
    it('should reject stale token', async () => {
      mockJwtService.verify.mockReturnValue({ sub: '1', authVersion: 1 });
      mockUsersService.findById.mockResolvedValue({
        id: '1',
        username: 'u',
        role: 'SISWA',
        authVersion: 2,
      });
      mockConfigService.get.mockReturnValue('secret');
      await expect(service.refreshToken('rt')).rejects.toThrow(
        'Invalid refresh token',
      );
    });
  });
});
