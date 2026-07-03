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

  beforeEach(() => jest.clearAllMocks());

  it('getStats maps avgScore and lists', async () => {
    prisma.student.count.mockResolvedValue(1);
    prisma.exam.count.mockResolvedValue(2);
    prisma.subject.count.mockResolvedValue(3);
    prisma.examSession.aggregate.mockResolvedValue({ _avg: { score: 88 } });
    prisma.exam.findMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'UTS',
        status: 'ONGOING',
        subject: { name: 'Math' },
        _count: { examSessions: 4 },
      },
    ]);
    prisma.violation.findMany.mockResolvedValue([
      {
        id: 'v1',
        type: 'TAB_SWITCH',
        level: 'LOW',
        timestamp: new Date('2025-01-01'),
        examSession: { student: { user: { fullName: 'Siswa Satu' } } },
      },
    ]);

    const mod = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    const service = mod.get(DashboardService);

    const stats = await service.getStats();
    expect(stats).toEqual(
      expect.objectContaining({
        totalStudents: 1,
        activeExams: 2,
        totalSubjects: 3,
        avgScore: 88,
      }),
    );
    expect(stats.recentExams).toHaveLength(1);
    expect(stats.liveAlerts).toHaveLength(1);
  });
});
