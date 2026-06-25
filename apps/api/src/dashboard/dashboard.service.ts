import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    // 1. Total Students
    const totalStudents = await this.prisma.student.count();

    // 2. Active/Ongoing Exams
    const activeExams = await this.prisma.exam.count({
      where: {
        status: 'ONGOING',
      },
    });

    // 3. Total Subjects
    const totalSubjects = await this.prisma.subject.count();

    // 4. Average Score of all finished exam sessions
    const sessionsWithScore = await this.prisma.examSession.aggregate({
      where: {
        status: { in: ['SUBMITTED', 'FINISHED'] },
        score: { not: null },
      },
      _avg: {
        score: true,
      },
    });
    const avgScore = sessionsWithScore._avg.score ? Math.round(sessionsWithScore._avg.score) : 0;

    // 5. Recent Exams
    const recentExamsRaw = await this.prisma.exam.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        subject: {
          select: { name: true },
        },
        _count: {
          select: { examSessions: true },
        },
      },
    });

    const recentExams = recentExamsRaw.map((exam) => ({
      id: exam.id,
      title: exam.title,
      subjectName: exam.subject?.name || 'N/A',
      sessionsCount: exam._count.examSessions,
      status: exam.status,
    }));

    // 6. Live Violation Alerts
    const recentViolations = await this.prisma.violation.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        examSession: {
          include: {
            student: {
              include: {
                user: {
                  select: { fullName: true },
                },
              },
            },
          },
        },
      },
    });

    const liveAlerts = recentViolations.map((v) => ({
      id: v.id,
      studentName: v.examSession?.student?.user?.fullName || 'Siswa',
      type: v.type,
      timestamp: v.timestamp.toISOString(),
      level: v.level,
    }));

    return {
      totalStudents,
      activeExams,
      totalSubjects,
      avgScore,
      recentExams,
      liveAlerts,
    };
  }
}
