import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamsService', () => {
  let service: ExamsService;
  const mockPrisma = {
    exam: { create: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), update: jest.fn(), delete: jest.fn() },
    examQuestion: { deleteMany: jest.fn() },
    examTargetRombel: { deleteMany: jest.fn() },
    examTargetMajor: { deleteMany: jest.fn() },
    examSession: { deleteMany: jest.fn() },
    answer: { deleteMany: jest.fn() },
    violation: { deleteMany: jest.fn() },
    student: { findUnique: jest.fn() },
    $transaction: jest.fn((fn) => fn(mockPrisma)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ExamsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('create', () => {
    it('should create exam with questions and targets', async () => {
      mockPrisma.exam.create.mockResolvedValue({ id: 'e1', title: 'UTS' });
      const dto = {
        title: 'UTS', subjectId: 's1',
        startTime: '2025-06-01T08:00', endTime: '2025-06-01T10:00',
        questionIds: ['q1', 'q2'], rombelIds: ['r1'], majorIds: ['m1'],
      };
      const result = await service.create(dto as any, 't1');
      expect(result.id).toBe('e1');
      expect(mockPrisma.exam.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            teacherId: 't1',
            examQuestions: { create: expect.any(Array) },
            targetRombels: { create: expect.any(Array) },
            targetMajors: { create: expect.any(Array) },
          }),
        })
      );
    });
  });

  describe('findAll', () => {
    it('should return all exams', async () => {
      mockPrisma.exam.findMany.mockResolvedValue([{ id: 'e1' }]);
      const result = await service.findAll();
      expect(result).toEqual([{ id: 'e1' }]);
    });

    it('should filter draft for SISWA role', async () => {
      mockPrisma.student.findUnique.mockResolvedValue({ id: 's1', rombelId: 'r1', majorId: 'm1' });
      mockPrisma.exam.findMany.mockResolvedValue([]);
      await service.findAll({ role: 'SISWA', userId: 'u1' });
      expect(mockPrisma.exam.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: { not: 'DRAFT' } }) })
      );
    });
  });

  describe('findOne', () => {
    it('should return null if not found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);
      expect(await service.findOne('bad')).toBeNull();
    });

    it('should return null for SISWA on DRAFT exam', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: 'DRAFT',
        examQuestions: [],
      });
      expect(await service.findOne('e1', { role: 'SISWA', userId: 'u1' })).toBeNull();
    });

    it('should return exam with sorted questions', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', status: 'PUBLISHED', randomizeSoal: false,
        examQuestions: [
          { order: 1, question: { type: 'ESSAY' } },
          { order: 0, question: { type: 'PILIHAN_GANDA' } },
        ],
      });
      const result = await service.findOne('e1');
      // Non-essay first, then essay
      expect(result!.examQuestions[0].question.type).toBe('PILIHAN_GANDA');
      expect(result!.examQuestions[1].question.type).toBe('ESSAY');
    });
  });

  describe('remove', () => {
    it('should cascade delete exam', async () => {
      mockPrisma.answer.deleteMany.mockResolvedValue({});
      mockPrisma.violation.deleteMany.mockResolvedValue({});
      mockPrisma.examSession.deleteMany.mockResolvedValue({});
      mockPrisma.examQuestion.deleteMany.mockResolvedValue({});
      mockPrisma.exam.delete.mockResolvedValue({ id: 'e1' });
      await service.remove('e1');
      expect(mockPrisma.exam.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
    });
  });

  describe('isSebAllowed', () => {
    it('should allow when SEB not required', () => {
      expect(service.isSebAllowed(false, 'Chrome', '', '', null, null)).toBe(true);
    });

    it('should block non-SEB when required', () => {
      expect(service.isSebAllowed(true, 'Chrome', '', '', null, null)).toBe(false);
    });

    it('should allow SEB browser', () => {
      expect(service.isSebAllowed(true, 'SEB/3.0', '', '', null, null)).toBe(true);
    });

    it('should block wrong config key', () => {
      expect(service.isSebAllowed(false, '', 'wrong', '', 'correct', null)).toBe(false);
    });
  });

  describe('analytics', () => {
    it('should return null if exam not found', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue(null);
      expect(await service.analytics('bad')).toBeNull();
    });

    it('should compute analytics correctly', async () => {
      mockPrisma.exam.findUnique.mockResolvedValue({
        id: 'e1', passingGrade: 70,
        examQuestions: [{ questionId: 'q1', question: { content: 'Q1' } }],
        examSessions: [
          { score: 80, answers: [{ questionId: 'q1', isCorrect: true }] },
          { score: 60, answers: [{ questionId: 'q1', isCorrect: false }] },
        ],
      });
      const result = await service.analytics('e1');
      expect(result!.summary.passed).toBe(1);
      expect(result!.summary.failed).toBe(1);
      expect(result!.summary.average).toBe(70);
    });
  });
});