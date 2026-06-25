import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()

export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExamDto, teacherId: string) {
    const { questionIds, rombelIds, majorIds, ...examData } = dto;
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
        targetRombels: {
          create: rombelIds?.map((rombelId) => ({
            rombelId,
          })),
        },
        targetMajors: {
          create: majorIds?.map((majorId) => ({
            majorId,
          })),
        },
      },
    });
  }

  async findAll(user?: any, skip?: number, take?: number) {
    const include: any = {
      subject: true,
      examGroup: true,
      teacher: { include: { user: true } },
      _count: { select: { examSessions: true } },
    };

    if (user && user.role === 'SISWA') {
      include.examSessions = {
        where: { student: { userId: user.userId } },
        select: { id: true, status: true },
      };
    }

    const where: any = {};

    if (user && user.role === 'SISWA') {
      where.status = { not: 'DRAFT' };
      const student = await this.prisma.student.findUnique({
        where: { userId: user.userId },
      });
      if (student) {
        where.OR = [
          // Open to all (no target rombel AND no target major)
          {
            targetRombels: { none: {} },
            targetMajors: { none: {} },
          },
          // Targeted to student's rombel
          ...(student.rombelId ? [{
            targetRombels: {
              some: {
                rombelId: student.rombelId,
              },
            },
          }] : []),
          // Targeted to student's major
          ...(student.majorId ? [{
            targetMajors: {
              some: {
                majorId: student.majorId,
              },
            },
          }] : []),
        ];
      }
    }

    return this.prisma.exam.findMany({
      where,
      include,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    });
  }

  async findOne(id: string, user?: any) {
    const include: any = {
      subject: true,
      examGroup: true,
      examQuestions: {
        include: {
          question: {
            include: { options: true }
          }
        }
      },
      targetRombels: {
        include: {
          rombel: true
        }
      },
      targetMajors: true,
    };

    if (user && (user.role === 'GURU' || user.role === 'SUPER_ADMIN')) {
      include.examSessions = {
        include: {
          student: {
            include: {
              user: true
            }
          },
          violations: true,
          answers: true
        }
      };
    }

    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include,
    });

    if (!exam) return null;

    if (user && user.role === 'SISWA' && exam.status === 'DRAFT') {
      return null;
    }

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
    const examQuestions = exam.examQuestions as any[];
    examQuestions.sort((a, b) => a.order - b.order);

    if (user && user.role === 'SISWA' && exam.randomizeSoal) {
      const student = await this.prisma.student.findUnique({
        where: { userId: user.userId },
      });

      if (student) {
        // Separate essay questions from non-essay questions
        const nonEssayQuestions = examQuestions.filter(
          (eq) => eq.question.type !== 'ESSAY'
        );
        const essayQuestions = examQuestions.filter(
          (eq) => eq.question.type === 'ESSAY'
        );

        // Seeded shuffle both arrays separately
        const seedNonEssay = `${student.id}-${exam.id}-nonessay`;
        const seedEssay = `${student.id}-${exam.id}-essay`;

        const shuffledNonEssay = shuffleArray(nonEssayQuestions, seedNonEssay);
        const shuffledEssay = shuffleArray(essayQuestions, seedEssay);

        // Combine: non-essay questions first, then essay questions
        (exam as any).examQuestions = [...shuffledNonEssay, ...shuffledEssay];
      } else {
        // Fallback: non-essay first, then essay (in original relative order)
        const nonEssayQuestions = examQuestions.filter(
          (eq) => eq.question.type !== 'ESSAY'
        );
        const essayQuestions = examQuestions.filter(
          (eq) => eq.question.type === 'ESSAY'
        );
        (exam as any).examQuestions = [...nonEssayQuestions, ...essayQuestions];
      }
    } else {
      // For teachers/admins or when randomizeSoal is false,
      // still ensure Multiple Choice / non-essay questions are first, and Essay questions are at the end.
      const nonEssayQuestions = examQuestions.filter(
        (eq) => eq.question.type !== 'ESSAY'
      );
      const essayQuestions = examQuestions.filter(
        (eq) => eq.question.type === 'ESSAY'
      );
      (exam as any).examQuestions = [...nonEssayQuestions, ...essayQuestions];
    }

    return exam;
  }

  async update(id: string, data: any) {
    const { questionIds, rombelIds, majorIds, startDate, startTimeField, endDate, endTimeField, ...examData } = data;

    // Eksplisit petakan boolean security flags agar tidak pernah ter-drop
    const updateData: any = {
      ...examData,
      // Pastikan boolean selalu disertakan secara eksplisit
      ...(typeof data.requireSeb === 'boolean' && { requireSeb: data.requireSeb }),
      ...(typeof data.blockKeyCopyPaste === 'boolean' && { blockKeyCopyPaste: data.blockKeyCopyPaste }),
      ...(typeof data.forceFullscreen === 'boolean' && { forceFullscreen: data.forceFullscreen }),
      ...(typeof data.randomizeSoal === 'boolean' && { randomizeSoal: data.randomizeSoal }),
      ...(typeof data.randomizeOpsi === 'boolean' && { randomizeOpsi: data.randomizeOpsi }),
    };

    // Konversi empty string ke null untuk relasi opsional
    if (!updateData.examGroupId) {
      delete updateData.examGroupId; // jangan update jika kosong
    }

    // SEB keys: hapus jika requireSeb false
    if (updateData.requireSeb === false) {
      updateData.sebConfigKey = null;
      updateData.sebBrowserKey = null;
    }

    if (data.startTime) {
      updateData.startTime = new Date(data.startTime);
    }
    if (data.endTime) {
      updateData.endTime = new Date(data.endTime);
    }

    if (questionIds && questionIds.length > 0) {
      // Hapus soal lama lalu buat ulang
      await this.prisma.examQuestion.deleteMany({
        where: { examId: id },
      });
      updateData.examQuestions = {
        create: questionIds.map((qId: string, index: number) => ({
          questionId: qId,
          order: index,
        })),
      };
    }

    if (Array.isArray(rombelIds)) {
      await this.prisma.examTargetRombel.deleteMany({
        where: { examId: id },
      });
      if (rombelIds.length > 0) {
        updateData.targetRombels = {
          create: rombelIds.map((rombelId: string) => ({
            rombelId,
          })),
        };
      }
    }

    if (Array.isArray(majorIds)) {
      await this.prisma.examTargetMajor.deleteMany({
        where: { examId: id },
      });
      if (majorIds.length > 0) {
        updateData.targetMajors = {
          create: majorIds.map((majorId: string) => ({
            majorId,
          })),
        };
      }
    }

    return this.prisma.exam.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        examGroup: true,
        examQuestions: {
          include: { question: { include: { options: true } } },
        },
        targetRombels: true,
        targetMajors: true,
      },
    });
  }

  async remove(id: string) {
    return this.prisma.$transaction(async (tx) => {
      await tx.answer.deleteMany({
        where: {
          examSession: {
            examId: id,
          },
        },
      });

      await tx.violation.deleteMany({
        where: {
          examSession: {
            examId: id,
          },
        },
      });

      await tx.examSession.deleteMany({
        where: { examId: id },
      });

      await tx.examQuestion.deleteMany({
        where: { examId: id },
      });

      return tx.exam.delete({
        where: { id },
      });
    });
  }

  async validateSeb(examId: string, userAgent: string, sebConfigKey: string, sebBrowserKey: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return false;
    
    return this.isSebAllowed(exam.requireSeb, userAgent, sebConfigKey, sebBrowserKey, exam.sebConfigKey, exam.sebBrowserKey);
  }

  async generatePdf(id: string): Promise<Buffer> {
    const pdfkit = require('pdfkit');
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        subject: true,
        teacher: { include: { user: true } },
        examSessions: {
          include: {
            student: { include: { user: true } },
            answers: { include: { question: true } },
          },
        },
      },
    });
    if (!exam) throw new Error('Exam not found');

    return new Promise<Buffer>((resolve, reject) => {
      const doc = new pdfkit({ margin: 50 });
      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // School Branding Header
      doc.fillColor('#1e1b4b').fontSize(11).font('Helvetica-Bold').text('LAPORAN HASIL UJIAN CBT', { align: 'left' });
      doc.fontSize(8).font('Helvetica').fillColor('#6b7280').text('Sistem Ujian Premium & Professional', { align: 'left' });
      doc.moveTo(50, 70).lineTo(562, 70).strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(2);

      // Exam Details Header
      let currentY = doc.y;
      doc.fillColor('#1f2937').fontSize(15).font('Helvetica-Bold').text(exam.title, 50, currentY);
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica').fillColor('#4b5563')
        .text(`Mata Pelajaran : ${exam.subject.name}`)
        .text(`Guru Pengampu  : ${exam.teacher.user.fullName}`)
        .text(`KKM / Kelulusan : ${exam.passingGrade ?? 75}`);
      
      doc.moveDown(1.5);

      // Table Header Layout
      let y = doc.y;
      doc.rect(50, y, 512, 25).fill('#f3f4f6');
      doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
      doc.text('Nama Siswa', 60, y + 8);
      doc.text('Nilai', 320, y + 8, { width: 60, align: 'right' });
      doc.text('Status Ujian', 420, y + 8);
      doc.text('Kelulusan', 490, y + 8);
      y += 32;

      doc.font('Helvetica');
      exam.examSessions.forEach((s) => {
        // Page break safety check
        if (y > 700) {
          doc.addPage();
          y = 50;
          doc.rect(50, y, 512, 25).fill('#f3f4f6');
          doc.fillColor('#111827').fontSize(10).font('Helvetica-Bold');
          doc.text('Nama Siswa', 60, y + 8);
          doc.text('Nilai', 320, y + 8, { width: 60, align: 'right' });
          doc.text('Status Ujian', 420, y + 8);
          doc.text('Kelulusan', 490, y + 8);
          y += 32;
        }

        doc.fillColor('#374151').fontSize(9).font('Helvetica');
        doc.text(`${s.student.user.fullName}`, 60, y);
        const scoreVal = s.score ?? 0;
        doc.text(`${s.score ?? '-'}`, 320, y, { width: 60, align: 'right' });
        
        // Status Ujian
        let statusText = 'Mengerjakan';
        let statusColor = '#374151';
        if (s.status === 'SUBMITTED' || s.status === 'FINISHED') {
          statusText = 'Selesai';
          statusColor = '#10b981';
        } else if (s.status === 'LOCKED') {
          statusText = 'Terkunci';
          statusColor = '#ef4444';
        }
        doc.fillColor(statusColor).text(statusText, 420, y);

        // KKM Status
        const hasPassed = scoreVal >= (exam.passingGrade ?? 75);
        if (s.status === 'SUBMITTED' || s.status === 'FINISHED') {
          if (hasPassed) {
            doc.fillColor('#10b981').text('LULUS', 490, y);
          } else {
            doc.fillColor('#ef4444').text('TIDAK LULUS', 490, y);
          }
        } else {
          doc.fillColor('#9ca3af').text('-', 490, y);
        }

        // Draw light horizontal separator line
        doc.moveTo(50, y + 14).lineTo(562, y + 14).strokeColor('#f3f4f6').lineWidth(0.5).stroke();
        y += 20;
      });

      doc.end();
    });
  }

  async analytics(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        examQuestions: { include: { question: true } },
        examSessions: { include: { answers: { include: { question: true } } } },
      },
    });
    if (!exam) return null;
    const scores = exam.examSessions.map((s) => s.score ?? 0);
    const passed = scores.filter((s) => s >= exam.passingGrade).length;
    const failed = scores.length - passed;
    const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
    const buckets = [
      { label: '<50', count: scores.filter((s) => s < 50).length },
      { label: '50-65', count: scores.filter((s) => s >= 50 && s <= 65).length },
      { label: '66-80', count: scores.filter((s) => s >= 66 && s <= 80).length },
      { label: '81-100', count: scores.filter((s) => s >= 81).length },
    ];
    const cleanHtml = (html: string) => {
      if (!html) return '';
      return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();
    };

    const itemAnalysis = exam.examQuestions.map((eq) => {
      const answers = exam.examSessions.flatMap((s) => s.answers.filter((a) => a.questionId === eq.questionId));
      const correct = answers.filter((a) => a.isCorrect).length;
      const plainContent = cleanHtml(eq.question.content);
      const contentPreview = plainContent.length > 80 ? plainContent.slice(0, 80) + '...' : plainContent;
      return { questionId: eq.questionId, content: contentPreview, correct, total: answers.length, difficulty: answers.length ? correct / answers.length : 0 };
    });
    return { exam, summary: { passed, failed, highest: Math.max(...scores, 0), lowest: Math.min(...scores, 0), average: avg }, distribution: buckets, itemAnalysis };
  }

  isSebAllowed(
    requireSeb: boolean,
    userAgent: string,
    sebConfigKey: string,
    sebBrowserKey: string,
    expectedSebConfigKey?: string | null,
    expectedSebBrowserKey?: string | null,
  ) {
    if (requireSeb) {
      const ua = (userAgent || '').toLowerCase();
      if (!ua.includes('seb') && !ua.includes('safeexambrowser')) {
        return false;
      }
    }
    if (expectedSebConfigKey && expectedSebConfigKey !== sebConfigKey) return false;
    if (expectedSebBrowserKey && expectedSebBrowserKey !== sebBrowserKey) return false;
    return true;
  }
}
