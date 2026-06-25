import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('ExamSessions (e2e)', () => {
  let app: INestApplication;
  let teacherToken: string;
  let studentToken: string;
  let examId: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    const prisma = moduleFixture.get<PrismaService>(PrismaService);

    // Clean up conflicting records from previous runs (respecting FK order)
    await prisma.answer.deleteMany({ where: { examSessionId: { in: [examId, sessionId] } } });
    await prisma.violation.deleteMany({ where: { examSessionId: { in: [examId, sessionId] } } });
    await prisma.examSession.deleteMany({ where: { studentId: 'session-student' } });
    await prisma.exam.deleteMany({ where: { title: 'E2E Test Exam' } });
    await prisma.questionOption.deleteMany({ where: { id: 'd0000000-0000-0000-0000-000000000000' } });
    await prisma.question.deleteMany({ where: { id: 'b8888888-8888-8888-8888-888888888888' } });
    await prisma.questionBank.deleteMany({ where: { id: 'a7777777-7777-7777-7777-777777777777' } });
    await prisma.examGroup.deleteMany({ where: { id: 'f6666666-6666-6666-6666-666666666666' } });
    await prisma.subject.deleteMany({ where: { id: 'e5555555-5555-5555-5555-555555555555' } });
    await prisma.student.deleteMany({ where: { id: 'session-student' } });
    await prisma.user.deleteMany({ where: { id: 'session-student-user' } });
    await prisma.teacher.deleteMany({ where: { id: 'session-teacher' } });
    await prisma.user.deleteMany({ where: { id: 'session-teacher-user' } });
    await prisma.rombel.deleteMany({ where: { id: 'b2222222-2222-2222-2222-222222222222' } });
    await prisma.major.deleteMany({ where: { id: 'a1111111-1111-1111-1111-111111111111' } });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    await prisma.major.upsert({
      where: { id: 'a1111111-1111-1111-1111-111111111111' },
      update: {},
      create: { id: 'a1111111-1111-1111-1111-111111111111', name: 'Test Session Major', code: 'TEST-SESSION' },
    });

    await prisma.rombel.upsert({
      where: { id: 'b2222222-2222-2222-2222-222222222222' },
      update: {},
      create: { id: 'b2222222-2222-2222-2222-222222222222', name: 'Test Session Rombel', majorId: 'a1111111-1111-1111-1111-111111111111' },
    });

    await prisma.user.upsert({
      where: { id: 'session-teacher-user' },
      update: { password: hashedPassword },
      create: {
        id: 'session-teacher-user',
        username: 'guru@test.com',
        email: 'guru@test.com',
        password: hashedPassword,
        fullName: 'Session Teacher',
        role: 'GURU',
      },
    });

    await prisma.teacher.upsert({
      where: { id: 'session-teacher' },
      update: {},
      create: { id: 'session-teacher', userId: 'session-teacher-user' },
    });

    await prisma.user.upsert({
      where: { id: 'session-student-user' },
      update: { password: hashedPassword },
      create: {
        id: 'session-student-user',
        username: 'siswa@test.com',
        email: 'siswa@test.com',
        password: hashedPassword,
        fullName: 'Session Student',
        role: 'SISWA',
      },
    });

    await prisma.student.upsert({
      where: { id: 'session-student' },
      update: {},
      create: {
        id: 'session-student',
        userId: 'session-student-user',
        nis: '98765',
        rombelId: 'b2222222-2222-2222-2222-222222222222',
        majorId: 'a1111111-1111-1111-1111-111111111111',
      },
    });

    await prisma.subject.upsert({
      where: { id: 'e5555555-5555-5555-5555-555555555555' },
      update: {},
      create: { id: 'e5555555-5555-5555-5555-555555555555', name: 'Session Subject', code: 'SESSION-SUB' },
    });

    await prisma.examGroup.upsert({
      where: { id: 'f6666666-6666-6666-6666-666666666666' },
      update: {},
      create: { id: 'f6666666-6666-6666-6666-666666666666', name: 'Test Group', academicYear: '2025/2026', semester: 'Ganjil' },
    });

    await prisma.questionBank.upsert({
      where: { id: 'a7777777-7777-7777-7777-777777777777' },
      update: {},
      create: { id: 'a7777777-7777-7777-7777-777777777777', name: 'Session QB', subjectId: 'e5555555-5555-5555-5555-555555555555', teacherId: 'session-teacher' },
    });

    await prisma.question.upsert({
      where: { id: 'b8888888-8888-8888-8888-888888888888' },
      update: {},
      create: { id: 'b8888888-8888-8888-8888-888888888888', questionBankId: 'a7777777-7777-7777-7777-777777777777', content: 'Question 1', type: 'PILIHAN_GANDA' },
    });

    await prisma.questionOption.upsert({
      where: { id: 'd0000000-0000-0000-0000-000000000000' },
      update: {},
      create: { id: 'd0000000-0000-0000-0000-000000000000', questionId: 'b8888888-8888-8888-8888-888888888888', content: 'Option 1', isCorrect: true, order: 1 },
    });

    // Login as teacher
    const teacherRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'guru@test.com', password: 'password123' });

    teacherToken = teacherRes.body.access_token;

    // Login as student
    const studentRes = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'siswa@test.com', password: 'password123' });

    studentToken = studentRes.body.access_token;

    // Create exam
    const examRes = await request(app.getHttpServer())
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'E2E Test Exam',
        subjectId: 'e5555555-5555-5555-5555-555555555555',
        examGroupId: 'f6666666-6666-6666-6666-666666666666',
        duration: 60,
        startTime: new Date(Date.now() + 60000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        questionIds: ['b8888888-8888-8888-8888-888888888888'],
        rombelIds: ['b2222222-2222-2222-2222-222222222222'],
      });

    examId = examRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Exam Session Flow', () => {
    it('should start session successfully', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/exam-sessions/start')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ examId });
      console.log('EXAM SESSION START RESPONSE:', JSON.stringify(res.body));
      expect(res.status).toBe(201);

      sessionId = res.body.id;
      expect(sessionId).toBeTruthy();
    });

    it('should submit answer successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/exam-sessions/${sessionId}/submit-answer`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ questionId: 'b8888888-8888-8888-8888-888888888888', selectedOptionId: 'd0000000-0000-0000-0000-000000000000' })
        .expect(200);

      expect(res.body).toBeDefined();
    });

    it('should finish session successfully', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/exam-sessions/${sessionId}/finish`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.status).toBe('SUBMITTED');
    });
  });

  describe('Security', () => {
    it('should reject unauthenticated start session', async () => {
      await request(app.getHttpServer())
        .post('/api/exam-sessions/start')
        .send({ examId })
        .expect(401);
    });

    it('should reject student from admin endpoints', async () => {
      await request(app.getHttpServer())
        .post('/api/exams')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ title: 'Hack' })
        .expect(403);
    });
  });
});