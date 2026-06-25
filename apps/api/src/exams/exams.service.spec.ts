import { Test, TestingModule } from '@nestjs/testing';
import { ExamsService } from './exams.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamsService', () => {
  let service: ExamsService;
  let prisma: PrismaService;

  const mockPrisma = {
    exam: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExamsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ExamsService>(ExamsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create exam with correct payload', async () => {
    const dto = {
      title: 'Matematika 101',
      description: 'Ujian akhir semester',
      duration: 60,
      questionIds: ['q1', 'q2'],
      rombelIds: ['r1'],
      majorIds: ['m1'],
      startTime: '2026-06-25T08:00:00.000Z',
      endTime: '2026-06-25T09:00:00.000Z',
    };

    const teacherId = 'teacher_123';
    const result = {
      id: 'exam_456',
      ...dto,
      teacherId,
    };

    prisma.exam.create.mockResolvedValue(result);

    await expect(service.create(dto as any, teacherId)).resolves.toEqual(result);

    expect(prisma.exam.create).toHaveBeenCalledWith({
      data: {
        title: 'Matematika 101',
        description: 'Ujian akhir semester',
        duration: 60,
        questionIds: ['q1', 'q2'],
        rombelIds: ['r1'],
        majorIds: ['m1'],
        startTime: new Date('2026-06-25T08:00:00.000Z'),
        endTime: new Date('2026-06-25T09:00:00.000Z'),
        teacherId,
        examQuestions: {
          create: [
            { questionId: 'q1', order: 0 },
            { questionId: 'q2', order: 1 },
          ],
        },
        targetRombels: {
          create: [{ rombelId: 'r1' }],
        },
        targetMajors: {
          create: [{ majorId: 'm1' }],
        },
      },
    });
  });
});