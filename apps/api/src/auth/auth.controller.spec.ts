import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

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

  it('should refresh token', async () => {
    authServiceMock.refreshToken.mockResolvedValue({ access_token: 'new-token' });
    const result = await controller.refresh('rt');
    expect(result).toEqual({ access_token: 'new-token' });
  });

  it('should return profile', async () => {
    const result = controller.getProfile({ user: { id: '1' } });
    expect(result).toEqual({ id: '1' });
  });
});