import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security headers / CORS (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('does not allow unknown origin when CORS_ORIGIN set', async () => {
    process.env.CORS_ORIGIN = 'http://allowed.local';
    const res = await request(app.getHttpServer())
      .options('/api/auth/login')
      .set('Origin', 'http://evil.local')
      .set('Access-Control-Request-Method', 'POST');

    expect(res.headers['access-control-allow-origin']).not.toBe(
      'http://evil.local',
    );
  });
});
