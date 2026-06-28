import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CanActivate, ExecutionContext, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
class AllowAllGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('AuthController', () => {
  let controller: AuthController;
  const authServiceMock = {
    validateUser: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    updateProfile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }],
    })
      .overrideGuard(ThrottlerGuard)
      .useClass(AllowAllGuard)
      .overrideGuard(JwtAuthGuard)
      .useClass(AllowAllGuard)
      .compile();

    controller = module.get<AuthController>(AuthController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should login with valid credentials', async () => {
    authServiceMock.validateUser.mockResolvedValue({ id: '1', username: 'demo' });
    authServiceMock.login.mockResolvedValue({ access_token: 'token' });

    const result = await controller.login({ username: 'demo', password: 'pass' });
    expect(result).toEqual({ access_token: 'token' });
  });

  it('should reject login with wrong credentials', async () => {
    authServiceMock.validateUser.mockResolvedValue(null);
    await expect(controller.login({ username: 'demo', password: 'wrong' })).rejects.toThrow('Invalid credentials');
  });

  it('should refresh token', async () => {
    authServiceMock.refreshToken.mockResolvedValue({ access_token: 'new-token' });
    const result = await controller.refresh('rt');
    expect(result).toEqual({ access_token: 'new-token' });
  });

  it('should return profile', async () => {
    const result = controller.getProfile({ user: { id: '1' } });
    expect(result).toEqual({ id: '1' });
  });

  describe('uploadPhoto', () => {
    const req = { user: { userId: 'u1' } };

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should reject when no file', async () => {
      await expect(controller.uploadPhoto(req, null as any)).rejects.toThrow(BadRequestException);
    });

    it('should reject invalid mimetype', async () => {
      const file = { mimetype: 'text/html', size: 1024, originalname: 'evil.html', buffer: Buffer.from('<html>') } as any;
      await expect(controller.uploadPhoto(req, file)).rejects.toThrow('format');
    });

    it('should reject oversize file', async () => {
      const file = { mimetype: 'image/jpeg', size: 3 * 1024 * 1024, originalname: 'big.jpg', buffer: Buffer.alloc(3_000_000) } as any;
      await expect(controller.uploadPhoto(req, file)).rejects.toThrow('Ukuran foto maksimal');
    });

    it('should reject invalid extension', async () => {
      const file = { mimetype: 'image/jpeg', size: 1024, originalname: 'evil.exe', buffer: Buffer.from([0xff, 0xd8, 0xff]) } as any;
      await expect(controller.uploadPhoto(req, file)).rejects.toThrow('Ekstensi file foto tidak valid');
    });

    it('should accept valid photo and return url', async () => {
      jest.spyOn(require('fs'), 'existsSync').mockReturnValue(true);
      jest.spyOn(require('fs'), 'writeFileSync').mockReturnValue(undefined);
      authServiceMock.updateProfile.mockResolvedValue({});

      const file = {
        mimetype: 'image/jpeg',
        size: 1024,
        originalname: 'photo.jpg',
        buffer: Buffer.from([0xff, 0xd8, 0xff]),
      } as any;

      const result = await controller.uploadPhoto(req, file);
      expect(result).toHaveProperty('photoUrl');
      expect(result.photoUrl).toMatch(/^\/uploads\/photos\//);
    });
  });
});