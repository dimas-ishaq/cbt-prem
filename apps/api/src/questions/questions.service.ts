import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuestionDto } from './dto/create-question.dto';
import { UpdateQuestionDto } from './dto/update-question.dto';
import { QuestionType } from '@prisma/client';
import sanitizeHtmlLib from 'sanitize-html';
import { join } from 'path';
import { promises as fs } from 'fs';

function normalizeHtml(value?: string) {
  return (value || '').replace(/<p>(?:<br\s*\/?>|\s*)<\/p>/gi, '').trim();
}

function sanitizeHtml(value: string) {
  return sanitizeHtmlLib(value, {
    allowedTags: sanitizeHtmlLib.defaults.allowedTags.concat([
      'img',
      'figure',
      'figcaption',
      'u',
      'span',
      'sub',
      'sup',
    ]),
    allowedAttributes: {
      ...sanitizeHtmlLib.defaults.allowedAttributes,
      img: ['src', 'alt', 'width', 'height', 'class'],
      a: ['href', 'target', 'rel', 'class'],
      '*': ['class', 'style'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: { img: ['http', 'https', 'data'] },
    disallowedTagsMode: 'discard',
  });
}

function isNonEmptyHtml(value?: string) {
  const plain = normalizeHtml(value);
  return plain !== '' && plain !== '<p></p>';
}

function validateQuestionPayload(
  type: QuestionType,
  content: string,
  options: { content: string; isCorrect: boolean }[],
) {
  if (!isNonEmptyHtml(content))
    throw new BadRequestException('Isi soal tidak boleh kosong');
  if (type === QuestionType.ESSAY) {
    if (options.length > 0)
      throw new BadRequestException(
        'Soal essay tidak boleh punya opsi jawaban',
      );
    return;
  }
  if (options.length < 2)
    throw new BadRequestException('Soal harus memiliki minimal 2 opsi jawaban');
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (
    type === QuestionType.PILIHAN_GANDA ||
    type === QuestionType.BENAR_SALAH
  ) {
    if (correctCount !== 1)
      throw new BadRequestException(
        'Soal harus memiliki tepat 1 jawaban benar',
      );
  }
  if (type === QuestionType.MULTIPLE_RESPONSE) {
    if (correctCount < 1)
      throw new BadRequestException(
        'Soal harus memiliki minimal 1 jawaban benar',
      );
  }
}

async function canManageQuestions(prisma: PrismaService, userId: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user)
    throw new ForbiddenException(
      'Only teachers or administrators can manage questions',
    );
  if (user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_SEKOLAH')
    return { admin: true } as const;
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher)
    throw new ForbiddenException('Hanya guru yang bisa mengelola soal');
  return { admin: false, teacher } as const;
}

async function assertBankAccess(
  prisma: PrismaService,
  bankId: string,
  userId: string,
) {
  const access = await canManageQuestions(prisma, userId);
  const bank = await prisma.questionBank.findUnique({
    where: { id: bankId },
    include: { subject: { include: { teachers: { select: { id: true } } } } },
  });
  if (!bank) throw new NotFoundException('Bank soal tidak ditemukan');
  if (access.admin) return bank;
  const allowedTeacherIds = new Set([
    bank.teacherId,
    ...bank.subject.teachers.map((t) => t.id),
  ]);
  if (!allowedTeacherIds.has(access.teacher.id))
    throw new ForbiddenException('Anda tidak memiliki bank soal ini');
  return bank;
}

async function assertQuestionOwnedByTeacher(
  prisma: PrismaService,
  questionId: string,
  userId: string,
) {
  const access = await canManageQuestions(prisma, userId);
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      questionBank: {
        include: {
          subject: { include: { teachers: { select: { id: true } } } },
        },
      },
      options: true,
    },
  });
  if (!question) throw new NotFoundException('Soal tidak ditemukan');
  if (access.admin) return question;
  const allowedTeacherIds = new Set([
    question.questionBank.teacherId,
    ...question.questionBank.subject.teachers.map((t) => t.id),
  ]);
  if (!allowedTeacherIds.has(access.teacher.id))
    throw new ForbiddenException('Anda tidak memiliki soal ini');
  return question;
}

/** Extract /uploads/... file paths from HTML content. */
function extractFilePaths(html: string): string[] {
  const srcRegex = /src="(\/uploads\/[^"]+)"/g;
  const paths: string[] = [];
  let match;
  while ((match = srcRegex.exec(html)) !== null) {
    paths.push(match[1]);
  }
  return paths;
}

/** Remove uploaded files from disk (best-effort). */
async function unlinkUploadedFiles(...filePaths: string[]) {
  for (const relPath of filePaths) {
    try {
      const fullPath = join(process.cwd(), relPath);
      await fs.unlink(fullPath);
    } catch {
      // file may not exist — ignore
    }
  }
}

@Injectable()
export class QuestionsService {
  private readonly logger = new Logger(QuestionsService.name);
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateQuestionDto, userId: string) {
    const {
      options = [],
      content,
      questionBankId,
      type,
      ...questionData
    } = dto as any;
    await assertBankAccess(this.prisma, questionBankId, userId);
    validateQuestionPayload(type, content, options);
    return this.prisma.question.create({
      data: {
        ...questionData,
        questionBankId,
        content: sanitizeHtml(content),
        type,
        options: {
          create: options.map((option) => ({
            ...option,
            content: sanitizeHtml(option.content),
          })),
        },
      },
      include: { options: true },
    });
  }

  async findByBank(bankId: string) {
    return this.prisma.question.findMany({
      where: { questionBankId: bankId },
      include: { options: true },
      orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async update(id: string, dto: UpdateQuestionDto, userId: string) {
    const current = await assertQuestionOwnedByTeacher(this.prisma, id, userId);
    const { options, content, type, ...questionData } = dto as any;
    const nextType = type || current.type;
    const nextContent = content ?? current.content;
    const nextOptions =
      options ??
      current.options?.map((o) => ({
        content: o.content,
        isCorrect: o.isCorrect,
      })) ??
      [];
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
          ...(options
            ? {
                options: {
                  create: options.map((option: any) => ({
                    ...option,
                    content: sanitizeHtml(option.content),
                  })),
                },
              }
            : {}),
        },
        include: { options: true },
      });
    });
  }

  async remove(id: string, userId: string) {
    const question = await assertQuestionOwnedByTeacher(
      this.prisma,
      id,
      userId,
    );

    // Collect file paths to clean up
    const filesToDelete: string[] = [];
    if (question.mediaUrl) filesToDelete.push(question.mediaUrl);
    if (question.content)
      filesToDelete.push(...extractFilePaths(question.content));
    for (const opt of question.options ?? []) {
      if (opt.content) filesToDelete.push(...extractFilePaths(opt.content));
    }

    const result = await this.prisma.question.delete({ where: { id } });
    if (filesToDelete.length > 0) {
      await unlinkUploadedFiles(...filesToDelete).catch((err) =>
        this.logger.warn(
          `Failed to cleanup files for question ${id}: ${err.message}`,
        ),
      );
    }
    return result;
  }

  async removeBank(id: string, userId: string) {
    const bank = await assertBankAccess(this.prisma, id, userId);

    // Collect all question files in this bank
    const questions = await this.prisma.question.findMany({
      where: { questionBankId: id },
      include: { options: true },
    });
    const filesToDelete: string[] = [];
    for (const q of questions) {
      if (q.mediaUrl) filesToDelete.push(q.mediaUrl);
      if (q.content) filesToDelete.push(...extractFilePaths(q.content));
      for (const opt of q.options ?? []) {
        if (opt.content) filesToDelete.push(...extractFilePaths(opt.content));
      }
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({
        where: { question: { questionBankId: id } },
      });
      await tx.examQuestion.deleteMany({
        where: { question: { questionBankId: id } },
      });
      await tx.answer.deleteMany({
        where: { question: { questionBankId: id } },
      });
      await tx.question.deleteMany({
        where: { questionBankId: id },
      });
      return tx.questionBank.delete({ where: { id } });
    });

    if (filesToDelete.length > 0) {
      await unlinkUploadedFiles(...filesToDelete).catch((err) =>
        this.logger.warn(
          `Failed to cleanup files for bank ${id}: ${err.message}`,
        ),
      );
    }
    return result;
  }

  async reorder(bankId: string, questionIds: string[], userId: string) {
    await assertBankAccess(this.prisma, bankId, userId);
    return this.prisma.$transaction(
      questionIds.map((id, index) =>
        this.prisma.question.update({
          where: { id, questionBankId: bankId },
          data: { order: index },
        }),
      ),
    );
  }
}
