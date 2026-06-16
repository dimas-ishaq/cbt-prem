import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StartSessionDto } from './dto/start-session.dto';
import { SubmitAnswerDto } from './dto/submit-answer.dto';
import { GradeAnswerDto } from './dto/grade-answer.dto';
import { SessionStatus, ExamStatus } from '@prisma/client';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExamSessionsService {
  constructor(private prisma: PrismaService) {}

  async startSession(dto: StartSessionDto, userId: string) {
    // Get student record
    const student = await this.prisma.student.findUnique({
      where: { userId },
    });

    if (!student) {
      throw new ForbiddenException('User is not a student');
    }

    // Get exam record
    const exam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
    });

    if (!exam) {
      throw new NotFoundException('Exam not found');
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

    // Validate token
    if (exam.token && exam.token !== dto.token) {
      throw new BadRequestException('Invalid exam token');
    }


    // Check for existing session
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
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { exam: true },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
    }

    // Validate if question belongs to exam
    const examQuestion = await this.prisma.examQuestion.findUnique({
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
    return this.prisma.answer.upsert({
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
  }

  async finishSession(sessionId: string) {
    const session = await this.prisma.examSession.findUnique({
      where: { id: sessionId },
      include: { 
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

    if (session.status !== SessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Session is not in progress');
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

      return tx.examSession.update({
        where: { id: sessionId },
        data: {
          status: SessionStatus.SUBMITTED,
          endTime: new Date(),
          score: totalScore,
        },
      });
    });
  }

  async gradeAnswer(answerId: string, dto: GradeAnswerDto) {
    const answer = await this.prisma.answer.update({
      where: { id: answerId },
      data: {
        score: dto.score,
        isCorrect: dto.score > 0, // Simplified: any score > 0 is correct-ish
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

  async getExamSessions(examId: string) {
    return this.prisma.examSession.findMany({
      where: { examId },
      include: {
        student: {
          include: {
            user: true,
          },
        },
        answers: {
          include: {
            question: true,
          },
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

    return this.prisma.examSession.findMany({
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
}
