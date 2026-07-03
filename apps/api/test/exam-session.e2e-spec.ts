import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

describe('ExamSessions (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let examId: string;
  let sessionId: string;

  // Unique IDs for this test file only (prefix 'bb')
  const majorId = 'bb000000-0000-4000-8000-000000000001';
  const rombelId = 'bb000000-0000-4000-8000-000000000002';
  const teacherUid = 'bb000000-0000-4000-8000-000000000003';
  const teacherId = 'bb000000-0000-4000-8000-000000000004';
  const studentUid = 'bb000000-0000-4000-8000-000000000005';
  const studentId = 'bb000000-0000-4000-8000-000000000006';
  const subjectId = 'bb000000-0000-4000-8000-000000000007';
  const groupId = 'bb000000-0000-4000-8000-000000000008';
  const bankId = 'bb000000-0000-4000-8000-000000000009';
  const q1 = 'bb000000-0000-4000-8000-00000000000a';
  const opt1 = 'bb000000-0000-4000-8000-00000000000b';
  let raceSessionId: string;
  let raceExamId: string;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = mod.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    const prisma = mod.get(PrismaService);

    // Cleanup (FK order)
    await prisma.answer.deleteMany({ where: { examSession: { studentId } } });
    await prisma.violation.deleteMany({
      where: { examSession: { studentId } },
    });
    await prisma.examSession.deleteMany({ where: { studentId } });
    await prisma.exam.deleteMany({ where: { subjectId } });
    await prisma.questionOption.deleteMany({
      where: { question: { questionBankId: bankId } },
    });
    await prisma.question.deleteMany({ where: { questionBankId: bankId } });
    await prisma.questionBank.deleteMany({ where: { id: bankId } });
    await prisma.examGroup.deleteMany({ where: { id: groupId } });
    await prisma.subject.deleteMany({ where: { id: subjectId } });
    await prisma.student.deleteMany({ where: { id: studentId } });
    await prisma.user.deleteMany({ where: { id: studentUid } });
    await prisma.teacher.deleteMany({ where: { id: teacherId } });
    await prisma.user.deleteMany({ where: { id: teacherUid } });
    await prisma.rombel.deleteMany({ where: { id: rombelId } });
    await prisma.major.deleteMany({ where: { id: majorId } });

    // Seed
    const pw = await bcrypt.hash('password123', 10);
    await prisma.major.create({
      data: { id: majorId, name: 'Session Major BB', code: 'SES-BB' },
    });
    await prisma.rombel.create({
      data: { id: rombelId, name: 'Session Rombel BB', majorId },
    });
    await prisma.user.create({
      data: {
        id: teacherUid,
        username: 'ses-guru-bb@e2e.test',
        email: 'ses-guru-bb@e2e.test',
        password: pw,
        fullName: 'Session Teacher',
        role: 'GURU',
      },
    });
    await prisma.teacher.create({
      data: { id: teacherId, userId: teacherUid },
    });
    await prisma.user.create({
      data: {
        id: studentUid,
        username: 'ses-siswa-bb@e2e.test',
        email: 'ses-siswa-bb@e2e.test',
        password: pw,
        fullName: 'Session Student',
        role: 'SISWA',
      },
    });
    await prisma.student.create({
      data: {
        id: studentId,
        userId: studentUid,
        nis: '99999bb',
        rombelId,
        majorId,
      },
    });
    await prisma.subject.create({
      data: { id: subjectId, name: 'Session Subject BB', code: 'SES-SUB-BB' },
    });
    await prisma.examGroup.create({
      data: {
        id: groupId,
        name: 'Session Group BB',
        academicYear: '2025/2026',
        semester: 'Ganjil',
      },
    });
    await prisma.questionBank.create({
      data: { id: bankId, name: 'Session QB', subjectId, teacherId },
    });
    await prisma.question.create({
      data: {
        id: q1,
        questionBankId: bankId,
        content: 'Q1',
        type: 'PILIHAN_GANDA',
        points: 5,
      },
    });
    await prisma.questionOption.create({
      data: {
        id: opt1,
        questionId: q1,
        content: 'Opt 1',
        isCorrect: true,
        order: 1,
      },
    });

    // Login teacher & create exam
    const tLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'ses-guru-bb@e2e.test', password: 'password123' });
    if (!tLogin.body.access_token)
      throw new Error('Teacher login failed: ' + JSON.stringify(tLogin.body));
    const examRes = await request(app.getHttpServer())
      .post('/api/exams')
      .set('Authorization', `Bearer ${tLogin.body.access_token}`)
      .send({
        title: 'E2E Session Exam',
        subjectId,
        examGroupId: groupId,
        duration: 60,
        startTime: new Date(Date.now() - 60000).toISOString(),
        endTime: new Date(Date.now() + 3600000).toISOString(),
        questionIds: [q1],
        rombelIds: [rombelId],
        status: 'PUBLISHED',
      });
    if (!examRes.body.id)
      throw new Error('Exam create failed: ' + JSON.stringify(examRes.body));
    examId = examRes.body.id;

    // Login student
    const sLogin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'ses-siswa-bb@e2e.test', password: 'password123' });
    if (!sLogin.body.access_token)
      throw new Error('Student login failed: ' + JSON.stringify(sLogin.body));
    studentToken = sLogin.body.access_token;
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  it('should start session successfully', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/exam-sessions/start')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ examId });
    if (res.status !== 201)
      console.log('START SESSION FAIL:', JSON.stringify(res.body));
    expect(res.status).toBe(201);
    sessionId = res.body.id;
  });

  it('should submit answer successfully', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/exam-sessions/${sessionId}/submit-answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionId: q1, selectedOptionId: opt1 })
      .expect(201);

    expect(res.body.questionId).toBe(q1);
    expect(res.body.selectedOption).toBe(opt1);
  });

  it('should upsert same answer without duplicate row', async () => {
    await request(app.getHttpServer())
      .post(`/api/exam-sessions/${sessionId}/submit-answer`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ questionId: q1, selectedOptionId: opt1 })
      .expect(201);

    const prisma = app.get<PrismaService>(PrismaService);
    const answers = await prisma.answer.findMany({
      where: { examSessionId: sessionId, questionId: q1 },
    });
    expect(answers).toHaveLength(1);
  });

  it('should finish session successfully', async () => {
    const res = await request(app.getHttpServer())
      .post(`/api/exam-sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(201);
    expect(res.body.status).toBe('SUBMITTED');
  });

  it('should reject finish twice', async () => {
    await request(app.getHttpServer())
      .post(`/api/exam-sessions/${sessionId}/finish`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(400);
  });
});
