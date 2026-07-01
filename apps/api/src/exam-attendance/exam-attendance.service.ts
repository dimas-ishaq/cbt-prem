import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CheckInDto } from './dto/check-in.dto';

@Injectable()
export class ExamAttendanceService {
  constructor(private prisma: PrismaService) {}

  private parsePayload(qrPayload: string) {
    try {
      // ponytail: payload shape must match exam-card-template.tsx QR generation
      return JSON.parse(qrPayload) as { studentId?: string; nis?: string; rombelName?: string };
    } catch {
      throw new BadRequestException('QR payload tidak valid');
    }
  }

  private async getTargetStudentIds(examId: string) {
    const [rombelTargets, majorTargets] = await Promise.all([
      this.prisma.examTargetRombel.findMany({ where: { examId }, select: { rombelId: true } }),
      this.prisma.examTargetMajor.findMany({ where: { examId }, select: { majorId: true } }),
    ]);

    const rombelIds = rombelTargets.map((t) => t.rombelId);
    const majorIds = majorTargets.map((t) => t.majorId);

    const where =
      rombelIds.length || majorIds.length
        ? {
            OR: [
              ...(rombelIds.length ? [{ rombelId: { in: rombelIds } }] : []),
              ...(majorIds.length ? [{ majorId: { in: majorIds } }] : []),
            ],
          }
        : {};

    const students = await this.prisma.student.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true, username: true } },
        rombel: { select: { name: true } },
        major: { select: { name: true } },
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    return students;
  }

  async checkIn(dto: CheckInDto, userId: string) {
    const { examId, qrPayload } = dto;
    const payload = this.parsePayload(qrPayload);

    if (!payload.studentId) {
      throw new BadRequestException('QR payload tidak mengandung studentId');
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, title: true, status: true },
    });
    if (!exam) throw new NotFoundException('Ujian tidak ditemukan');
    if (exam.status === 'DRAFT') throw new BadRequestException('Ujian belum aktif');

    const student = await this.prisma.student.findUnique({
      where: { id: payload.studentId },
      include: {
        user: { select: { fullName: true } },
        rombel: { select: { name: true } },
        major: { select: { name: true } },
      },
    });
    if (!student) throw new NotFoundException('Siswa tidak ditemukan');

    const targetStudentIds = await this.getTargetStudentIds(examId);
    if (!targetStudentIds.find((s) => s.id === student.id)) {
      throw new BadRequestException('Siswa tidak terdaftar di ujian ini');
    }

    const existing = await this.prisma.examAttendance.findUnique({
      where: { examId_studentId: { examId, studentId: student.id } },
    });
    if (existing) throw new ConflictException('Siswa sudah check-in');

    const attendance = await this.prisma.examAttendance.create({
      data: {
        examId,
        studentId: student.id,
        checkedInBy: userId,
        qrPayload,
      },
    });

    return {
      success: true,
      message: 'Check-in berhasil',
      attendance: {
        id: attendance.id,
        studentId: student.id,
        studentName: student.user.fullName,
        nis: student.nis,
        status: attendance.status,
        checkedInAt: attendance.checkedInAt,
      },
    };
  }

  async getAttendanceByExam(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      select: { id: true, title: true, status: true },
    });
    if (!exam) throw new NotFoundException('Ujian tidak ditemukan');

    const students = await this.getTargetStudentIds(examId);
    const attendances = await this.prisma.examAttendance.findMany({
      where: { examId },
      select: {
        studentId: true,
        status: true,
        checkedInAt: true,
        checkedInByUser: { select: { fullName: true } },
      },
    });

    const attendanceMap = new Map(attendances.map((a) => [a.studentId, a]));

    return {
      exam: { id: exam.id, title: exam.title, status: exam.status },
      totalStudents: students.length,
      checkedInCount: attendances.length,
      students: students.map((s) => ({
        id: s.id,
        nis: s.nis,
        fullName: s.user.fullName,
        username: s.user.username,
        rombel: s.rombel?.name ?? '-',
        major: s.major?.name ?? '-',
        attendance: attendanceMap.get(s.id) ?? null,
      })),
    };
  }

  async getCheckinHistory(examId: string) {
    return this.prisma.examAttendance.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, username: true } },
            rombel: { select: { name: true } },
            major: { select: { name: true } },
          },
        },
        checkedInByUser: { select: { fullName: true } },
      },
      orderBy: { checkedInAt: 'desc' },
    });
  }
}
