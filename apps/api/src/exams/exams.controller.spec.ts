import { Test, TestingModule } from '@nestjs/testing';
import { ExamsController } from './exams.controller';
import { ExamsService } from './exams.service';
import { Role } from '@prisma/client';

describe('ExamsController', () => {
  let controller: ExamsController;
  const examsServiceMock = {
    create: jest.fn(),
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
    controller = module.get(ExamsController);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(controller).toBeDefined());

  it('creates exam for teacher user', async () => {
    examsServiceMock.prisma.teacher.findUnique.mockResolvedValue({
      id: 'teacher-1',
    });
    examsServiceMock.create.mockResolvedValue({ id: 'exam-1' });
    const dto = { title: 'UTS' };
    const req = { user: { userId: 'user-1', role: Role.GURU } };
    await expect(controller.create(dto as any, req as any)).resolves.toEqual({
      id: 'exam-1',
    });
  });
});
