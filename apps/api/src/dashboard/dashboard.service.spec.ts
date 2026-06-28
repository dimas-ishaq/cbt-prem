import { Test } from '@nestjs/testing';
import { DashboardService } from './dashboard.service';
import { PrismaService } from '../prisma/prisma.service';

describe('DashboardService', () => {
  const prisma = {
    student: { count: jest.fn() },
    exam: { count: jest.fn(), findMany: jest.fn() },
    subject: { count: jest.fn() },
    examSession: { aggregate: jest.fn() },
    violation: { findMany: jest.fn() },
  } as any;

  it('getStats maps avgScore and lists', async () => {
    prisma.student.count.mockResolvedValue(1);
    prisma.exam.count.mockResolvedValue(2);
    prisma.subject.count.mockResolvedValue(3);
    prisma.examSession.aggregate.mockResolvedValue({ _avg: { score: 88 } });
    prisma.exam.findMany.mockResolvedValue([]);
    prisma.violation.findMany.mockResolvedValue([]);

    const mod = await Test.createTestingModule({ providers: [DashboardService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(DashboardService);

    await expect(service.getStats()).resolves.toEqual(expect.objectContaining({ totalStudents: 1, avgScore: 88 }));
  });
});