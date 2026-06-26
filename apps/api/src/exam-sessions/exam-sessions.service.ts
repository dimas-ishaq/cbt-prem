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
    const expiredSessions = await this.prisma.examSession.findMany({
      where: {
        status: SessionStatus.IN_PROGRESS,
        exam: {
          endTime: {
            lte: new Date(),
          },
        },
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
      return existingSession;
    }

    // Create new session
    return this.prisma.examSession.create({
      data: {
        examId: dto.examId,
        studentId: student.id,
        startTime: now,
        status: SessionStatus.IN_PROGRESS,
      },
      include: { answers: true },
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
      });

      if (!examQuestion) {
        throw new BadRequestException('Question does not belong to this exam');
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
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { 
        exam: true,
        student: { include: { user: true } },
        answers: {
          include: {
            question: {
              include: { options: true }
            }
          }
        }
      },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.IN_PROGRESS && session.status !== SessionStatus.LOCKED) {
      throw new BadRequestException('Session is not in progress or locked');
    }

    // Calculate score for multiple choice
    let totalScore = 0;
    const gradedAnswers = session.answers.map(answer => {
      let isCorrect = false;
      let score = 0;

      if (answer.question.type === 'PILIHAN_GANDA' || answer.question.type === 'BENAR_SALAH') {
        const correctOption = answer.question.options.find(opt => opt.isCorrect);
        if (correctOption && correctOption.id === answer.selectedOption) {
          isCorrect = true;
          score = answer.question.points;
        }
      } else if (answer.question.type === 'MULTIPLE_RESPONSE') {
        const correctOptionIds = answer.question.options
          .filter(opt => opt.isCorrect)
          .map(opt => opt.id)
          .sort();
        
        const selectedOptionIds = answer.selectedOption 
          ? answer.selectedOption.split(',').sort() 
          : [];

        if (JSON.stringify(correctOptionIds) === JSON.stringify(selectedOptionIds)) {
          isCorrect = true;
          score = answer.question.points;
        }
      }
      // Note: ESSAY type remains manual grading (isCorrect = null/false, score = 0)
      
      totalScore += score;
      return {
        id: answer.id,
        isCorrect,
        score,
      };
    });

    // Update session status and score
    return this.prisma.$transaction(async (tx) => {
      // Update each answer with its correctness (for auto-gradable ones)
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
        message: `Siswa menyelesaikan ujian ${session.exam.title}`,
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
          select: { id: true }, // lightweight — just need count
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
