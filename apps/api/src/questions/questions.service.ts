import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionType } from '@prisma/client';

function normalizeHtml(value?: string) {
  return (value || '').replace(/<p>(?:<br\s*\/?>|\s*)<\/p>/gi, '').trim();
}

function sanitizeHtml(value: string) {
  return value.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/on\w+="[^"]*"/gi, '');
}

function isNonEmptyHtml(value?: string) {
  const plain = normalizeHtml(value);
  return plain !== '' && plain !== '<p></p>';
}

function validateQuestionPayload(type: QuestionType, content: string, options: { content: string; isCorrect: boolean }[]) {
  if (!isNonEmptyHtml(content)) throw new BadRequestException('Question content cannot be empty');
  if (type === QuestionType.ESSAY) {
    if (options.length > 0) throw new BadRequestException('Essay question cannot have options');
    return;
  }
  if (options.length < 2) throw new BadRequestException('Question must have at least 2 options');
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (type === QuestionType.PILIHAN_GANDA || type === QuestionType.BENAR_SALAH) {
    if (correctCount !== 1) throw new BadRequestException('Question must have exactly 1 correct answer');
  }
  if (type === QuestionType.MULTIPLE_RESPONSE) {
    if (correctCount < 1) throw new BadRequestException('Question must have at least 1 correct answer');
  }
}

async function assertBankOwnedByTeacher(prisma: PrismaService, bankId: string, userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new ForbiddenException('Only teachers or administrators can manage questions');
  const bank = await prisma.questionBank.findUnique({ where: { id: bankId } });
  if (!bank) throw new NotFoundException('Question bank not found');
  if (bank.teacherId !== teacher.id) throw new ForbiddenException('You do not own this question bank');
  return bank;
}

async function assertQuestionOwnedByTeacher(prisma: PrismaService, questionId: string, userId: string) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw new ForbiddenException('Only teachers or administrators can manage questions');
  const question = await prisma.question.findUnique({ where: { id: questionId }, include: { questionBank: true, options: true } });
  if (!question) throw new NotFoundException('Question not found');
  if (question.questionBank.teacherId !== teacher.id) throw new ForbiddenException('You do not own this question');
  return question;
}

@Injectable()
export class QuestionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, userId: string) {
    const { options = [], content, questionBankId, type, ...questionData } = dto as any;
    await assertBankOwnedByTeacher(this.prisma, questionBankId, userId);
    validateQuestionPayload(type, content, options);
    return this.prisma.question.create({
      data: {
        ...questionData,
        questionBankId,
        content: sanitizeHtml(content),
        type,
        options: { create: options.map((option) => ({ ...option, content: sanitizeHtml(option.content) })) },
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

  async update(id: string, dto: UpdateQuestionDto, userId: string) {
    const current = await assertQuestionOwnedByTeacher(this.prisma, id, userId);
    const { options, content, type, ...questionData } = dto as any;
    const nextType = type || current.type;
    const nextContent = content ?? current.content;
    const nextOptions = options ?? current.options?.map((o) => ({ content: o.content, isCorrect: o.isCorrect })) ?? [];
    validateQuestionPayload(nextType, nextContent, nextOptions);
    return this.prisma.$transaction(async (tx) => {
      if (options) {
        await tx.questionOption.deleteMany({ where: { questionId: id } });
      }
      return tx.question.update({
        where: { id },
        data: {
          ...questionData,
          ...(content !== undefined ? { content: sanitizeHtml(content) } : {}),
          ...(type !== undefined ? { type } : {}),
          ...(options ? { options: { create: options.map((option: any) => ({ ...option, content: sanitizeHtml(option.content) })) } } : {}),
        },
        include: { options: true },
      });
    });
  }

  async remove(id: string, userId: string) {
    await assertQuestionOwnedByTeacher(this.prisma, id, userId);
    return this.prisma.question.delete({ where: { id } });
  }

  async removeBank(id: string, userId: string) {
    await assertBankOwnedByTeacher(this.prisma, id, userId);
    return this.prisma.questionBank.delete({ where: { id } });
  }
}
