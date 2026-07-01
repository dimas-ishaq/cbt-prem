import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  const prisma = {
    exam: { findMany: jest.fn() },
    student: { count: jest.fn() },
    violation: { count: jest.fn() },
    auditLog: { count: jest.fn() },
  } as any;

  beforeEach(() => jest.clearAllMocks());

  it('getAllReports returns structured sections', async () => {
    prisma.exam.findMany.mockResolvedValue([
      { id: 'e1', title: 'UTS', _count: { examSessions: 2 } },
    ]);
    prisma.student.count.mockResolvedValue(10);
    prisma.violation.count.mockResolvedValue(1);
    prisma.auditLog.count.mockResolvedValue(3);

    const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(ReportsService);

    const res = await service.getAllReports();
    expect(res.exam).toHaveLength(1);
    expect(res.student).toHaveLength(2);
    expect(res.monitoring).toHaveLength(1);
    expect(res.operational).toHaveLength(1);
    expect(res.premium).toHaveLength(2);
  });
});
