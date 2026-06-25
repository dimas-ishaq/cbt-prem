import { Test, TestingModule } from '@nestjs/testing';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Role } from '@prisma/client';

describe('ExamsController', () => {
  let controller: ExamsController;
  const examsServiceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    validateSeb: jest.fn(),
    analytics: jest.fn(),
    generatePdf: jest.fn(),
    prisma: {
      teacher: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamsController],
      providers: [{ provide: ExamsService, useValue: examsServiceMock }],
    }).compile();

    controller = module.get<ExamsController>(ExamsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('creates exam for teacher user', async () => {
    examsServiceMock.prisma.teacher.findUnique.mockResolvedValue({ id: 'teacher-1' });
    examsServiceMock.create.mockResolvedValue({ id: 'exam-1' });

    const dto = { title: 'UTS', questionIds: ['q1'], rombelIds: ['r1'], majorIds: ['m1'] };
    const req = { user: { userId: 'user-1', role: Role.GURU } };

    await expect(controller.create(dto as any, req)).resolves.toEqual({ id: 'exam-1' });
    expect(examsServiceMock.create).toHaveBeenCalledWith(dto, 'teacher-1');
  });

  it('falls back to first teacher for super admin', async () => {
    examsServiceMock.prisma.teacher.findUnique.mockResolvedValue(null);
    examsServiceMock.prisma.teacher.findFirst.mockResolvedValue({ id: 'teacher-9' });
    examsServiceMock.create.mockResolvedValue({ id: 'exam-9' });

    const dto = { title: 'UTS', questionIds: ['q1'], rombelIds: ['r1'], majorIds: ['m1'] };
    const req = { user: { userId: 'admin-1', role: Role.SUPER_ADMIN } };

    await expect(controller.create(dto as any, req)).resolves.toEqual({ id: 'exam-9' });
    expect(examsServiceMock.create).toHaveBeenCalledWith(dto, 'teacher-9');
  });
});
