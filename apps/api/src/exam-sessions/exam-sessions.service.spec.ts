import { Test } from '@nestjs/testing';
import { ExamSessionsService } from './exam-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

describe('ExamSessionsService', () => {
  const baseSession = {
    id: 'sess1', examId: 'e1', studentId: 's1',
    status: 'IN_PROGRESS', startTime: new Date(), endTime: null,
    score: null, submittedAt: null, violationCount: 0,
    lockedCount: 0, sebChecksum: null, mediaAccess: true,
  };
  const baseExam = {
    id: 'e1', title: 'UTS', duration: 60, status: 'PUBLISHED',
    startTime: new Date('2020-01-01'), endTime: new Date('2030-12-31'),
    maxAttempts: 1, token: null,
    showScore: true, requireSeb: false,
    sebConfigKey: null, sebBrowserKey: null,
    maxViolations: 3, autoLockEnabled: true,
  };
  const baseStudent = { id: 's1', userId: 'u1', nis: '123', rombelId: 'r1', majorId: 'm1' };
  const prisma = {
    student: { findUnique: jest.fn() },
    exam: { findUnique: jest.fn() },
    examSession: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn(), count: jest.fn() },
    examAttendance: { findUnique: jest.fn() },
    answer: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    examQuestion: { findUnique: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  } as any;
  const notif = { create: jest.fn() } as any;
  let service: ExamSessionsService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [ExamSessionsService, { provide: PrismaService, useValue: prisma }, { provide: NotificationsService, useValue: notif }],
    }).compile();
    service = mod.get(ExamSessionsService);
    (service as any).notificationsService = notif;
  });

  beforeEach(() => jest.clearAllMocks());

  // ─── existing rejection tests kept ───
  it('startSession reject non-student', async () => {
    prisma.student.findUnique.mockResolvedValue(null);
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('User is not a student');
  });

  it('startSession reject exam not found', async () => {
    prisma.student.findUnique.mockResolvedValue(baseStudent);
    prisma.exam.findUnique.mockResolvedValue(null);
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('Exam not found');
  });

  it('submitAnswer reject session not in progress', async () => {
    prisma.examSession.findUnique.mockResolvedValue({ ...baseSession, status: 'SUBMITTED' });
    await expect(service.submitAnswer('sess1', { questionId: 'q1' } as any)).rejects.toThrow('Session is not in progress');
  });

  it('finishSession reject non-IP/LOCKED status', async () => {
    prisma.examSession.findUnique.mockResolvedValue({ ...baseSession, status: 'SUBMITTED', exam: baseExam, student: { user: {} }, answers: [] });
    await expect(service.finishSession('sess1')).rejects.toThrow('Session is not in progress or locked');
  });

  // ─── new happy-path tests ───
  it('startSession creates new session when valid', async () => {
    prisma.student.findUnique.mockResolvedValue(baseStudent);
    prisma.exam.findUnique.mockResolvedValue(baseExam);
    prisma.examSession.findUnique.mockResolvedValue(null);
    prisma.examAttendance.findUnique.mockResolvedValue({ id: 'a1' });
    prisma.examSession.create.mockResolvedValue({ ...baseSession, answers: [], exam: baseExam });

    const result = await service.startSession({ examId: 'e1' } as any, 'u1');
    expect(prisma.examSession.create).toHaveBeenCalled();
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('startSession resumes existing IN_PROGRESS session', async () => {
    prisma.student.findUnique.mockResolvedValue(baseStudent);
    prisma.exam.findUnique.mockResolvedValue(baseExam);
    prisma.examSession.findUnique.mockResolvedValue({ ...baseSession, answers: [], exam: baseExam });
    const result = await service.startSession({ examId: 'e1' } as any, 'u1');
    expect(result.status).toBe('IN_PROGRESS');
  });

  it('startSession rejects when already submitted', async () => {
    prisma.student.findUnique.mockResolvedValue(baseStudent);
    prisma.exam.findUnique.mockResolvedValue(baseExam);
    prisma.examSession.findUnique.mockResolvedValue({ ...baseSession, status: 'SUBMITTED', answers: [] });
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('already submitted');
  });

  it('startSession rejects when no attendance check-in', async () => {
    prisma.student.findUnique.mockResolvedValue(baseStudent);
    prisma.exam.findUnique.mockResolvedValue(baseExam);
    prisma.examSession.findUnique.mockResolvedValue(null);
    prisma.examAttendance.findUnique.mockResolvedValue(null);
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('check in before starting');
  });

  it('startSession enforces maxAttempts', async () => {
    prisma.student.findUnique.mockResolvedValue(baseStudent);
    prisma.exam.findUnique.mockResolvedValue({ ...baseExam, maxAttempts: 1 });
    prisma.examSession.findUnique.mockResolvedValue(null);
    prisma.examAttendance.findUnique.mockResolvedValue({ id: 'a1' });
    prisma.examSession.count.mockResolvedValue(1);
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('maximum attempts');
  });

  it('submitAnswer persists answer via upsert', async () => {
    prisma.examSession.findUnique.mockResolvedValue({ ...baseSession, exam: baseExam });
    prisma.examQuestion.findUnique.mockResolvedValue({
      examId: 'e1', questionId: 'q1',
      question: { options: [{ id: 'opt1' }] },
    });
    prisma.answer.upsert.mockResolvedValue({ id: 'a1', selectedOption: 'opt1' });

    const result = await service.submitAnswer('sess1', { questionId: 'q1', selectedOptionId: 'opt1' } as any);
    expect(result.selectedOption).toBe('opt1');
    expect(prisma.answer.upsert).toHaveBeenCalled();
  });

  it('submitAnswer rejects option not belonging to question', async () => {
    prisma.examSession.findUnique.mockResolvedValue({ ...baseSession, exam: baseExam });
    prisma.examQuestion.findUnique.mockResolvedValue({
      examId: 'e1', questionId: 'q1',
      question: { options: [{ id: 'opt1' }] },
    });
    await expect(
      service.submitAnswer('sess1', { questionId: 'q1', selectedOptionId: 'wrong-opt' } as any),
    ).rejects.toThrow('does not belong to this question');
  });

  it('finishSession grades answers and returns score', async () => {
    const pts = 10;
    prisma.examSession.findUnique.mockResolvedValue({
      ...baseSession, exam: { ...baseExam, showScore: true },
      student: { user: { fullName: 'Siswa' } },
      answers: [{
        id: 'a1', questionId: 'q1', selectedOption: 'opt1',
        question: { type: 'PILIHAN_GANDA', points: pts, options: [
          { id: 'opt1', isCorrect: true },
          { id: 'opt2', isCorrect: false },
        ]},
      }],
    });
    prisma.answer.update.mockResolvedValue({});
    prisma.examSession.update.mockResolvedValue({ score: pts, status: 'SUBMITTED', submittedAt: new Date(), exam: baseExam, showScore: true });
    notif.create.mockResolvedValue({});

    const result = await service.finishSession('sess1');
    expect(result.score).toBe(pts);
    expect(notif.create).toHaveBeenCalled();
  });
});
