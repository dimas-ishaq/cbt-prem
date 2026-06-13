import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto) {
    const { options, ...questionData } = dto;
    return this.prisma.question.create({
      data: {
        ...questionData,
        options: {
          create: options,
        },
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

  async remove(id: string) {
    return this.prisma.question.delete({
      where: { id },
    });
  }
}
