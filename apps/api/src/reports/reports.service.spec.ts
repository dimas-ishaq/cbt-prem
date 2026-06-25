import { Test, TestingModule } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ReportsService', () => {
  let service: ReportsService;
  const mockPrisma = {
    exam: { findMany: jest.fn() },
    student: { count: jest.fn() },
    violation: { count: jest.fn() },
    auditLog: { count: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get(ReportsService);
    jest.clearAllMocks();
  });

  it('should be defined', () => expect(service).toBeDefined());

  describe('getExamReports', () => {
    it('should return exam reports with sessions > 0', async () => {
      mockPrisma.exam.findMany.mockResolvedValue([
        { id: 'e1', title: 'UTS', subject: { name: 'Math' }, _count: { examSessions: 5 } },
        { id: 'e2', title: 'UAS', subject: { name: 'IPA' }, _count: { examSessions: 0 } },
      ]);
      const result = await service.getExamReports();
      expect(result.length).toBe(1);
      expect(result[0].id).toBe('exam-e1');
    });
  });

  describe('getStudentReports', () => {
    it('should return empty if no students', async () => {
      mockPrisma.student.count.mockResolvedValue(0);
      expect(await service.getStudentReports()).toEqual([]);
    });

    it('should return reports if students exist', async () => {
      mockPrisma.student.count.mockResolvedValue(10);
      const result = await service.getStudentReports();
      expect(result.length).toBe(2);
    });
  });

  describe('getMonitoringReports', () => {
    it('should return empty if no violations', async () => {
      mockPrisma.violation.count.mockResolvedValue(0);
      expect(await service.getMonitoringReports()).toEqual([]);
    });

    it('should return report if violations exist', async () => {
      mockPrisma.violation.count.mockResolvedValue(3);
      const result = await service.getMonitoringReports();
      expect(result.length).toBe(1);
    });
  });

  describe('getOperationalReports', () => {
    it('should return empty if no audit logs', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(0);
      expect(await service.getOperationalReports()).toEqual([]);
    });

    it('should return report if audit logs exist', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(10);
      const result = await service.getOperationalReports();
      expect(result.length).toBe(1);
    });
  });

  describe('getPremiumReports', () => {
    it('should always return premium reports', async () => {
      const result = await service.getPremiumReports();
      expect(result.length).toBe(2);
    });
  });

  describe('getAllReports', () => {
    it('should aggregate all report categories', async () => {
      mockPrisma.exam.findMany.mockResolvedValue([]);
      mockPrisma.student.count.mockResolvedValue(0);
      mockPrisma.violation.count.mockResolvedValue(0);
      mockPrisma.auditLog.count.mockResolvedValue(0);
      const result = await service.getAllReports();
      expect(result).toHaveProperty('exam');
      expect(result).toHaveProperty('student');
      expect(result).toHaveProperty('monitoring');
      expect(result).toHaveProperty('operational');
      expect(result).toHaveProperty('premium');
    });
  });
});
