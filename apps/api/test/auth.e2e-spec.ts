import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  const userId = 'cc000000-0000-4000-8000-000000000001';
  const teacherUid = 'cc000000-0000-4000-8000-000000000002';
  const teacherId = 'cc000000-0000-4000-8000-000000000003';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = mod.get(PrismaService);

    await prisma.teacher.deleteMany({ where: { id: teacherId } });
    await prisma.user.deleteMany({ where: { id: teacherUid } });
    await prisma.user.deleteMany({ where: { id: userId } });

    const pw = await bcrypt.hash('password123', 10);
    await prisma.user.create({ data: { id: userId, username: 'auth-siswa@e2e.test', email: 'auth-siswa@e2e.test', password: pw, fullName: 'Auth Siswa', role: 'SISWA' } });
    await prisma.user.create({ data: { id: teacherUid, username: 'auth-guru@e2e.test', email: 'auth-guru@e2e.test', password: pw, fullName: 'Auth Guru', role: 'GURU' } });
    await prisma.teacher.create({ data: { id: teacherId, userId: teacherUid } });
  }, 30000);

  afterAll(async () => { await app.close(); });

  it('login reject unknown user', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'missing@e2e.test', password: 'password123' })
      .expect(401);
  });

  it('login success returns token pair', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'auth-siswa@e2e.test', password: 'password123' })
      .expect(201);

    expect(res.body.access_token).toBeTruthy();
    expect(res.body.refresh_token).toBeTruthy();
    expect(res.body.user.role).toBe('SISWA');
  });

  it('login fail rejects wrong password', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'auth-siswa@e2e.test', password: 'wrong-password' })
      .expect(401);

    expect(res.body.message).toBe('Invalid credentials');
  });

  it('refresh token returns new access token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'auth-guru@e2e.test', password: 'password123' })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post('/api/auth/refresh')
      .send({ refresh_token: login.body.refresh_token })
      .expect(201);

    expect(res.body.access_token).toBeTruthy();
  });
});