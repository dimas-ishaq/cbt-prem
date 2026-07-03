import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import type { Response } from 'express';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly headerStyle: Partial<ExcelJS.Style> = {
    font: { bold: true, color: { argb: 'FFFFFFFF' } },
    fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } },
    alignment: { horizontal: 'center', vertical: 'middle', wrapText: true },
    border: {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    },
  };

  private applyHeaderStyle(sheet: ExcelJS.Worksheet) {
    const headerRow = sheet.getRow(1);
    headerRow.height = 30;
    sheet.columns.forEach((_, colIdx) => {
      const cell = headerRow.getCell(colIdx + 1);
      cell.style = this.headerStyle;
    });
  }

  private async writeWorkbook(
    res: Response,
    workbook: ExcelJS.Workbook,
    filename: string,
  ) {
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    const buffer = await workbook.xlsx.writeBuffer();
    res.end(Buffer.from(buffer));
  }

  private async writeEmptyWorkbook(
    res: Response,
    title: string,
    message: string,
    filename: string,
  ) {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet(title);
    sheet.columns = [{ header: 'Keterangan', key: 'info', width: 60 }];
    this.applyHeaderStyle(sheet);
    sheet.addRow({ info: message });
    await this.writeWorkbook(res, workbook, filename);
  }

  async getExamReports() {
    const completedExams = await this.prisma.exam.findMany({
      where: { status: { in: ['ONGOING', 'COMPLETED'] as any } },
      select: {
        id: true,
        title: true,
        subject: { select: { name: true } },
        _count: { select: { examSessions: true } },
      },
      orderBy: { startTime: 'desc' },
    });
    return completedExams
      .filter((e) => e._count.examSessions > 0)
      .map((e) => ({
        id: `exam-${e.id}`,
        title: `Hasil Ujian: ${e.title}`,
        description: `Nilai rata-rata, distribusi skor, siswa tuntas/gagal pada ujian ${e.title}.`,
        criteria: 'Ujian dengan minimal 1 sesi jawaban.',
        generateUrl: `/exam-sessions/exam/${e.id}/export`,
      }));
  }

  async getStudentReports() {
    const totalStudents = await this.prisma.student.count();
    if (totalStudents === 0) return [];
    return [
      {
        id: 'student-master',
        title: 'Data Master Siswa',
        description:
          'Daftar siswa aktif beserta NIS, rombel, jurusan, dan email.',
        criteria: 'Minimal 1 siswa terdaftar.',
        generateUrl: '/reports/student-master',
      },
      {
        id: 'student-achievement',
        title: 'Prestasi Siswa',
        description:
          'Siswa dengan rata-rata nilai tertinggi dan perbandingan antar rombel.',
        criteria: 'Minimal 1 ujian selesai.',
        generateUrl: '/reports/achievement',
      },
    ];
  }

  async getMonitoringReports() {
    const violations = await this.prisma.violation.count();
    if (violations === 0) return [];
    return [
      {
        id: 'violation-report',
        title: 'Pelanggaran & Anti-Cheat',
        description:
          'Rekap pelanggaran proctoring berdasarkan tipe dan tingkat keparahan.',
        criteria: 'Minimal 1 pelanggaran tercatat.',
        generateUrl: '/reports/violations',
      },
    ];
  }

  async getOperationalReports() {
    const auditLogs = await this.prisma.auditLog.count();
    if (auditLogs === 0) return [];
    return [
      {
        id: 'user-audit',
        title: 'Audit Aktivitas Pengguna',
        description: 'Log aktivitas login, perubahan data, dan akses sistem.',
        criteria: 'Minimal 1 log aktivitas tercatat.',
        generateUrl: '/reports/user-audit',
      },
    ];
  }

  async getPremiumReports() {
    return [
      {
        id: 'subscription',
        title: 'Status Langganan',
        description:
          'Detail paket langganan, masa berlaku, dan riwayat perpanjangan.',
        criteria: 'Modul premium aktif.',
        generateUrl: '/reports/subscription',
      },
      {
        id: 'revenue',
        title: 'Laporan Pendapatan',
        description:
          'Total transaksi, pendapatan bulanan, dan proyeksi berdasarkan langganan aktif.',
        criteria: 'Data transaksi pembayaran tersedia.',
        generateUrl: '/reports/revenue',
      },
    ];
  }

  async getAllReports() {
    const [exam, student, monitoring, operational, premium] = await Promise.all(
      [
        this.getExamReports(),
        this.getStudentReports(),
        this.getMonitoringReports(),
        this.getOperationalReports(),
        this.getPremiumReports(),
      ],
    );
    return { exam, student, monitoring, operational, premium };
  }

  async exportStudentMasterToExcel(res: Response) {
    const students = await this.prisma.student.findMany({
      include: {
        user: true,
        rombel: { include: { major: true } },
        major: true,
      },
      orderBy: { user: { fullName: 'asc' } },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Data Master Siswa');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'fullName', width: 28 },
      { header: 'NIS', key: 'nis', width: 16 },
      { header: 'Username', key: 'username', width: 18 },
      { header: 'Email', key: 'email', width: 24 },
      { header: 'Kelas (Rombel)', key: 'rombel', width: 18 },
      { header: 'Jurusan', key: 'major', width: 18 },
      { header: 'Status Aktif', key: 'isActive', width: 14 },
    ];
    this.applyHeaderStyle(sheet);

    // ponytail: no wali contact field in schema; add when Student model gains guardian fields.
    students.forEach((student, idx) => {
      sheet.addRow({
        no: idx + 1,
        fullName: student.user.fullName,
        nis: student.nis,
        username: student.user.username,
        email: student.user.email,
        rombel: student.rombel?.name ?? '-',
        major: student.major?.name ?? student.rombel?.major?.name ?? '-',
        isActive: student.user.isActive ? 'Aktif' : 'Nonaktif',
      });
    });

    return this.writeWorkbook(res, workbook, 'student-master.xlsx');
  }

  async exportAchievementToExcel(res: Response) {
    const submittedCount = await this.prisma.examSession.count({
      where: { status: { in: ['SUBMITTED', 'FINISHED'] as any } },
    });

    if (submittedCount === 0) {
      return this.writeEmptyWorkbook(
        res,
        'Tidak Ada Data',
        'Belum ada ujian selesai.',
        'achievement.xlsx',
      );
    }

    const sessions = await this.prisma.examSession.findMany({
      where: {
        status: { in: ['SUBMITTED', 'FINISHED'] as any },
        score: { not: null },
      },
      include: {
        student: {
          include: {
            user: true,
            rombel: { include: { major: true } },
            major: true,
          },
        },
        exam: { include: { subject: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const studentMap = new Map<
      string,
      {
        studentId: string;
        fullName: string;
        nis: string;
        rombel: string;
        major: string;
        scores: number[];
      }
    >();

    const rombelMap = new Map<
      string,
      {
        rombel: string;
        major: string;
        students: Set<string>;
        scores: number[];
      }
    >();

    for (const session of sessions) {
      const score = session.score;
      if (score == null) continue;
      const student = session.student;
      const rombelName = student.rombel?.name ?? '-';
      const majorName =
        student.major?.name ?? student.rombel?.major?.name ?? '-';
      const current = studentMap.get(student.id) ?? {
        studentId: student.id,
        fullName: student.user.fullName,
        nis: student.nis,
        rombel: rombelName,
        major: majorName,
        scores: [],
      };
      current.scores.push(score);
      studentMap.set(student.id, current);

      const rombelKey = student.rombel?.id ?? 'unknown';
      const rombelCurrent = rombelMap.get(rombelKey) ?? {
        rombel: rombelName,
        major: majorName,
        students: new Set<string>(),
        scores: [],
      };
      rombelCurrent.students.add(student.id);
      rombelCurrent.scores.push(score);
      rombelMap.set(rombelKey, rombelCurrent);
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Prestasi Siswa');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Nama Lengkap', key: 'fullName', width: 28 },
      { header: 'NIS', key: 'nis', width: 16 },
      { header: 'Kelas', key: 'rombel', width: 18 },
      { header: 'Jurusan', key: 'major', width: 18 },
      { header: 'Jumlah Ujian Dikerjakan', key: 'examCount', width: 16 },
      { header: 'Rata-rata Nilai', key: 'averageScore', width: 16 },
      { header: 'Nilai Tertinggi', key: 'highestScore', width: 16 },
      { header: 'Nilai Terendah', key: 'lowestScore', width: 16 },
    ];
    this.applyHeaderStyle(sheet);

    Array.from(studentMap.values())
      .map((student) => ({
        ...student,
        examCount: student.scores.length,
        averageScore:
          student.scores.reduce((sum, score) => sum + score, 0) /
          student.scores.length,
        highestScore: Math.max(...student.scores),
        lowestScore: Math.min(...student.scores),
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .forEach((student, idx) => {
        sheet.addRow({
          no: idx + 1,
          fullName: student.fullName,
          nis: student.nis,
          rombel: student.rombel,
          major: student.major,
          examCount: student.examCount,
          averageScore: student.averageScore.toFixed(2),
          highestScore: student.highestScore.toFixed(2),
          lowestScore: student.lowestScore.toFixed(2),
        });
      });

    const rombelSheet = workbook.addWorksheet('Perbandingan Antar Rombel');
    rombelSheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Kelas (Rombel)', key: 'rombel', width: 20 },
      { header: 'Jurusan', key: 'major', width: 18 },
      { header: 'Jumlah Siswa', key: 'studentCount', width: 14 },
      { header: 'Rata-rata Kelas', key: 'classAverage', width: 16 },
      { header: 'Nilai Tertinggi', key: 'highestScore', width: 16 },
      { header: 'Nilai Terendah', key: 'lowestScore', width: 16 },
    ];
    this.applyHeaderStyle(rombelSheet);

    Array.from(rombelMap.values())
      .map((item) => ({
        ...item,
        studentCount: item.students.size,
        classAverage:
          item.scores.reduce((sum, score) => sum + score, 0) /
          item.scores.length,
        highestScore: Math.max(...item.scores),
        lowestScore: Math.min(...item.scores),
      }))
      .sort((a, b) => b.classAverage - a.classAverage)
      .forEach((item, idx) => {
        rombelSheet.addRow({
          no: idx + 1,
          rombel: item.rombel,
          major: item.major,
          studentCount: item.studentCount,
          classAverage: item.classAverage.toFixed(2),
          highestScore: item.highestScore.toFixed(2),
          lowestScore: item.lowestScore.toFixed(2),
        });
      });

    return this.writeWorkbook(res, workbook, 'achievement.xlsx');
  }

  async exportViolationsToExcel(res: Response) {
    const violations = await this.prisma.violation.findMany({
      include: {
        examSession: {
          include: {
            student: {
              include: {
                user: true,
                rombel: true,
                major: true,
              },
            },
            exam: {
              include: { subject: true },
            },
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    if (!violations.length) {
      return this.writeEmptyWorkbook(
        res,
        'Tidak Ada Data',
        'Belum ada pelanggaran tercatat.',
        'violations.xlsx',
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Rekap Pelanggaran');
    sheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal/Waktu', key: 'timestamp', width: 20 },
      { header: 'Nama Siswa', key: 'fullName', width: 26 },
      { header: 'NIS', key: 'nis', width: 14 },
      { header: 'Ujian', key: 'examTitle', width: 24 },
      { header: 'Mapel', key: 'subject', width: 16 },
      { header: 'Tipe Pelanggaran', key: 'type', width: 18 },
      { header: 'Level', key: 'level', width: 12 },
      { header: 'Deskripsi', key: 'description', width: 30 },
    ];
    this.applyHeaderStyle(sheet);

    violations.forEach((violation, idx) => {
      const student = violation.examSession.student;
      sheet.addRow({
        no: idx + 1,
        timestamp: violation.timestamp.toLocaleString('id-ID'),
        fullName: student.user.fullName,
        nis: student.nis,
        examTitle: violation.examSession.exam.title,
        subject: violation.examSession.exam.subject?.name ?? '-',
        type: violation.type,
        level: violation.level,
        description: violation.description ?? '-',
      });
    });

    const summarySheet = workbook.addWorksheet('Ringkasan per Tipe');
    summarySheet.columns = [
      { header: 'Tipe Pelanggaran', key: 'type', width: 22 },
      { header: 'Ringan', key: 'ringan', width: 12 },
      { header: 'Sedang', key: 'sedang', width: 12 },
      { header: 'Berat', key: 'berat', width: 12 },
      { header: 'Kritis', key: 'kritis', width: 12 },
      { header: 'Total', key: 'total', width: 10 },
    ];
    this.applyHeaderStyle(summarySheet);

    const levelOrder = ['RINGAN', 'SEDANG', 'BERAT', 'KRITIS'] as const;
    const typeMap = new Map<
      string,
      Record<(typeof levelOrder)[number], number> & { total: number }
    >();
    violations.forEach((violation) => {
      const current = typeMap.get(violation.type) ?? {
        RINGAN: 0,
        SEDANG: 0,
        BERAT: 0,
        KRITIS: 0,
        total: 0,
      };
      current[violation.level as keyof typeof current] =
        (current[violation.level as keyof typeof current] ?? 0) + 1;
      current.total += 1;
      typeMap.set(violation.type, current);
    });

    Array.from(typeMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([type, counts]) => {
        summarySheet.addRow({
          type,
          ringan: counts.RINGAN,
          sedang: counts.SEDANG,
          berat: counts.BERAT,
          kritis: counts.KRITIS,
          total: counts.total,
        });
      });

    return this.writeWorkbook(res, workbook, 'violations.xlsx');
  }

  async exportUserAuditToExcel(res: Response) {
    const [auditLogs, roleAuditLogs] = await Promise.all([
      this.prisma.auditLog.findMany({
        include: {
          user: { select: { fullName: true, username: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.roleAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    if (!auditLogs.length && !roleAuditLogs.length) {
      return this.writeEmptyWorkbook(
        res,
        'Tidak Ada Data',
        'Belum ada log audit tercatat.',
        'user-audit.xlsx',
      );
    }

    const workbook = new ExcelJS.Workbook();
    const userSheet = workbook.addWorksheet('Log Aktivitas User');
    userSheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal/Waktu', key: 'createdAt', width: 20 },
      { header: 'Pengguna', key: 'fullName', width: 24 },
      { header: 'Role', key: 'role', width: 14 },
      { header: 'Aksi', key: 'action', width: 20 },
      { header: 'Resource', key: 'resource', width: 18 },
      { header: 'Resource ID', key: 'resourceId', width: 20 },
      { header: 'IP Address', key: 'ip', width: 16 },
      { header: 'User Agent', key: 'userAgent', width: 32 },
    ];
    this.applyHeaderStyle(userSheet);

    auditLogs.forEach((log, idx) => {
      userSheet.addRow({
        no: idx + 1,
        createdAt: log.createdAt.toLocaleString('id-ID'),
        fullName: log.user?.fullName ?? '-',
        role: log.user?.role ?? '-',
        action: log.action,
        resource: log.resource ?? '-',
        resourceId: log.resourceId ?? '-',
        ip: log.ip ?? '-',
        userAgent: log.userAgent ?? '-',
      });
    });

    const roleSheet = workbook.addWorksheet('Log Perubahan Role');
    roleSheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Tanggal/Waktu', key: 'createdAt', width: 20 },
      { header: 'Actor ID', key: 'actorId', width: 20 },
      { header: 'Aksi', key: 'actionType', width: 20 },
      { header: 'Role ID', key: 'roleId', width: 20 },
      { header: 'IP Address', key: 'ipAddress', width: 16 },
      { header: 'User Agent', key: 'userAgent', width: 32 },
    ];
    this.applyHeaderStyle(roleSheet);

    roleAuditLogs.forEach((log, idx) => {
      roleSheet.addRow({
        no: idx + 1,
        createdAt: log.createdAt.toLocaleString('id-ID'),
        actorId: log.actorId,
        actionType: log.actionType,
        roleId: log.roleId ?? '-',
        ipAddress: log.ipAddress ?? '-',
        userAgent: log.userAgent ?? '-',
      });
    });

    return this.writeWorkbook(res, workbook, 'user-audit.xlsx');
  }

  async exportSubscriptionToExcel(res: Response) {
    return this.writeEmptyWorkbook(
      res,
      'Tidak Ada Data',
      'Modul langganan belum tersedia di schema saat ini.',
      'subscription.xlsx',
    );
  }

  async exportRevenueToExcel(res: Response) {
    return this.writeEmptyWorkbook(
      res,
      'Tidak Ada Data',
      'Modul pendapatan belum tersedia di schema saat ini.',
      'revenue.xlsx',
    );
  }
}
