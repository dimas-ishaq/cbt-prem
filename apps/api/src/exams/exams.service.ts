import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExamDto, teacherId: string) {
    const { questionIds, ...examData } = dto;
    return this.prisma.exam.create({
      data: {
        ...examData,
        teacherId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        examQuestions: {
          create: questionIds?.map((id, index) => ({
            questionId: id,
            order: index,
          })),
        },
      },
    });
  }

  async findAll(user?: any) {
    const include: any = { 
      subject: true, 
      examGroup: true,
      teacher: { include: { user: true } },
      _count: {
        select: { examSessions: true }
      }
    };

    if (user && user.role === 'SISWA') {
      include.examSessions = {
        where: {
          student: {
            userId: user.userId
          }
        },
        select: {
          id: true,
          status: true,
        }
      };
    }

    return this.prisma.exam.findMany({
      include,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, user?: any) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { 
        subject: true, 
        examGroup: true,
        examQuestions: { 
          include: { 
            question: { 
              include: { options: true } 
            } 
          } 
        } 
      },
    });

    if (!exam) return null;

    // Seeded random number generator
    const seedRandom = (seedStr: string) => {
      let h = 1779033703 ^ seedStr.length;
      for (let i = 0; i < seedStr.length; i++) {
        h = Math.imul(h ^ seedStr.charCodeAt(i), 3432918353);
        h = (h << 13) | (h >>> 19);
      }
      let seed = (h ^ (h >>> 16)) >>> 0;
      return () => {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    };

    // Shuffle helper function
    const shuffleArray = <T>(array: T[], seedStr: string): T[] => {
      const shuffled = [...array];
      const rng = seedRandom(seedStr);
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        const temp = shuffled[i];
        shuffled[i] = shuffled[j];
        shuffled[j] = temp;
      }
      return shuffled;
    };

    // Sort by original order first
    exam.examQuestions.sort((a, b) => a.order - b.order);

    if (user && user.role === 'SISWA' && exam.randomizeSoal) {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.userId },
      });

      if (student) {
        // Separate essay questions from non-essay questions
        const nonEssayQuestions = exam.examQuestions.filter(
          (eq) => eq.question.type !== 'ESSAY'
        );
        const essayQuestions = exam.examQuestions.filter(
          (eq) => eq.question.type === 'ESSAY'
        );

        // Seeded shuffle both arrays separately
        const seedNonEssay = `${student.id}-${exam.id}-nonessay`;
        const seedEssay = `${student.id}-${exam.id}-essay`;

        const shuffledNonEssay = shuffleArray(nonEssayQuestions, seedNonEssay);
        const shuffledEssay = shuffleArray(essayQuestions, seedEssay);

        // Combine: non-essay questions first, then essay questions
        exam.examQuestions = [...shuffledNonEssay, ...shuffledEssay];
      } else {
        // Fallback: non-essay first, then essay (in original relative order)
        const nonEssayQuestions = exam.examQuestions.filter(
          (eq) => eq.question.type !== 'ESSAY'
        );
        const essayQuestions = exam.examQuestions.filter(
          (eq) => eq.question.type === 'ESSAY'
        );
        exam.examQuestions = [...nonEssayQuestions, ...essayQuestions];
      }
    } else {
      // For teachers/admins or when randomizeSoal is false,
      // still ensure Multiple Choice / non-essay questions are first, and Essay questions are at the end.
      const nonEssayQuestions = exam.examQuestions.filter(
        (eq) => eq.question.type !== 'ESSAY'
      );
      const essayQuestions = exam.examQuestions.filter(
        (eq) => eq.question.type === 'ESSAY'
      );
      exam.examQuestions = [...nonEssayQuestions, ...essayQuestions];
    }

    return exam;
  }

  async update(id: string, data: any) {
    const { questionIds, ...examData } = data;
    
    const updateData: any = {
      ...examData,
    };

    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    if (questionIds) {
      // Delete existing questions for this exam
      await this.prisma.examQuestion.deleteMany({
        where: { examId: id },
      });
      // Re-create the relation maps
      updateData.examQuestions = {
        create: questionIds.map((qId: string, index: number) => ({
          questionId: qId,
          order: index,
        })),
      };
    }

    return this.prisma.exam.update({
      where: { id },
      data: updateData,
    });
  }

  async remove(id: string) {
    return this.prisma.exam.delete({
      where: { id },
    });
  }

  async validateSeb(examId: string, sebConfigKey: string, sebBrowserKey: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return false;
    
    // In production, we would compare hashes provided by SEB
    // SEB-Config-Key and SEB-Browser-Exam-Key headers
    if (exam.sebConfigKey && exam.sebConfigKey !== sebConfigKey) {
      return false;
    }
    if (exam.sebBrowserKey && exam.sebBrowserKey !== sebBrowserKey) {
      return false;
    }
    return true;
  }
}
