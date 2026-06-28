import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('ExamsController (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let teacherToken: string;

  // Unique IDs for this test file only (prefix 'aa')
  const majorId   = 'aa000000-0000-4000-8000-000000000001';
  const rombelId  = 'aa000000-0000-4000-8000-000000000002';
  const userId    = 'aa000000-0000-4000-8000-000000000003';
  const teacherId = 'aa000000-0000-4000-8000-000000000004';
  const subjectId = 'aa000000-0000-4000-8000-000000000005';
  const groupId   = 'aa000000-0000-4000-8000-000000000006';
  const bankId    = 'aa000000-0000-4000-8000-000000000007';
  const q1        = 'aa000000-0000-4000-8000-000000000008';
  const q2        = 'aa000000-0000-4000-8000-000000000009';

  beforeAll(async () => {
    const mod = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    prisma = mod.get(PrismaService);

    // Cleanup
    await prisma.exam.deleteMany({ where: { subjectId } });
    await prisma.questionOption.deleteMany({ where: { question: { questionBankId: bankId } } });
    await prisma.question.deleteMany({ where: { questionBankId: bankId } });
    await prisma.questionBank.deleteMany({ where: { id: bankId } });
    await prisma.examGroup.deleteMany({ where: { id: groupId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.teacher.deleteMany({ where: { id: teacherId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.rombel.deleteMany({ where: { id: rombelId } });
    await prisma.major.deleteMany({ where: { id: majorId } });

    // Seed
    const pw = await bcrypt.hash('password123', 10);
    await prisma.major.create({ data: { id: majorId, name: 'Exam Major AA', code: 'EXM-AA' } });
    await prisma.rombel.create({ data: { id: rombelId, name: 'Exam Rombel AA', majorId } });
    await prisma.user.create({ data: { id: userId, username: 'exam-guru-aa@e2e.test', email: 'exam-guru-aa@e2e.test', password: pw, fullName: 'Exam Teacher', role: 'GURU' } });
    await prisma.teacher.create({ data: { id: teacherId, userId } });
    await prisma.subject.create({ data: { id: subjectId, name: 'Exam Subject AA', code: 'EXM-SUB-AA' } });
    await prisma.examGroup.create({ data: { id: groupId, name: 'Exam Group AA', academicYear: '2025/2026', semester: 'Ganjil' } });
    await prisma.questionBank.create({ data: { id: bankId, name: 'Exam QB', subjectId, teacherId } });
    await prisma.question.createMany({ data: [
      { id: q1, questionBankId: bankId, content: 'Q1', type: 'PILIHAN_GANDA', points: 5 },
      { id: q2, questionBankId: bankId, content: 'Q2', type: 'ESSAY', points: 5 },
    ]});

    // Login
    const login = await request(app.getHttpServer()).post('/api/auth/login').send({ username: 'exam-guru-aa@e2e.test', password: 'password123' });
    teacherToken = login.body.access_token;
    if (!teacherToken) throw new Error('Login failed: ' + JSON.stringify(login.body));
  }, 30000);

  afterAll(async () => { await app.close(); });

  it('/POST exams (success)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({
        title: 'Ujian Baru',
        subjectId,
        examGroupId: groupId,
        duration: 60,
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        questionIds: [q1, q2],
        rombelIds: [rombelId],
      })
      .expect(201);

    expect(res.body.id).toBeTruthy();
  });

  it('/POST exams (reject no questions)', async () => {
    await request(app.getHttpServer())
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Invalid', subjectId, examGroupId: groupId, duration: 60, startTime: new Date().toISOString(), endTime: new Date(Date.now()+3600000).toISOString(), questionIds: [], rombelIds: [rombelId] })
      .expect(400);
  });

  it('/POST exams (reject no rombel)', async () => {
    await request(app.getHttpServer())
      .post('/api/exams')
      .set('Authorization', `Bearer ${teacherToken}`)
      .send({ title: 'Invalid', subjectId, examGroupId: groupId, duration: 60, startTime: new Date().toISOString(), endTime: new Date(Date.now()+3600000).toISOString(), questionIds: [q1], rombelIds: [] })
      .expect(400);
  });
});
