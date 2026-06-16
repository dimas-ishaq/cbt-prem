import { Controller, Get, UseGuards } from '@nestjs/common';
import { AppService } from './app.service';
import { PrismaService } from './prisma/prisma.service';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly prisma: PrismaService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('server-time')
  getServerTime() {
    return {
      serverTime: new Date().toISOString(),
    };
  }

  @Get('dashboard/stats')
  @UseGuards(JwtAuthGuard)
  async getDashboardStats() {
    const totalStudents = await this.prisma.student.count();
    
    const activeExams = await this.prisma.exam.count({
      where: {
        status: { in: ['PUBLISHED', 'ONGOING'] },
      },
    });

    const totalSubjects = await this.prisma.subject.count();

    const sessions = await this.prisma.examSession.aggregate({
      where: {
        status: { in: ['SUBMITTED', 'FINISHED'] },
        score: { not: null },
      },
      _avg: {
        score: true,
      },
    });
    const avgScore = sessions._avg.score ? parseFloat(sessions._avg.score.toFixed(1)) : 0;

    const recentExams = await this.prisma.exam.findMany({
      take: 5,
      orderBy: { startTime: 'desc' },
      include: {
        subject: { select: { name: true } },
        _count: { select: { examSessions: true } },
      },
    });

    const liveAlerts = await this.prisma.violation.findMany({
      take: 5,
      orderBy: { timestamp: 'desc' },
      include: {
        examSession: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true } },
              },
            },
          },
        },
      },
    });

    return {
      totalStudents,
      activeExams,
      totalSubjects,
      avgScore,
      recentExams: recentExams.map((exam) => ({
        id: exam.id,
        title: exam.title,
        subjectName: exam.subject.name,
        sessionsCount: exam._count.examSessions,
        status: exam.status,
      })),
      liveAlerts: liveAlerts.map((alert) => ({
        id: alert.id,
        studentName: alert.examSession.student.user.fullName,
        type: alert.type,
        timestamp: alert.timestamp,
        level: alert.level,
      })),
    };
  }
}
