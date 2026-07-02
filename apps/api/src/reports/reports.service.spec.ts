import { Test } from '@nestjs/testing';
import { ReportsService } from './reports.service';
import { PrismaService } from '../prisma/prisma.service';

function mockRes() {
  const res: any = {};
  res.setHeader = jest.fn().mockReturnValue(res);
  res.end = jest.fn().mockReturnValue(res);
  return res;
}

describe('ReportsService', () => {
  const prisma = {
    exam: { findMany: jest.fn() },
    student: { count: jest.fn(), findMany: jest.fn() },
    violation: { count: jest.fn(), findMany: jest.fn() },
    auditLog: { count: jest.fn(), findMany: jest.fn() },
    roleAuditLog: { findMany: jest.fn() },
    examSession: { count: jest.fn(), findMany: jest.fn() },
  };

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

  describe('exportStudentMasterToExcel', () => {
    it('calls prisma.student.findMany and writes workbook', async () => {
      prisma.student.findMany.mockResolvedValue([
        {
          id: 's1',
          nis: '123',
          rombelId: 'r1',
          majorId: 'm1',
          user: { id: 'u1', fullName: 'Siswa A', username: 'siswa1', email: 'siswa1@test.com', isActive: true },
          rombel: { id: 'r1', name: 'X-A', major: { id: 'm1', name: 'IPA' } },
          major: { id: 'm1', name: 'IPA' },
        },
      ]);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportStudentMasterToExcel(res);
      expect(prisma.student.findMany).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', expect.stringContaining('spreadsheetml'));
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('exportAchievementToExcel', () => {
    it('writes empty workbook when no submitted sessions', async () => {
      prisma.examSession.count.mockResolvedValue(0);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportAchievementToExcel(res);
      expect(prisma.examSession.findMany).not.toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('queries examSession and builds workbook', async () => {
      prisma.examSession.count.mockResolvedValue(2);
      prisma.examSession.findMany.mockResolvedValue([
        {
          id: 'es1',
          examId: 'e1',
          studentId: 's1',
          score: 85,
          status: 'SUBMITTED',
          startTime: new Date(),
          endTime: new Date(),
          submittedAt: new Date(),
          exam: { id: 'e1', title: 'UTS', subject: { name: 'Mat' } },
          student: {
            id: 's1',
            nis: '123',
            user: { id: 'u1', fullName: 'Siswa A', username: 'siswa1', email: 'a@a.com', isActive: true },
            rombel: { id: 'r1', name: 'X-A', major: { id: 'm1', name: 'IPA' } },
            major: { id: 'm1', name: 'IPA' },
          },
        },
      ]);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportAchievementToExcel(res);
      expect(prisma.examSession.findMany).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('exportViolationsToExcel', () => {
    it('writes empty workbook when no violations', async () => {
      prisma.violation.findMany.mockResolvedValue([]);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportViolationsToExcel(res);
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('queries violations and builds workbook', async () => {
      prisma.violation.findMany.mockResolvedValue([
        {
          id: 'v1',
          examSessionId: 'es1',
          level: 'RINGAN',
          type: 'TAB_SWITCH',
          description: 'Pindah tab',
          timestamp: new Date(),
          examSession: {
            id: 'es1',
            student: {
              id: 's1',
              nis: '123',
              user: { fullName: 'Siswa A' },
              rombel: { name: 'X-A' },
              major: { name: 'IPA' },
            },
            exam: {
              title: 'UTS',
              subject: { name: 'Mat' },
            },
          },
        },
      ]);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportViolationsToExcel(res);
      expect(prisma.violation.findMany).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('exportUserAuditToExcel', () => {
    it('writes empty workbook when no audit logs', async () => {
      prisma.auditLog.findMany.mockResolvedValue([]);
      prisma.roleAuditLog.findMany.mockResolvedValue([]);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportUserAuditToExcel(res);
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('queries auditLog and roleAuditLog', async () => {
      prisma.auditLog.findMany.mockResolvedValue([
        {
          id: 'al1',
          userId: 'u1',
          action: 'LOGIN',
          resource: 'auth',
          resourceId: null,
          ip: '::1',
          userAgent: 'Chrome',
          createdAt: new Date(),
          user: { fullName: 'User A', role: 'SUPER_ADMIN' },
        },
      ]);
      prisma.roleAuditLog.findMany.mockResolvedValue([
        {
          id: 'ral1',
          actorId: 'actor1',
          actionType: 'ROLE_CHANGE',
          roleId: 'r1',
          ipAddress: '::1',
          userAgent: 'Chrome',
          createdAt: new Date(),
        },
      ]);

      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportUserAuditToExcel(res);
      expect(prisma.auditLog.findMany).toHaveBeenCalled();
      expect(prisma.roleAuditLog.findMany).toHaveBeenCalled();
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });
  });

  describe('stub exports', () => {
    it('exportSubscriptionToExcel returns empty workbook', async () => {
      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportSubscriptionToExcel(res);
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });

    it('exportRevenueToExcel returns empty workbook', async () => {
      const mod = await Test.createTestingModule({ providers: [ReportsService, { provide: PrismaService, useValue: prisma }] }).compile();
      const service = mod.get(ReportsService);
      const res = mockRes();

      await service.exportRevenueToExcel(res);
      expect(res.setHeader).toHaveBeenCalled();
      expect(res.end).toHaveBeenCalled();
    });
  });
});
