import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionBankDto } from './dto/create-question-bank.dto';

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

  async remove(id: string) {
    return this.prisma.questionBank.delete({
      where: { id },
    });
  }
}
