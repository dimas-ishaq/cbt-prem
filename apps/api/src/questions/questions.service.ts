import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    const { options, ...questionData } = dto;
    return this.prisma.question.create({
      data: {
        ...questionData,
        options: { create: options },
      },
      include: { options: true },
    });
  }

  async findByBank(bankId: string) {
    return this.prisma.question.findMany({
      where: { questionBankId: bankId },
      include: { options: true },
    });
  }

  async update(id: string, dto: UpdateQuestionDto) {
    const { options, ...questionData } = dto;
    return this.prisma.$transaction(async (tx) => {
      if (options) {
        await tx.questionOption.deleteMany({
          where: { questionId: id },
        });
      }
      return tx.question.update({
        where: { id },
        data: {
          ...questionData,
          ...(options ? { options: { create: options } } : {}),
        },
        include: { options: true },
      });
    });
  }

  async remove(id: string) {
    return this.prisma.question.delete({ where: { id } });
  }

  async removeBank(id: string) {
    return this.prisma.questionBank.delete({ where: { id } });
  }
}
