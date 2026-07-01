import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { randomBytes } from 'node:crypto';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import { SessionStatus, ExamStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority, NotificationType } from '../notifications/dto/create-notification.dto';

@Injectable()
export class ExamSessionsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ExamSessionsService.name);
  private autoSubmitTimer: NodeJS.Timeout | null = null;
  private readonly unlockAttempts = new Map<string, { count: number; resetAt: number; blockedUntil?: number }>();
  private readonly unlockAttemptWindowMs = 60_000;
  private readonly unlockAttemptBlockMs = 30_000;
  private readonly unlockAttemptLimit = 5;

  private clearUnlockAttemptLimit(sessionId: string) {
    this.unlockAttempts.delete(sessionId);
  }

  private enforceUnlockAttemptLimit(sessionId: string) {
    const now = Date.now();
    const state = this.unlockAttempts.get(sessionId);

    if (!state || now >= state.resetAt) {
      const nextState = { count: 0, resetAt: now + this.unlockAttemptWindowMs };
      this.unlockAttempts.set(sessionId, nextState);
      return;
    }

    if (state.blockedUntil && now < state.blockedUntil) {
      throw new BadRequestException('Terlalu banyak percobaan. Coba lagi beberapa saat.');
    }

    state.count += 1;
    if (state.count > this.unlockAttemptLimit) {
      state.count = 0;
      state.resetAt = now + this.unlockAttemptWindowMs;
      state.blockedUntil = now + this.unlockAttemptBlockMs;
      this.unlockAttempts.set(sessionId, state);
      throw new BadRequestException('Terlalu banyak percobaan. Coba lagi beberapa saat.');
    }

    this.unlockAttempts.set(sessionId, state);
  }

  private readonly TOKEN_EXPIRY_MINUTES = 5;

  private generateTokenHex(): string {
    return randomBytes(3).toString('hex').toUpperCase();
  }

  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => NotificationsService))
    private notificationsService: NotificationsService,
  ) {}

  onModuleInit() {
    this.autoSubmitTimer = setInterval(() => {
      this.autoSubmitExpiredSessions().catch((error) => {
        this.logger.error(`Auto-submit job failed: ${error.message}`, error.stack);
      });
    }, 5 * 60 * 1000);

    void this.autoSubmitExpiredSessions();
  }

  onModuleDestroy() {
    if (this.autoSubmitTimer) {
      clearInterval(this.autoSubmitTimer);
      this.autoSubmitTimer = null;
    }
  }

  private async autoSubmitExpiredSessions() {
    const now = new Date();
    const expiredSessions = await this.prisma.examSession.findMany({
      where: {
        status: SessionStatus.IN_PROGRESS,
        OR: [
          // Exam window has closed
          { exam: { endTime: { lte: now } } },
          // Student's individual session duration has expired
          { endTime: { lte: now, not: null } },
        ],
      },
      select: { id: true },
    });

    for (const session of expiredSessions) {
      try {
        await this.finishSession(session.id);
      } catch (error) {
        this.logger.warn(`Auto-submit skipped for session ${session.id}: ${error.message}`);
      }
    }
  }

  async startSession(dto: StartSessionDto, userId: string, userAgent?: string, sebConfigKey?: string, sebBrowserKey?: string) {
    // Get student record
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { rombel: true, major: true },
    });

    if (!student) {
      throw new ForbiddenException('User is not a student');
    }

    // Ownership check: student harus terdaftar minimal di satu rombel atau major
    if (!student.rombelId && !student.majorId) {
      throw new ForbiddenException('Student is not assigned to any class or major');
    }

    // Get exam record
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
    }

    if (!this.isSebAllowed(exam.requireSeb, userAgent || '', sebConfigKey || '', sebBrowserKey || '', exam.sebConfigKey, exam.sebBrowserKey)) {
      throw new ForbiddenException('Safe Exam Browser required');
    }

    // Validate exam status
    if (exam.status !== ExamStatus.PUBLISHED && exam.status !== ExamStatus.ONGOING) {
      throw new BadRequestException('Exam is not available');
    }

    // Validate time
    const now = new Date();
    if (now < exam.startTime || now > exam.endTime) {
      throw new BadRequestException('Exam is outside of scheduled time');
    }

    if (exam.token && dto.token?.trim() !== exam.token.trim()) {
      throw new BadRequestException('Token ujian tidak valid');
    }

    const existingSession = await this.prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId: dto.examId,
          studentId: student.id,
        },
      },
      include: { answers: true },
    });

    if (existingSession) {
      if (existingSession.status === SessionStatus.SUBMITTED || existingSession.status === SessionStatus.FINISHED) {
        throw new BadRequestException('You have already submitted this exam');
      }
      // Re-fetch with exam included so frontend can read duration
      return this.prisma.examSession.findUnique({
        where: { id: existingSession.id },
        include: { answers: true, exam: true },
      });
    }

    // Enforce maxAttempts limit
    if (exam.maxAttempts !== undefined && exam.maxAttempts > 0) {
      const completedSessions = await this.prisma.examSession.count({
        where: {
          examId: dto.examId,
          studentId: student.id,
          status: { in: [SessionStatus.SUBMITTED, SessionStatus.FINISHED] },
        },
      });

      if (completedSessions >= exam.maxAttempts) {
        throw new BadRequestException(`You have reached the maximum attempts (${exam.maxAttempts}) for this exam`);
      }
    }

    const attendance = await this.prisma.examAttendance.findUnique({
      where: {
        examId_studentId: {
          examId: dto.examId,
          studentId: student.id,
        },
      },
    });

    if (!attendance) {
      throw new ForbiddenException('Student must check in before starting exam');
    }

    // Create new session
    // endTime for the session = start time + exam duration (minutes)
    // This ensures each student gets the full duration from when THEY started,
    // not from when the exam window opened.
    const sessionEndTime = new Date(now.getTime() + exam.duration * 60 * 1000);

    return this.prisma.examSession.create({
      data: {
        examId: dto.examId,
        studentId: student.id,
        startTime: now,
        endTime: sessionEndTime,
        status: SessionStatus.IN_PROGRESS,
      },
      include: { answers: true, exam: true },
    });
  }

  async getActiveSessionByExam(examId: string, userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!student) {
      throw new ForbiddenException('User is not a student');
    }

    return this.prisma.examSession.findUnique({
      where: {
        examId_studentId: {
          examId,
          studentId: student.id,
        },
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });
  }

  async submitAnswer(sessionId: string, dto: SubmitAnswerDto) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.examSession.findUnique({
        where: { id: sessionId },
        include: { exam: true },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      if (session.status !== SessionStatus.IN_PROGRESS) {
        if (session.status === SessionStatus.LOCKED) {
          throw new BadRequestException('Session is locked by proctor');
        }
        throw new BadRequestException('Session is not in progress');
      }

      // Validate if question belongs to exam
      const examQuestion = await tx.examQuestion.findUnique({
        where: {
          examId_questionId: {
            examId: session.examId,
            questionId: dto.questionId,
          },
        },
        include: { question: { include: { options: true } } },
      });

      if (!examQuestion) {
        throw new BadRequestException('Question does not belong to this exam');
      }

      // Validate selectedOptionId belongs to question
      if (dto.selectedOptionId) {
        const optionExists = examQuestion.question.options.some(
          (opt) => opt.id === dto.selectedOptionId,
        );
        if (!optionExists) {
          throw new BadRequestException('Selected option does not belong to this question');
        }
      }

      // Save or update answer
      return tx.answer.upsert({
        where: {
          examSessionId_questionId: {
            examSessionId: sessionId,
            questionId: dto.questionId,
          },
        },
        update: {
          selectedOption: dto.selectedOptionId,
          essayAnswer: dto.essayAnswer,
          fileUrl: dto.fileUrl,
        },
        create: {
          examSessionId: sessionId,
          questionId: dto.questionId,
          selectedOption: dto.selectedOptionId,
          essayAnswer: dto.essayAnswer,
          fileUrl: dto.fileUrl,
        },
      });
    });
  }

  async finishSession(sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.examSession.findUnique({
        where: { id: sessionId },
        include: {
          exam: true,
          student: { include: { user: true } },
          answers: {
            include: {
              question: {
                include: { options: true },
              },
            },
          },
        },
      });

      if (!session) {
        throw new NotFoundException('Session not found');
      }

      if (session.status !== SessionStatus.IN_PROGRESS && session.status !== SessionStatus.LOCKED) {
        throw new BadRequestException('Session is not in progress or locked');
      }

      let totalScore = 0;
      const gradedAnswers = session.answers.map((answer) => {
        let isCorrect = false;
        let score = 0;

        if (answer.question.type === 'PILIHAN_GANDA' || answer.question.type === 'BENAR_SALAH') {
          const correctOption = answer.question.options.find((opt) => opt.isCorrect);
          if (correctOption && correctOption.id === answer.selectedOption) {
            isCorrect = true;
            score = answer.question.points;
          }
        } else if (answer.question.type === 'MULTIPLE_RESPONSE') {
          const correctOptionIds = answer.question.options
            .filter((opt) => opt.isCorrect)
            .map((opt) => opt.id)
            .sort();
          const selectedOptionIds = answer.selectedOption ? answer.selectedOption.split(',').sort() : [];
          if (JSON.stringify(correctOptionIds) === JSON.stringify(selectedOptionIds)) {
            isCorrect = true;
            score = answer.question.points;
          }
        }

        totalScore += score;
        return { id: answer.id, isCorrect, score };
      });

      for (const graded of gradedAnswers) {
        await tx.answer.update({
          where: { id: graded.id },
          data: { isCorrect: graded.isCorrect, score: graded.score },
        });
      }

      const updatedSession = await tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.SUBMITTED,
          endTime: new Date(),
          score: totalScore,
        },
      });

      await this.notificationsService.create({
        type: NotificationType.EXAM_SUBMITTED,
        priority: NotificationPriority.NORMAL,
        title: 'Ujian selesai',
        message: `Siswa ${session.student.user.fullName} menyelesaikan ujian ${session.exam.title}`,
        referenceId: updatedSession.id,
        referenceType: 'exam_session',
        targets: [
          { type: 'ROLE' as any, id: 'GURU' },
          { type: 'ROLE' as any, id: 'SUPER_ADMIN' },
        ],
      }, session.student.userId);

      return {
        ...updatedSession,
        score: session.exam.showScore ? updatedSession.score : null,
      };
    });
  }

  async gradeAnswer(answerId: string, dto: GradeAnswerDto) {
    const answerRecord = await this.prisma.answer.findUnique({
      where: { id: answerId },
      include: { question: true },
    });

    if (!answerRecord) {
      throw new NotFoundException('Jawaban tidak ditemukan');
    }

    if (dto.score > answerRecord.question.points) {
      throw new BadRequestException(
        `Skor (${dto.score}) melebihi batas maksimum poin untuk pertanyaan ini (${answerRecord.question.points} poin).`
      );
    }

    const answer = await this.prisma.answer.update({
      where: { id: answerId },
      data: {
        score: dto.score,
        isCorrect: dto.score > 0, // Simplified: any score > 0 is correct-ish
        isGraded: true,
      },
      include: {
        examSession: true,
      },
    });

    // Recalculate total session score
    const allAnswers = await this.prisma.answer.findMany({
      where: { examSessionId: answer.examSessionId },
    });

    const totalScore = allAnswers.reduce((sum, ans) => sum + (ans.score || 0), 0);

    await this.prisma.examSession.update({
      where: { id: answer.examSessionId },
      data: { score: totalScore },
    });

    return answer;
  }

  async getEssayAnswersByExam(examId: string) {
    return this.prisma.answer.findMany({
      where: {
        examSession: { examId },
        question: { type: 'ESSAY' },
      },
      include: {
        examSession: {
          include: {
            student: {
              include: {
                user: {
                  select: {
                    fullName: true,
                    username: true,
                  },
                },
              },
            },
          },
        },
        question: {
          select: {
            content: true,
            points: true,
          },
        },
      },
      orderBy: {
        examSession: {
          student: {
            user: {
              fullName: 'asc',
            },
          },
        },
      },
    });
  }

  async gradeEssayAnswer(answerId: string, dto: GradeAnswerDto) {
    return this.gradeAnswer(answerId, dto);
  }

  async getExamSessions(examId: string) {
    return this.prisma.examSession.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: true,
            rombel: true,
          },
        },
        answers: {
          select: { questionId: true }, // lightweight — need questionId to track uniqueness
        },
        violations: {
          select: { id: true, type: true, description: true, timestamp: true },
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: {
        startTime: 'desc',
      },
    });
  }

  async getSession(sessionId: string) {
    return this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: {
        exam: {
          include: {
            subject: true,
          }
        },
        student: {
          include: {
            user: true,
          }
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              }
            },
          }
        },
      },
    });
  }

  async getMySession(sessionId: string, userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const session = await this.prisma.examSession.findFirst({
      where: {
        id: sessionId,
        studentId: student.id,
      },
      include: {
        exam: {
          include: {
            subject: true,
          },
        },
        student: {
          include: {
            user: true,
          },
        },
        answers: {
          include: {
            question: {
              include: {
                options: true,
              },
            },
          },
        },
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return {
      ...session,
      score: session.exam.showScore ? session.score : null,
    };
  }

  async getMyHistory(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const history = await this.prisma.examSession.findMany({
      where: {
        studentId: student.id,
        status: {
          in: [SessionStatus.SUBMITTED, SessionStatus.FINISHED, SessionStatus.LOCKED]
        }
      },
      include: {
        exam: {
          include: {
            subject: true,
          }
        },
        _count: {
          select: {
            answers: true,
          }
        }
      },
      orderBy: {
        endTime: 'desc',
      },
    });

    return history.map(session => ({
      ...session,
      score: session.exam.showScore ? session.score : null,
    }));
  }

  async getMonitoringHistory(startDate?: string, endDate?: string) {
    const from = startDate ? new Date(startDate) : undefined;
    const to = endDate ? new Date(endDate) : undefined;

    return this.prisma.examSession.findMany({
      where: {
        status: { in: [SessionStatus.SUBMITTED, SessionStatus.FINISHED, SessionStatus.LOCKED] },
        exam: {
          startTime: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        },
      },
      include: {
        exam: { include: { subject: true } },
        student: { include: { user: true, rombel: true } },
        answers: { select: { id: true } },
        violations: { select: { id: true, type: true, description: true, timestamp: true }, orderBy: { timestamp: 'desc' } },
      },
      orderBy: { endTime: 'desc' },
    });
  }

  async getUpcomingMonitoring(startDate?: string, endDate?: string) {
    const from = startDate ? new Date(startDate) : undefined;
    const to = endDate ? new Date(endDate) : undefined;

    return this.prisma.exam.findMany({
      where: {
        startTime: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
        OR: [
          { status: ExamStatus.PUBLISHED },
          { status: ExamStatus.ONGOING },
        ],
      },
      include: {
        subject: true,
        _count: { select: { examSessions: true } },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async exportToExcel(examId: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: true },
    });

    if (!exam) throw new NotFoundException('Exam not found');

    const sessions = await this.getExamSessions(examId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Results');

    worksheet.columns = [
      { header: 'No', key: 'no', width: 5 },
      { header: 'Full Name', key: 'fullName', width: 30 },
      { header: 'Username', key: 'username', width: 20 },
      { header: 'NISN', key: 'nisn', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Time Spent (Mins)', key: 'timeSpent', width: 20 },
    ];

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    sessions.forEach((session, index) => {
      const start = session.startTime ? new Date(session.startTime) : null;
      const end = session.endTime ? new Date(session.endTime) : null;
      const timeSpent = (start && end) ? Math.round((end.getTime() - start.getTime()) / 60000) : '-';

      worksheet.addRow({
        no: index + 1,
        fullName: session.student.user.fullName,
        username: session.student.user.username,
        nisn: session.student.nis,
        status: session.status,
        score: session.score ?? 0,
        timeSpent,
      });
    });

    return workbook.xlsx.writeBuffer();
  }

  async resetSession(sessionId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    return this.prisma.examSession.delete({
      where: { id: sessionId },
    });
  }

  async bulkResetSessions(sessionIds: string[]) {
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
      throw new BadRequestException('Session IDs must be a non-empty array');
    }

    return this.prisma.examSession.deleteMany({
      where: {
        id: {
          in: sessionIds,
        },
      },
    });
  }

  // ─── Auto-Lock & Token Methods ──────────────────────────────────────────────

  async recordViolation(sessionId: string) {
    return this.prisma.$transaction(async (tx) => {
      const session = await tx.examSession.update({
        where: { id: sessionId },
        data: { violationCount: { increment: 1 } },
        include: { exam: true },
      });

      const maxViolations = session.exam.maxViolations;
      const autoLockEnabled = session.exam.autoLockEnabled;
      const didLock =
        maxViolations > 0 &&
        autoLockEnabled !== false &&
        session.violationCount >= maxViolations &&
        session.status === SessionStatus.IN_PROGRESS;

      if (!didLock) {
        return { locked: false };
      }

      const tokenState = await tx.lockTokenState.findUnique({
        where: { id: 'global' },
      });

      const now = new Date();
      let token: string;
      let expiresAt: Date;

      if (tokenState && tokenState.token && tokenState.tokenExpiresAt && tokenState.tokenExpiresAt > now) {
        token = tokenState.token;
        expiresAt = tokenState.tokenExpiresAt;
      } else {
        token = this.generateTokenHex();
        expiresAt = new Date(now.getTime() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

        await tx.lockTokenState.upsert({
          where: { id: 'global' },
          create: { id: 'global', token, tokenExpiresAt: expiresAt },
          update: { token, tokenExpiresAt: expiresAt },
        });
      }

      await tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.LOCKED,
          lockedCount: { increment: 1 },
        },
      });

      return {
        locked: true,
        lockToken: token,
        lockTokenExpiresAt: expiresAt,
      };
    });
  }

  async lockSession(sessionId: string) {
    return this.recordViolation(sessionId);
  }

  async unlockWithToken(sessionId: string, token: string) {
    this.enforceUnlockAttemptLimit(sessionId);

    const tokenState = await this.prisma.lockTokenState.findUnique({
      where: { id: 'global' },
    });

    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      this.clearUnlockAttemptLimit(sessionId);
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.LOCKED) {
      this.clearUnlockAttemptLimit(sessionId);
      throw new BadRequestException('Sesi tidak dalam status terkunci');
    }

    if (!tokenState || !tokenState.token) {
      throw new BadRequestException('Token tidak tersedia, minta token baru ke proktor');
    }

    if (tokenState.token !== token.toUpperCase()) {
      throw new BadRequestException('Token salah');
    }

    if (!tokenState.tokenExpiresAt || tokenState.tokenExpiresAt < new Date()) {
      throw new BadRequestException('Token kedaluwarsa, minta token baru ke proktor');
    }

    await this.prisma.examSession.update({
      where: { id: sessionId },
      data: {
        status: SessionStatus.IN_PROGRESS,
        violationCount: 0,
      },
    });

    this.clearUnlockAttemptLimit(sessionId);

    return { unlocked: true };
  }

  async generateLockToken() {
    const now = new Date();
    const tokenState = await this.prisma.lockTokenState.findUnique({
      where: { id: 'global' },
    });

    if (tokenState && tokenState.token && tokenState.tokenExpiresAt && tokenState.tokenExpiresAt > now) {
      return { lockToken: tokenState.token, lockTokenExpiresAt: tokenState.tokenExpiresAt };
    }

    const token = this.generateTokenHex();
    const expiresAt = new Date(now.getTime() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

    const saved = await this.prisma.lockTokenState.upsert({
      where: { id: 'global' },
      create: { id: 'global', token, tokenExpiresAt: expiresAt },
      update: { token, tokenExpiresAt: expiresAt },
    });

    return { lockToken: saved.token, lockTokenExpiresAt: saved.tokenExpiresAt };
  }

  async getLockInfo() {
    const tokenState = await this.generateLockToken();

    const lockedSessions = await this.prisma.examSession.findMany({
      where: { status: SessionStatus.LOCKED },
      select: { id: true, studentId: true, lockedCount: true, violationCount: true },
    });

    return {
      lockToken: tokenState.lockToken ?? null,
      lockTokenExpiresAt: tokenState.lockTokenExpiresAt ?? null,
      lockedSessions,
    };
  }

  async refreshUnlockRateLimit(sessionId: string) {
    this.clearUnlockAttemptLimit(sessionId);
  }

  isSebAllowed(
    requireSeb: boolean,
    userAgent: string,
    sebConfigKey: string,
    sebBrowserKey: string,
    expectedSebConfigKey?: string | null,
    expectedSebBrowserKey?: string | null,
  ) {
    if (requireSeb) {
      const ua = (userAgent || '').toLowerCase();
      if (!ua.includes('seb') && !ua.includes('safeexambrowser')) {
        return false;
      }
    }

    if (expectedSebConfigKey && expectedSebConfigKey !== sebConfigKey) {
      return false;
    }
    if (expectedSebBrowserKey && expectedSebBrowserKey !== sebBrowserKey) {
      return false;
    }
    return true;
  }
}
