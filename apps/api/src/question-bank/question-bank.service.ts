import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';
import { Role } from '@prisma/client';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  private async getTeacherOrThrow(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Only teachers or administrators can manage question banks');
    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN_SEKOLAH) return null;
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new ForbiddenException('Only teachers can manage question banks');
    return teacher;
  }

  async create(dto: CreateQuestionBankDto, userId: string) {
    const teacher = await this.getTeacherOrThrow(userId);
    const targetTeacherId = teacher ? teacher.id : dto.teacherId;
    if (!targetTeacherId) {
      throw new BadRequestException('teacherId is required for administrators');
    }
    return this.prisma.questionBank.create({
      data: {
        name: dto.name,
        subjectId: dto.subjectId,
        category: dto.category,
        teacherId: targetTeacherId,
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
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Only teachers or administrators can manage question banks');
    const bank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: { subject: { include: { teachers: { select: { id: true } } } } },
    });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }
    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN_SEKOLAH) {
      return this.prisma.questionBank.update({ where: { id }, data: dto, include: { subject: true } });
    }
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new ForbiddenException('Only teachers can manage question banks');
    const allowedTeacherIds = new Set([bank.teacherId, ...bank.subject.teachers.map((t) => t.id)]);
    if (!allowedTeacherIds.has(teacher.id)) {
      throw new ForbiddenException('You do not own this question bank');
    }
    return this.prisma.questionBank.update({
      where: { id },
      data: dto,
      include: { subject: true },
    });
  }

  async remove(id: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('Only teachers or administrators can manage question banks');
    const bank = await this.prisma.questionBank.findUnique({
      where: { id },
      include: { subject: { include: { teachers: { select: { id: true } } } } },
    });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }
    if (user.role === Role.SUPER_ADMIN || user.role === Role.ADMIN_SEKOLAH) {
      return this.prisma.questionBank.delete({ where: { id } });
    }
    const teacher = await this.prisma.teacher.findUnique({ where: { userId } });
    if (!teacher) throw new ForbiddenException('Only teachers can manage question banks');
    const allowedTeacherIds = new Set([bank.teacherId, ...bank.subject.teachers.map((t) => t.id)]);
    if (!allowedTeacherIds.has(teacher.id)) {
      throw new ForbiddenException('You do not own this question bank');
    }
    return this.prisma.questionBank.delete({ where: { id } });
  }
}
