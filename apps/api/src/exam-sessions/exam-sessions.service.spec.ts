import { Test } from '@nestjs/testing';
import { ExamSessionsService } from './exam-sessions.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamSessionsService', () => {
  const prisma = {
    student: { findUnique: jest.fn() },
    exam: { findUnique: jest.fn() },
    examSession: { findUnique: jest.fn(), findMany: jest.fn(), create: jest.fn(), update: jest.fn() },
    answer: { upsert: jest.fn(), findMany: jest.fn(), update: jest.fn() },
    examQuestion: { findUnique: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  } as any;

  const notif = { create: jest.fn() };
  let service: ExamSessionsService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        ExamSessionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: 'NotificationsService', useValue: notif },
      ],
    })
      .overrideProvider('NotificationsService')
      .useValue(notif)
      .compile();

    service = mod.get(ExamSessionsService);
    (service as any).notificationsService = notif;
  });

  beforeEach(() => jest.clearAllMocks());

  it('startSession reject non-student', async () => {
    prisma.student.findUnique.mockResolvedValue(null);
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('User is not a student');
  });

  it('startSession reject exam not found', async () => {
    prisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
    prisma.exam.findUnique.mockResolvedValue(null);
    await expect(service.startSession({ examId: 'e1' } as any, 'u1')).rejects.toThrow('Exam not found');
  });

  it('submitAnswer reject session not in progress', async () => {
    prisma.examSession.findUnique.mockResolvedValue({ id: 'sess1', status: 'SUBMITTED', examId: 'e1' });
    await expect(service.submitAnswer('sess1', { questionId: 'q1' } as any)).rejects.toThrow('Session is not in progress');
  });

  it('finishSession reject non-IP/LOCKED status', async () => {
    prisma.examSession.findUnique.mockResolvedValue({
      id: 'sess1', status: 'SUBMITTED', exam: {}, student: { user: {} }, answers: [], examId: 'e1',
    });
    await expect(service.finishSession('sess1')).rejects.toThrow('Session is not in progress or locked');
  });
});