import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { JwtAuthGuard } from '../src/auth/guards/jwt-auth.guard';
import { RolesGuard } from '../src/auth/guards/roles.guard';

@Injectable()
class MockTeacherGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    req.user = {
      userId: 'teacher-user-id',
      role: 'GURU',
    };
    return true;
  }
}

describe('ExamsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideGuard(JwtAuthGuard)
      .useClass(MockTeacherGuard)
      .overrideGuard(RolesGuard)
      .useClass(MockTeacherGuard)
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up conflicting records from previous runs
    await prisma.question.deleteMany({ where: { id: { in: ['q1', 'q2', 'b8888888-8888-8888-8888-888888888888', 'c9999999-9999-9999-9999-999999999999'] } } });
    await prisma.questionBank.deleteMany({ where: { id: { in: ['qb-1', 'a7777777-7777-7777-7777-777777777777'] } } });
    await prisma.examGroup.deleteMany({ where: { id: { in: ['eg-1', 'f6666666-6666-6666-6666-666666666666'] } } });
    await prisma.subject.deleteMany({ where: { id: { in: ['subject-1', 'e5555555-5555-5555-5555-555555555555'] } } });
    await prisma.teacher.deleteMany({ where: { id: { in: ['teacher-1', 'd4444444-4444-4444-4444-444444444444'] } } });
    await prisma.user.deleteMany({ where: { id: { in: ['teacher-user-id', 'c3333333-3333-3333-3333-333333333333'] } } });
    await prisma.rombel.deleteMany({ where: { id: { in: ['r1', 'b2222222-2222-2222-2222-222222222222'] } } });
    await prisma.major.deleteMany({ where: { id: { in: ['m1', 'a1111111-1111-1111-1111-111111111111'] } } });

    // Seed required data for exams test
    await prisma.major.upsert({
      where: { id: 'a1111111-1111-1111-1111-111111111111' },
      update: {},
      create: { id: 'a1111111-1111-1111-1111-111111111111', name: 'Test Major', code: 'TEST' },
    });

    await prisma.rombel.upsert({
      where: { id: 'b2222222-2222-2222-2222-222222222222' },
      update: {},
      create: { id: 'b2222222-2222-2222-2222-222222222222', name: 'Test Rombel', majorId: 'a1111111-1111-1111-1111-111111111111' },
    });

    await prisma.user.upsert({
      where: { id: 'c3333333-3333-3333-3333-333333333333' },
      update: {},
      create: {
        id: 'c3333333-3333-3333-3333-333333333333',
        username: 'test-teacher',
        email: 'test-teacher@test.com',
        password: 'password123',
        fullName: 'Test Teacher',
        role: 'GURU',
      },
    });

    await prisma.teacher.upsert({
      where: { id: 'd4444444-4444-4444-4444-444444444444' },
      update: {},
      create: { id: 'd4444444-4444-4444-4444-444444444444', userId: 'c3333333-3333-3333-3333-333333333333' },
    });

    await prisma.subject.upsert({
      where: { id: 'e5555555-5555-5555-5555-555555555555' },
      update: {},
      create: { id: 'e5555555-5555-5555-5555-555555555555', name: 'Test Subject', code: 'TEST-SUB' },
    });

    await prisma.examGroup.upsert({
      where: { id: 'f6666666-6666-6666-6666-666666666666' },
      update: {},
      create: { id: 'f6666666-6666-6666-6666-666666666666', name: 'Test Group', academicYear: '2025/2026', semester: 'Ganjil' },
    });

    await prisma.questionBank.upsert({
      where: { id: 'a7777777-7777-7777-7777-777777777777' },
      update: {},
      create: { id: 'a7777777-7777-7777-7777-777777777777', name: 'Test QB', subjectId: 'e5555555-5555-5555-5555-555555555555', teacherId: 'd4444444-4444-4444-4444-444444444444' },
    });

    await prisma.question.upsert({
      where: { id: 'b8888888-8888-8888-8888-888888888888' },
      update: {},
      create: { id: 'b8888888-8888-8888-8888-888888888888', questionBankId: 'a7777777-7777-7777-7777-777777777777', content: 'Question 1', type: 'PILIHAN_GANDA' },
    });

    await prisma.question.upsert({
      where: { id: 'c9999999-9999-9999-9999-999999999999' },
      update: {},
      create: { id: 'c9999999-9999-9999-9999-999999999999', questionBankId: 'a7777777-7777-7777-7777-777777777777', content: 'Question 2', type: 'ESSAY' },
    });
  });

  afterAll(async () => {
    await app.close();
  });

  it('/POST exams (success)', async () => {
    const res = await request(app.getHttpServer())
      .post('/exams')
      .set('Authorization', 'Bearer teacher-jwt')
      .send({
        title: 'Ujian Baru',
        subjectId: 'e5555555-5555-5555-5555-555555555555',
        examGroupId: 'f6666666-6666-6666-6666-666666666666',
        duration: 60,
        startTime: '2026-06-26T08:00:00.000Z',
        endTime: '2026-06-26T09:00:00.000Z',
        questionIds: ['b8888888-8888-8888-8888-888888888888', 'c9999999-9999-9999-9999-999999999999'],
        rombelIds: ['b2222222-2222-2222-2222-222222222222'],
      });
    console.log('EXAMS RESPONSE BODY:', JSON.stringify(res.body));
    expect(res.status).toBe(201);
  });

  it('/POST exams (reject no questions)', async () => {
    return request(app.getHttpServer())
      .post('/exams')
      .set('Authorization', 'Bearer teacher-jwt')
      .send({
        title: 'Invalid',
        subjectId: 'e5555555-5555-5555-5555-555555555555',
        examGroupId: 'f6666666-6666-6666-6666-666666666666',
        duration: 60,
        startTime: '2026-06-26T08:00:00.000Z',
        endTime: '2026-06-26T09:00:00.000Z',
        questionIds: [],
        rombelIds: ['b2222222-2222-2222-2222-222222222222'],
      })
      .expect(400);
  });

  it('/POST exams (reject no rombel)', async () => {
    return request(app.getHttpServer())
      .post('/exams')
      .set('Authorization', 'Bearer teacher-jwt')
      .send({
        title: 'Invalid',
        subjectId: 'e5555555-5555-5555-5555-555555555555',
        examGroupId: 'f6666666-6666-6666-6666-666666666666',
        duration: 60,
        startTime: '2026-06-26T08:00:00.000Z',
        endTime: '2026-06-26T09:00:00.000Z',
        questionIds: ['b8888888-8888-8888-8888-888888888888'],
        rombelIds: [],
      })
      .expect(400);
  });
});
