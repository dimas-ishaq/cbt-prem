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

  it('getAllReports returns empty sections', async () => {
    prisma.exam.findMany.mockResolvedValue([]);
    prisma.student.count.mockResolvedValue(0);
    prisma.violation.count.mockResolvedValue(0);
    prisma.auditLog.count.mockResolvedValue(0);
    const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
    const service = mod.get(ReportsService);

    const res = await service.getAllReports();
    expect(res.exam).toEqual([]);
    expect(res.student).toEqual([]);
    expect(res.monitoring).toEqual([]);
    expect(res.operational).toEqual([]);
    expect(res.premium).toHaveLength(2);
  });
});