import { Test } from '@nestjs/testing';
import { ExamAttendanceService } from './exam-attendance.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('ExamAttendanceService', () => {
  const mockStudent = {
    id: 's1',
    nis: '12345',
    userId: 'u1',
    user: { fullName: 'Siswa Satu', username: 'siswa1' },
    rombel: { name: 'XII-A' },
    major: { name: 'IPA' },
  };
  const mockExam = { id: 'e1', title: 'UTS', status: 'PUBLISHED' };
  const prisma = {
    examAttendance: {
      findUnique: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
    },
    exam: { findUnique: jest.fn() },
    student: { findUnique: jest.fn(), findMany: jest.fn() },
    examTargetRombel: { findMany: jest.fn() },
    examTargetMajor: { findMany: jest.fn() },
  } as any;
  let service: ExamAttendanceService;

  beforeAll(async () => {
    const mod = await Test.createTestingModule({
      providers: [
        ExamAttendanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = mod.get(ExamAttendanceService);
  });

  beforeEach(() => jest.clearAllMocks());

  describe('checkIn', () => {
    it('accepts valid QR payload and creates attendance', async () => {
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.examTargetRombel.findMany.mockResolvedValue([{ rombelId: 'r1' }]);
      prisma.examTargetMajor.findMany.mockResolvedValue([]);
      prisma.examAttendance.findUnique.mockResolvedValue(null);
      prisma.examAttendance.create.mockResolvedValue({
        id: 'a1',
        studentId: 's1',
        checkedInBy: 'u2',
        qrPayload: '{}',
        status: 'HADIR',
        checkedInAt: new Date(),
      });

      const result = await service.checkIn(
        { examId: 'e1', qrPayload: '{"studentId":"s1"}' },
        'u2',
      );
      expect(result.success).toBe(true);
      expect(result.attendance.studentName).toBe('Siswa Satu');
    });

    it('rejects invalid QR payload', async () => {
      await expect(
        service.checkIn({ examId: 'e1', qrPayload: 'not-json' }, 'u2'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects QR without studentId', async () => {
      await expect(
        service.checkIn({ examId: 'e1', qrPayload: '{"other":"x"}' }, 'u2'),
      ).rejects.toThrow('tidak mengandung studentId');
    });

    it('rejects nonexistent exam', async () => {
      prisma.exam.findUnique.mockResolvedValue(null);
      await expect(
        service.checkIn(
          { examId: 'e1', qrPayload: '{"studentId":"s1"}' },
          'u2',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects DRAFT exam', async () => {
      prisma.exam.findUnique.mockResolvedValue({
        ...mockExam,
        status: 'DRAFT',
      });
      await expect(
        service.checkIn(
          { examId: 'e1', qrPayload: '{"studentId":"s1"}' },
          'u2',
        ),
      ).rejects.toThrow('belum aktif');
    });

    it('rejects nonexistent student', async () => {
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.student.findUnique.mockResolvedValue(null);
      await expect(
        service.checkIn(
          { examId: 'e1', qrPayload: '{"studentId":"s1"}' },
          'u2',
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rejects student not targeted by exam', async () => {
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.findMany.mockResolvedValue([
        { ...mockStudent, id: 'other-s1' },
      ]);
      prisma.examTargetRombel.findMany.mockResolvedValue([
        { rombelId: 'other-rombel' },
      ]);
      prisma.examTargetMajor.findMany.mockResolvedValue([]);
      await expect(
        service.checkIn(
          { examId: 'e1', qrPayload: '{"studentId":"s1"}' },
          'u2',
        ),
      ).rejects.toThrow('tidak terdaftar');
    });

    it('rejects duplicate check-in', async () => {
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.student.findUnique.mockResolvedValue(mockStudent);
      prisma.student.findMany.mockResolvedValue([mockStudent]);
      prisma.examTargetRombel.findMany.mockResolvedValue([{ rombelId: 'r1' }]);
      prisma.examTargetMajor.findMany.mockResolvedValue([]);
      prisma.examTargetMajor.findMany.mockResolvedValue([]);
      prisma.examAttendance.findUnique.mockResolvedValue({ id: 'a1' });
      await expect(
        service.checkIn(
          { examId: 'e1', qrPayload: '{"studentId":"s1"}' },
          'u2',
        ),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAttendanceByExam', () => {
    it('returns attendance list with status', async () => {
      prisma.exam.findUnique.mockResolvedValue(mockExam);
      prisma.examTargetRombel.findMany.mockResolvedValue([{ rombelId: 'r1' }]);
      prisma.examTargetMajor.findMany.mockResolvedValue([]);
      prisma.student.findMany.mockResolvedValue([
        {
          id: 's1',
          nis: '123',
          user: { fullName: 'A', username: 'a' },
          rombel: { name: 'XII-A' },
          major: { name: 'IPA' },
        },
        {
          id: 's2',
          nis: '456',
          user: { fullName: 'B', username: 'b' },
          rombel: { name: 'XII-A' },
          major: { name: 'IPA' },
        },
      ]);
      prisma.examAttendance.findMany.mockResolvedValue([
        {
          studentId: 's1',
          status: 'HADIR',
          checkedInAt: new Date(),
          checkedInByUser: { fullName: 'Guru' },
        },
      ]);

      const result = await service.getAttendanceByExam('e1');
      expect(result.totalStudents).toBe(2);
      expect(result.checkedInCount).toBe(1);
      expect(result.students[0].attendance).toBeTruthy();
      expect(result.students[1].attendance).toBeNull();
    });

    it('rejects nonexistent exam', async () => {
      prisma.exam.findUnique.mockResolvedValue(null);
      await expect(service.getAttendanceByExam('e1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
