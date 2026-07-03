import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as mammoth from 'mammoth';
import { QuestionType, Difficulty } from '@prisma/client';
import { join } from 'path';
import { promises as fs } from 'fs';
import { randomUUID } from 'crypto';
import sanitizeHtmlLib from 'sanitize-html';

function isNonEmptyHtml(value?: string) {
  return (value || '').replace(/<[^>]*>/g, '').trim() !== '';
}

function assertQuestionValid(
  type: QuestionType,
  content: string,
  options: { content: string; isCorrect: boolean }[],
) {
  if (!isNonEmptyHtml(content))
    throw new Error('Isi soal tidak boleh kosong');
  if (type === QuestionType.ESSAY) {
    if (options.length > 0)
      throw new Error('Soal essay tidak boleh punya opsi jawaban');
    return;
  }
  if (options.length < 2)
    throw new Error('Soal harus memiliki minimal 2 opsi jawaban');
  const correctCount = options.filter((o) => o.isCorrect).length;
  if (
    type === QuestionType.PILIHAN_GANDA ||
    type === QuestionType.BENAR_SALAH
  ) {
    if (correctCount !== 1)
      throw new Error('Soal harus memiliki tepat 1 jawaban benar');
  }
  if (type === QuestionType.MULTIPLE_RESPONSE) {
    if (correctCount < 1)
      throw new Error('Soal harus memiliki minimal 1 jawaban benar');
  }
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

interface ParsedOption {
  content: string;
  isCorrect: boolean;
  order: number;
}

interface ParsedQuestion {
  content: string;
  type: QuestionType;
  difficulty: Difficulty;
  points: number;
  options: ParsedOption[];
}

export interface ImportPreviewResult {
  success: ParsedQuestion[];
  warnings: { line: string; reason: string }[];
  totalParsed: number;
  totalWarnings: number;
}

const DIFFICULTY_MAP: Record<string, Difficulty> = {
  MUDAH: Difficulty.MUDAH,
  SEDANG: Difficulty.SEDANG,
  SULIT: Difficulty.SULIT,
};

const TYPE_MAP: Record<string, QuestionType> = {
  PILIHAN_GANDA: QuestionType.PILIHAN_GANDA,
  BENAR_SALAH: QuestionType.BENAR_SALAH,
  MULTIPLE_RESPONSE: QuestionType.MULTIPLE_RESPONSE,
  ESSAY: QuestionType.ESSAY,
};

@Injectable()
export class QuestionsImportService {
  constructor(private prisma: PrismaService) {}

  // ─── Public API ────────────────────────────────────────────────────────────

  /** Parse only — no DB write. Returns preview of what will be imported. */
  async previewFromDocx(
    bankId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<ImportPreviewResult> {
    if (!bankId) throw new BadRequestException('ID bank wajib diisi');
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new ForbiddenException(
        'Hanya guru atau administrator yang bisa mengelola soal',
      );
    const isAdmin =
      user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_SEKOLAH';
    const teacher = isAdmin
      ? null
      : await this.prisma.teacher.findUnique({ where: { userId } });
    if (!isAdmin && !teacher)
      throw new ForbiddenException(
        'Hanya guru atau administrator yang bisa mengelola soal',
      );
    const bank = await this.prisma.questionBank.findUnique({
      where: { id: bankId },
      include: { subject: { include: { teachers: { select: { id: true } } } } },
    });
    if (!bank) throw new NotFoundException('Bank soal tidak ditemukan');
    if (!isAdmin && !teacher)
      throw new ForbiddenException(
        'Hanya guru atau administrator yang bisa mengelola soal',
      );
    if (
      !isAdmin &&
      !new Set([bank.teacherId, ...bank.subject.teachers.map((t) => t.id)]).has(
        teacher.id,
      )
    )
      throw new ForbiddenException('Anda tidak memiliki bank soal ini');
    const html = await this.convertDocxToHtml(file.buffer);
    return this.parseQuestions(html);
  }

  /** Full import: parse then save to DB inside a transaction. */
  async importFromDocx(
    bankId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      throw new ForbiddenException(
        'Hanya guru atau administrator yang bisa mengelola soal',
      );
    const isAdmin =
      user.role === 'SUPER_ADMIN' || user.role === 'ADMIN_SEKOLAH';
    const teacher = isAdmin
      ? null
      : await this.prisma.teacher.findUnique({ where: { userId } });
    if (!isAdmin && !teacher)
      throw new ForbiddenException(
        'Hanya guru atau administrator yang bisa mengelola soal',
      );
    const bank = await this.prisma.questionBank.findUnique({
      where: { id: bankId },
      include: { subject: { include: { teachers: { select: { id: true } } } } },
    });
    if (!bank) throw new NotFoundException('Bank soal tidak ditemukan');
    if (!isAdmin && !teacher)
      throw new ForbiddenException(
        'Hanya guru atau administrator yang bisa mengelola soal',
      );
    if (
      !isAdmin &&
      !new Set([bank.teacherId, ...bank.subject.teachers.map((t) => t.id)]).has(
        teacher.id,
      )
    )
      throw new ForbiddenException('Anda tidak memiliki bank soal ini');
    const html = await this.convertDocxToHtml(file.buffer);
    const { success: questions, warnings } = this.parseQuestions(html);

    if (questions.length === 0) {
      throw new BadRequestException(
        'Tidak ada soal yang berhasil di-parse dari dokumen. ' +
          'Pastikan Anda menggunakan template yang benar dan format [soal nomor X] sudah ada. ' +
          (warnings.length > 0
            ? `Detail error: ${warnings.map((w) => w.reason).join('; ')}`
            : ''),
      );
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const results: any[] = [];
      for (const q of questions) {
        assertQuestionValid(q.type, q.content, q.options);
        const created = await tx.question.create({
          data: {
            questionBankId: bankId,
            content: sanitizeHtml(q.content),
            type: q.type,
            difficulty: q.difficulty,
            points: q.points,
            tags: [],
            options:
              q.options.length > 0
                ? {
                    create: q.options.map((o) => ({
                      content: sanitizeHtml(o.content),
                      isCorrect: o.isCorrect,
                      order: o.order,
                    })),
                  }
                : undefined,
          },
          include: { options: true },
        });
        results.push(created);
      }
      return results;
    });

    return {
      imported: created.length,
      warnings,
      questions: created,
    };
  }

  // ─── Image Extraction ──────────────────────────────────────────────────────

  /**
   * Converts .docx buffer to HTML with images saved to disk and replaced by public URLs.
   * All embedded images are extracted to /uploads/questions/images/<uuid>.<ext>.
   */
  private async convertDocxToHtml(buffer: Buffer): Promise<string> {
    const uploadDir = join(process.cwd(), 'uploads', 'questions', 'images');
    await fs.mkdir(uploadDir, { recursive: true });

    const { value: html } = await mammoth.convertToHtml(
      { buffer },
      {
        convertImage: mammoth.images.imgElement(async (image) => {
          const ext = (image.contentType.split('/')[1] || 'png').replace(
            'jpeg',
            'jpg',
          );
          const filename = `${randomUUID()}.${ext}`;
          const filePath = join(uploadDir, filename);
          const imageBuffer = await image.read();
          await fs.writeFile(filePath, imageBuffer);
          return { src: `/uploads/questions/images/${filename}` };
        }),
      },
    );
    return html;
  }

  // ─── Parser ────────────────────────────────────────────────────────────────

  /**
   * Splits HTML into paragraph blocks and parses them using a state machine
   * based on SQ/EQ boundaries and MULTIPLE CHOICE / ESSAY block wrappers.
   */
  private parseQuestions(html: string): ImportPreviewResult {
    const success: ParsedQuestion[] = [];
    const warnings: { line: string; reason: string }[] = [];

    // Extract all paragraphs or elements from mammoth's HTML output.
    // Mammoth puts block elements inside <p>, <table>, etc.
    // We match <p> tags, table blocks, and other block-level elements.
    const blockRegex = /<(p|h\d|li|table|ol|ul)[^>]*>([\s\S]*?)<\/\1>/gi;
    const blocks = [...html.matchAll(blockRegex)];

    let currentType: QuestionType | null = null;
    let isAccumulating = false;
    let accumulatedParagraphs: string[] = [];
    let questionIndex = 1;

    for (let i = 0; i < blocks.length; i++) {
      const fullTag = blocks[i][0];
      const innerHtml = blocks[i][2] ?? '';
      const plainText = this.stripHtml(innerHtml).toUpperCase().trim();

      // State boundaries for question types
      if (plainText === 'MULTIPLE CHOICE' || plainText === 'PILIHAN GANDA') {
        currentType = QuestionType.PILIHAN_GANDA;
        continue;
      }
      if (
        plainText === 'END MULTIPLE CHOICE' ||
        plainText === 'END PILIHAN GANDA'
      ) {
        currentType = null;
        continue;
      }
      if (plainText === 'ESSAY') {
        currentType = QuestionType.ESSAY;
        continue;
      }
      if (plainText === 'END ESSAY') {
        currentType = null;
        continue;
      }
      if (
        plainText === 'BENAR SALAH' ||
        plainText === 'TRUE FALSE' ||
        plainText === 'BENAR_SALAH'
      ) {
        currentType = QuestionType.BENAR_SALAH;
        continue;
      }
      if (plainText === 'END BENAR SALAH' || plainText === 'END TRUE FALSE') {
        currentType = null;
        continue;
      }
      if (
        plainText === 'MULTIPLE RESPONSE' ||
        plainText === 'JAWABAN GANDA' ||
        plainText === 'MULTIPLE_RESPONSE'
      ) {
        currentType = QuestionType.MULTIPLE_RESPONSE;
        continue;
      }
      if (
        plainText === 'END MULTIPLE RESPONSE' ||
        plainText === 'END JAWABAN GANDA'
      ) {
        currentType = null;
        continue;
      }

      // Question markers
      if (plainText === 'SQ') {
        isAccumulating = true;
        accumulatedParagraphs = [];
        continue;
      }

      if (plainText === 'EQ') {
        if (!isAccumulating) {
          warnings.push({
            line: `Baris ${i + 1}`,
            reason: 'Menemukan penanda EQ tanpa SQ sebelumnya.',
          });
          continue;
        }
        isAccumulating = false;

        const activeType = currentType || QuestionType.PILIHAN_GANDA; // Default fallback
        try {
          const parsed = this.parseQuestionBlock(
            accumulatedParagraphs,
            activeType,
            questionIndex,
          );
          success.push(parsed);
          questionIndex++;
        } catch (err: any) {
          warnings.push({
            line: `Soal #${questionIndex} (${activeType})`,
            reason: err.message || 'Gagal memproses detail soal',
          });
          questionIndex++;
        }
        continue;
      }

      // If we are between SQ and EQ, accumulate the paragraph
      if (isAccumulating) {
        accumulatedParagraphs.push(fullTag);
      }
    }

    if (success.length === 0 && warnings.length === 0) {
      warnings.push({
        line: '(Dokumen)',
        reason:
          'Tidak ditemukan format penanda SQ/EQ yang valid. ' +
          'Pastikan dokumen memiliki penanda SQ & EQ serta pembungkus tipe soal (seperti MULTIPLE CHOICE / ESSAY).',
      });
    }

    return {
      success,
      warnings,
      totalParsed: success.length,
      totalWarnings: warnings.length,
    };
  }

  /**
   * Parses the HTML paragraph elements gathered inside SQ...EQ boundaries.
   */
  private parseQuestionBlock(
    paragraphs: string[],
    type: QuestionType,
    index: number,
  ): ParsedQuestion {
    let difficulty: Difficulty = Difficulty.SEDANG;
    let points = 10;
    let answerRaw: string | null = null;
    const options: ParsedOption[] = [];
    const questionTextParts: string[] = [];

    // Temporary storage for metadata parsing
    const cleanParagraphs: string[] = [];

    for (const p of paragraphs) {
      const plainText = this.stripHtml(p).trim();
      const plainTextUpper = plainText.toUpperCase();

      if (plainTextUpper.startsWith('TINGKAT:')) {
        const val = plainText.split(':')[1]?.trim().toUpperCase();
        if (val === 'MUDAH') difficulty = Difficulty.MUDAH;
        else if (val === 'SULIT') difficulty = Difficulty.SULIT;
        else difficulty = Difficulty.SEDANG;
        continue;
      }

      if (plainTextUpper.startsWith('BOBOT:')) {
        const val = plainText.split(':')[1]?.trim();
        points = val ? parseInt(val, 10) : 10;
        if (isNaN(points)) points = 10;
        continue;
      }

      if (
        plainTextUpper.startsWith('JAWABAN:') ||
        plainTextUpper.startsWith('KUNCI:')
      ) {
        answerRaw = plainText.split(':')[1]?.trim().toUpperCase() || null;
        continue;
      }

      cleanParagraphs.push(p);
    }

    // Process the remaining clean paragraphs (question content & options)
    for (const p of cleanParagraphs) {
      const plainText = this.stripHtml(p).trim();
      const optMatch = plainText.match(/^([A-Z])\.\s*(.*)/s);

      if (optMatch && type !== QuestionType.ESSAY) {
        const letter = optMatch[1].toUpperCase();
        // Extract inner HTML of option, stripping the "A. " prefix
        // Find matching inner text to strip
        const innerMatch = p.match(/>([\s\S]*?)</);
        let innerHtml = p;
        if (innerMatch) {
          innerHtml = p.replace(/>\s*[A-Z]\.\s*/i, '>');
        } else {
          innerHtml = p.replace(/^[A-Z]\.\s*/i, '');
        }

        const isCorrect = answerRaw
          ? answerRaw
              .split(',')
              .map((a) => a.trim())
              .includes(letter)
          : false;

        options.push({
          content: innerHtml.trim(),
          isCorrect,
          order: letter.charCodeAt(0) - 65,
        });
      } else {
        questionTextParts.push(p);
      }
    }

    // Handle True/False defaults if options not specified
    if (type === QuestionType.BENAR_SALAH && options.length === 0) {
      options.push(
        { content: '<p>Benar</p>', isCorrect: answerRaw === 'BENAR', order: 0 },
        { content: '<p>Salah</p>', isCorrect: answerRaw === 'SALAH', order: 1 },
      );
    }

    // Validation
    const markerLabel = `Soal #${index}`;
    if (type === QuestionType.PILIHAN_GANDA && options.length < 2) {
      throw new Error(`Soal pilihan ganda butuh minimal 2 pilihan jawaban.`);
    }
    if (
      type === QuestionType.PILIHAN_GANDA &&
      !options.some((o) => o.isCorrect)
    ) {
      throw new Error(
        `Soal pilihan ganda tidak memiliki kunci jawaban yang valid.`,
      );
    }
    if (
      type === QuestionType.MULTIPLE_RESPONSE &&
      !options.some((o) => o.isCorrect)
    ) {
      throw new Error(
        `Soal jawaban ganda (multiple response) harus memiliki minimal 1 jawaban benar.`,
      );
    }

    const finalContent = questionTextParts.join('\n').trim();

    return {
      content: finalContent,
      type,
      difficulty,
      points,
      options,
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .trim();
  }
}
