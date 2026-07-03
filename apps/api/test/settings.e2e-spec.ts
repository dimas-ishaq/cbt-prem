import { Test, TestingModule } from '@nestjs/testing';
import {
  INestApplication,
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import request from 'supertest';
import { SettingsController } from '../src/settings/settings.controller';
import { SettingsService } from '../src/settings/settings.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

@Injectable()
class AllowAllGuard implements CanActivate {
  canActivate(_context: ExecutionContext): boolean {
    return true;
  }
}

describe('SettingsController (e2e)', () => {
  let app: INestApplication;
  const settingsServiceMock = {
    getAll: jest.fn(),
    updateMany: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: settingsServiceMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(AllowAllGuard)
      .overrideGuard(RolesGuard)
      .useClass(AllowAllGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    jest.clearAllMocks();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /settings/public excludes redis secrets', async () => {
    settingsServiceMock.getAll.mockResolvedValue({
      appName: 'CBT',
      redisHost: '127.0.0.1',
      redisPort: '6379',
      redisPassword: 'secret',
      redisEnabled: 'true',
    });

    const res = await request(app.getHttpServer())
      .get('/settings/public')
      .expect(200);
    expect(res.body).toEqual({ appName: 'CBT' });
  });

  it('POST /settings delegates update', async () => {
    settingsServiceMock.updateMany.mockResolvedValue({ success: true });

    const res = await request(app.getHttpServer())
      .post('/settings')
      .send({ appName: 'New CBT' })
      .expect(201);

    expect(res.body).toEqual({ success: true });
    expect(settingsServiceMock.updateMany).toHaveBeenCalledWith({
      appName: 'New CBT',
    });
  });
});
