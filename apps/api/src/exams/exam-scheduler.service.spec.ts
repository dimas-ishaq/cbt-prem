import { Test } from '@nestjs/testing';
import { ExamSchedulerService } from './exam-scheduler.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ExamSchedulerService', () => {
  const prisma = { exam: { updateMany: jest.fn() } } as any;

  it('handleExamStatusUpdates updates statuses', async () => {
    prisma.exam.updateMany
      .mockResolvedValueOnce({ count: 1 })
      .mockResolvedValueOnce({ count: 0 });

    const mod = await Test.createTestingModule({ providers: [ExamSchedulerService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(ExamSchedulerService);

    await service.handleExamStatusUpdates();
    expect(prisma.exam.updateMany).toHaveBeenCalledTimes(2);
  });
});