import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

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
        description: 'Daftar siswa aktif beserta NIS, rombel, jurusan, dan kontak wali.',
        criteria: 'Minimal 1 siswa terdaftar.',
        generateUrl: '/reports/student-master',
      },
      {
        id: 'student-achievement',
        title: 'Prestasi Siswa',
        description: 'Siswa dengan rata-rata nilai tertinggi dan perbandingan antar rombel.',
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
        description: 'Rekap pelanggaran proctoring berdasarkan tipe dan tingkat keparahan.',
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
        description: 'Detail paket langganan, masa berlaku, dan riwayat perpanjangan.',
        criteria: 'Modul premium aktif.',
        generateUrl: '/reports/subscription',
      },
      {
        id: 'revenue',
        title: 'Laporan Pendapatan',
        description: 'Total transaksi, pendapatan bulanan, dan proyeksi berdasarkan langganan aktif.',
        criteria: 'Data transaksi pembayaran tersedia.',
        generateUrl: '/reports/revenue',
      },
    ];
  }

  async getAllReports() {
    const [exam, student, monitoring, operational, premium] =
      await Promise.all([
        this.getExamReports(),
        this.getStudentReports(),
        this.getMonitoringReports(),
        this.getOperationalReports(),
        this.getPremiumReports(),
      ]);
    return { exam, student, monitoring, operational, premium };
  }
}
