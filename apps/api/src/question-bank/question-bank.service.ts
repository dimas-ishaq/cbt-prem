import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';
import { UpdateQuestionBankDto } from './dto/update-question-bank.dto';

@Injectable()
export class QuestionBankService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionBankDto, teacherId: string) {
    return this.prisma.questionBank.create({
      data: {
        ...dto,
        teacherId,
      },
    });
  }

  async findAll(teacherId?: string) {
    return this.prisma.questionBank.findMany({
      where: teacherId ? { teacherId } : {},
      include: { subject: true, _count: { select: { questions: true } } },
    });
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

  async update(id: string, dto: UpdateQuestionBankDto, teacherId: string) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }
    if (bank.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this question bank');
    }
    return this.prisma.questionBank.update({
      where: { id },
      data: dto,
      include: { subject: true },
    });
  }

  async remove(id: string, teacherId: string) {
    const bank = await this.prisma.questionBank.findUnique({ where: { id } });
    if (!bank) {
      throw new NotFoundException('Question bank not found');
    }
    if (bank.teacherId !== teacherId) {
      throw new ForbiddenException('You do not own this question bank');
    }
    return this.prisma.questionBank.delete({
      where: { id },
    });
  }
}
