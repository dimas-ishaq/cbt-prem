import { Test, TestingModule } from '@nestjs/testing';
import { ExamSessionsService } from './exam-sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { SessionStatus, ExamStatus } from '@prisma/client';

describe('ExamSessionsService', () => {
  let service: ExamSessionsService;
  const mockPrisma = {
    student: { findUnique: jest.fn() },
    exam: { findUnique: jest.fn() },
    examSession: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    examQuestion: { findUnique: jest.fn() },
    answer: {
      upsert: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  const mockNotifications = { create: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamSessionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotifications },
      ],
    }).compile();

    service = module.get(ExamSessionsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('isSebAllowed', () => {
    it('should allow when SEB not required', () => {
      expect(service.isSebAllowed(false, 'Chrome', '', '', null, null)).toBe(true);
    });

    it('should block non-SEB browser when required', () => {
      expect(service.isSebAllowed(true, 'Mozilla/5.0 Chrome', '', '', null, null)).toBe(false);
    });

    it('should allow SEB browser when required', () => {
      expect(service.isSebAllowed(true, 'SEB/3.0', '', '', null, null)).toBe(true);
    });

    it('should block mismatched config key', () => {
      expect(service.isSebAllowed(false, '', 'wrong', '', 'correct', null)).toBe(false);
    });

    it('should block mismatched browser key', () => {
      expect(service.isSebAllowed(false, '', '', 'wrong', null, 'correct')).toBe(false);
    });

    it('should allow matching keys', () => {
      expect(service.isSebAllowed(true, 'SEB', 'k1', 'k2', 'k1', 'k2')).toBe(true);
    });
  });

  describe('startSession', () => {
    it('should throw ForbiddenException if user is not a student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      await expect(service.startSession({ examId: 'e1' }, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if student has no class/major', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: null, majorId: null });
      await expect(service.startSession({ examId: 'e1' }, 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if exam not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findUnique.mockResolvedValue(null);
      await expect(service.startSession({ examId: 'e1' }, 'u1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if exam is not published/ongoing', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: 'DRAFT', requireSeb: false,
        startTime: new Date(Date.now() - 10000), endTime: new Date(Date.now() + 10000),
      });
      await expect(service.startSession({ examId: 'e1' }, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if exam is outside time', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: ExamStatus.PUBLISHED, requireSeb: false,
        startTime: new Date(Date.now() + 100000), endTime: new Date(Date.now() + 200000),
      });
      await expect(service.startSession({ examId: 'e1' }, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if exam token is invalid', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: ExamStatus.PUBLISHED, requireSeb: false, token: 'SECRET',
        startTime: new Date(Date.now() - 10000), endTime: new Date(Date.now() + 100000),
      });
      await expect(service.startSession({ examId: 'e1', token: 'WRONG' }, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should return existing in-progress session', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      const existing = { id: 'sess1', status: SessionStatus.IN_PROGRESS, answers: [] };
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: ExamStatus.PUBLISHED, requireSeb: false,
        startTime: new Date(Date.now() - 10000), endTime: new Date(Date.now() + 100000),
      });
      mockPrisma.examSession.findUnique.mockResolvedValue(existing);
      const result = await service.startSession({ examId: 'e1' }, 'u1');
      expect(result).toEqual(existing);
    });

    it('should throw if already submitted', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: ExamStatus.PUBLISHED, requireSeb: false,
        startTime: new Date(Date.now() - 10000), endTime: new Date(Date.now() + 100000),
      });
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 'sess1', status: SessionStatus.SUBMITTED });
      await expect(service.startSession({ examId: 'e1' }, 'u1')).rejects.toThrow(BadRequestException);
    });

    it('should create new session on happy path', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: ExamStatus.PUBLISHED, requireSeb: false,
        startTime: new Date(Date.now() - 10000), endTime: new Date(Date.now() + 100000),
      });
      mockPrisma.examSession.findUnique.mockResolvedValue(null);
      mockPrisma.examSession.create.mockResolvedValue({ id: 'new-sess' });
      const result = await service.startSession({ examId: 'e1' }, 'u1');
      expect(result).toEqual({ id: 'new-sess' });
    });
  });

  describe('getActiveSessionByExam', () => {
    it('should throw ForbiddenException if user is not a student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      await expect(service.getActiveSessionByExam('e1', 'u1')).rejects.toThrow(ForbiddenException);
    });

    it('should return the active session for the student and exam', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 'sess1', examId: 'e1', studentId: 's1' });
      const result = await service.getActiveSessionByExam('e1', 'u1');
      expect(result).toEqual({ id: 'sess1', examId: 'e1', studentId: 's1' });
    });
  });

  describe('submitAnswer', () => {
    it('should throw NotFoundException if session not found', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(null);
      await expect(service.submitAnswer('s1', { questionId: 'q1' } as any)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session not in progress', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 's1', status: SessionStatus.SUBMITTED, examId: 'e1' });
      await expect(service.submitAnswer('s1', { questionId: 'q1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if question not in exam', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 's1', status: SessionStatus.IN_PROGRESS, examId: 'e1' });
      mockPrisma.examQuestion.findUnique.mockResolvedValue(null);
      await expect(service.submitAnswer('s1', { questionId: 'q1' } as any)).rejects.toThrow(BadRequestException);
    });

    it('should upsert answer on happy path', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 's1', status: SessionStatus.IN_PROGRESS, examId: 'e1' });
      mockPrisma.examQuestion.findUnique.mockResolvedValue({ examId: 'e1', questionId: 'q1' });
      mockPrisma.answer.upsert.mockResolvedValue({ id: 'a1' });
      const result = await service.submitAnswer('s1', { questionId: 'q1', selectedOptionId: 'o1' } as any);
      expect(result).toEqual({ id: 'a1' });
    });
  });

  describe('finishSession', () => {
    it('should throw NotFoundException if session not found', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(null);
      await expect(service.finishSession('s1')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if session is already submitted', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 's1', status: SessionStatus.SUBMITTED });
      await expect(service.finishSession('s1')).rejects.toThrow(BadRequestException);
    });

    it('should calculate score for multiple choice correctly', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue({
        id: 's1', status: SessionStatus.IN_PROGRESS,
        exam: { title: 'Test' },
        student: { userId: 'u1', user: {} },
        answers: [
          {
            id: 'a1', selectedOption: 'opt-correct', questionId: 'q1',
            question: {
              type: 'PILIHAN_GANDA', points: 10,
              options: [{ id: 'opt-correct', isCorrect: true }, { id: 'opt-wrong', isCorrect: false }],
            },
          },
          {
            id: 'a2', selectedOption: 'opt-wrong2', questionId: 'q2',
            question: {
              type: 'PILIHAN_GANDA', points: 10,
              options: [{ id: 'opt-right', isCorrect: true }, { id: 'opt-wrong2', isCorrect: false }],
            },
          },
        ],
      });
      mockPrisma.answer.update.mockResolvedValue({});
      mockPrisma.examSession.update.mockResolvedValue({ id: 's1', score: 10 });
      mockNotifications.create.mockResolvedValue({});

      const result = await service.finishSession('s1');
      // First answer correct (10pts), second wrong (0pts) => total 10
      expect(mockPrisma.examSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ score: 10 }) })
      );
    });
  });

  describe('gradeAnswer', () => {
    it('should throw NotFoundException if answer not found', async () => {
      mockPrisma.answer.findUnique.mockResolvedValue(null);
      await expect(service.gradeAnswer('a1', { score: 5 })).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if score exceeds max points', async () => {
      mockPrisma.answer.findUnique.mockResolvedValue({ id: 'a1', question: { points: 10 } });
      await expect(service.gradeAnswer('a1', { score: 15 })).rejects.toThrow(BadRequestException);
    });

    it('should grade and recalculate total score', async () => {
      mockPrisma.answer.findUnique.mockResolvedValue({ id: 'a1', question: { points: 10 } });
      mockPrisma.answer.update.mockResolvedValue({ id: 'a1', examSessionId: 'sess1', examSession: { id: 'sess1' } });
      mockPrisma.answer.findMany.mockResolvedValue([{ score: 8 }, { score: 5 }]);
      mockPrisma.examSession.update.mockResolvedValue({});

      await service.gradeAnswer('a1', { score: 8 });
      expect(mockPrisma.examSession.update).toHaveBeenCalledWith(
        expect.objectContaining({ data: { score: 13 } })
      );
    });
  });

  describe('resetSession', () => {
    it('should throw NotFoundException if session not found', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue(null);
      await expect(service.resetSession('s1')).rejects.toThrow(NotFoundException);
    });

    it('should delete session', async () => {
      mockPrisma.examSession.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.examSession.delete.mockResolvedValue({ id: 's1' });
      const result = await service.resetSession('s1');
      expect(mockPrisma.examSession.delete).toHaveBeenCalledWith({ where: { id: 's1' } });
    });
  });

  describe('bulkResetSessions', () => {
    it('should throw BadRequestException for empty array', async () => {
      await expect(service.bulkResetSessions([])).rejects.toThrow(BadRequestException);
    });

    it('should delete multiple sessions', async () => {
      mockPrisma.examSession.deleteMany.mockResolvedValue({ count: 2 });
      await service.bulkResetSessions(['s1', 's2']);
      expect(mockPrisma.examSession.deleteMany).toHaveBeenCalledWith({ where: { id: { in: ['s1', 's2'] } } });
    });
  });

  describe('getMyHistory', () => {
    it('should throw NotFoundException if student not found', async () => {
      mockPrisma.student.findUnique.mockResolvedValue(null);
      await expect(service.getMyHistory('u1')).rejects.toThrow(NotFoundException);
    });

    it('should return history for student', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1' });
      mockPrisma.examSession.findMany.mockResolvedValue([{ id: 'sess1', score: 80, exam: { showScore: true } }]);
      const result = await service.getMyHistory('u1');
      expect(result).toEqual([{ id: 'sess1', score: 80, exam: { showScore: true } }]);
    });
  });
});
