import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { Role } from '@prisma/client';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  private async getTeacherOrThrow(userId: string) {
    let teacher = await this.prisma.teacher.findUnique({
      where: { userId },
    });
    if (!teacher) {
      const user = await this.prisma.user.findUnique({ where: { id: userId } });
      if (user && (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN_SEKOLAH)) {
        const fallbackTeacher = await this.prisma.teacher.findFirst();
        if (!fallbackTeacher) {
          throw new NotFoundException('No teachers registered in the system. Please add a teacher first.');
        }
        teacher = fallbackTeacher;
      } else {
        throw new ForbiddenException('Only teachers or administrators can manage question banks');
      }
    }
    return teacher;
  }

  async create(dto: CreateQuestionBankDto, userId: string) {
    const teacher = await this.getTeacherOrThrow(userId);
    return this.prisma.questionBank.create({
      data: {
        ...dto,
        teacherId: teacher.id,
      },
    });
  }

  async findAll(teacherId?: string, skip?: number, take?: number) {
    const where = teacherId ? { teacherId } : {};
    const [data, total] = await Promise.all([
      this.prisma.questionBank.findMany({
        where,
        include: { subject: true, _count: { select: { questions: true } } },
        ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
      }),
      this.prisma.questionBank.count({ where }),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    return this.prisma.questionBank.findUnique({
      where: { id },
      include: { 
        subject: true, 
        questions: {
          include: { options: true }
        }
      },
    });
  }

  async update(id: string, dto: UpdateQuestionBankDto, userId: string) {
    const teacher = await this.getTeacherOrThrow(userId);
    const bank = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }
    if (bank.teacherId !== teacher.id) {
      throw new ForbiddenException('You do not own this question bank');
    }
    return this.prisma.questionBank.update({
      where: { id },
      data: dto,
      include: { subject: true },
    });
  }

  async remove(id: string, userId: string) {
    const teacher = await this.getTeacherOrThrow(userId);
    const bank = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }
    if (bank.teacherId !== teacher.id) {
      throw new ForbiddenException('You do not own this question bank');
    }
    return this.prisma.questionBank.delete({
      where: { id },
    });
  }
}
