import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { UpdateSubjectDto } from './dto/update-subject.dto';

function parseCsvLine(line: string) {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

@Injectable()
export class SubjectsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.subject.findMany({
      include: {
        teachers: { select: { id: true, user: { select: { fullName: true } } } },
        _count: { select: { questionBanks: true, exams: true, teachers: true } },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
      include: {
        teachers: { select: { id: true, user: { select: { fullName: true, username: true } } } },
        questionBanks: true,
        exams: true,
        _count: { select: { questionBanks: true, exams: true, teachers: true } },
      },
    });

    if (!subject) throw new NotFoundException('Mata pelajaran tidak ditemukan');
    return subject;
  }

  async create(dto: CreateSubjectDto) {
    const code = dto.code.toUpperCase();
    const existing = await this.prisma.subject.findFirst({
      where: { OR: [{ name: dto.name }, { code }] },
    });
    if (existing) {
      throw new BadRequestException('Mata pelajaran dengan nama atau kode tersebut sudah terdaftar');
    }

    return this.prisma.subject.create({
      data: {
        name: dto.name,
        code,
        description: dto.description,
        teachers: dto.teacherIds?.length ? { connect: dto.teacherIds.map((id) => ({ id })) } : undefined,
      },
      include: {
        teachers: { select: { id: true, user: { select: { fullName: true } } } },
        _count: { select: { questionBanks: true, exams: true, teachers: true } },
      },
    });
  }

  async importFromCsv(csvContent: string) {
    const lines = csvContent.replace(/\r/g, '').split('\n').filter((line) => line.trim());
    if (lines.length < 2) {
      throw new BadRequestException('CSV minimal harus memiliki header dan satu baris data');
    }

    const header = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const required = ['name', 'code', 'description', 'teacherusernames'];
    const missing = required.filter((field) => !header.includes(field));
    if (missing.length) {
      throw new BadRequestException(`Kolom CSV wajib: ${missing.join(', ')}`);
    }

    const imported: unknown[] = [];
    const errors: string[] = [];

    for (let i = 1; i < lines.length; i++) {
      const lineNo = i + 1;
      const cells = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};
      header.forEach((key, idx) => {
        row[key] = cells[idx] || '';
      });

      const name = (row.name || '').trim();
      const code = (row.code || '').trim().toUpperCase();
      const description = (row.description || '').trim() || null;
      const teacherUsernames = (row.teacherusernames || '').split('|').map((v) => v.trim()).filter(Boolean);

      if (!name || !code) {
        errors.push(`Baris ${lineNo}: name dan code wajib diisi`);
        continue;
      }

      const teacherRecords = teacherUsernames.length
        ? await this.prisma.teacher.findMany({
            where: { user: { username: { in: teacherUsernames } } },
            include: { user: true },
          })
        : [];

      if (teacherRecords.length !== teacherUsernames.length) {
        const found = new Set(teacherRecords.map((t) => t.user.username));
        const missingTeachers = teacherUsernames.filter((u) => !found.has(u));
        errors.push(`Baris ${lineNo}: guru tidak ditemukan: ${missingTeachers.join(', ')}`);
        continue;
      }

      const existing = await this.prisma.subject.findFirst({ where: { OR: [{ name }, { code }] } });
      const subject = existing
        ? await this.prisma.subject.update({
            where: { id: existing.id },
            data: {
              name,
              code,
              description,
              teachers: teacherRecords.length
                ? {
                    set: [],
                    connect: teacherRecords.map((teacher) => ({ id: teacher.id })),
                  }
                : undefined,
            },
          })
        : await this.prisma.subject.create({
            data: {
              name,
              code,
              description,
              teachers: teacherRecords.length
                ? { connect: teacherRecords.map((teacher) => ({ id: teacher.id })) }
                : undefined,
            },
          });

      imported.push(subject);
    }

    if (errors.length) {
      throw new BadRequestException({
        message: 'Sebagian baris CSV gagal diproses',
        importedCount: imported.length,
        errors,
      });
    }

    return { success: true, importedCount: imported.length };
  }

  async update(id: string, dto: UpdateSubjectDto) {
    const subject = await this.findOne(id);
    const code = dto.code?.toUpperCase();

    if (dto.name && dto.name !== subject.name) {
      const existingName = await this.prisma.subject.findFirst({ where: { name: dto.name, id: { not: id } } });
      if (existingName) throw new BadRequestException('Nama mata pelajaran sudah terdaftar');
    }
    if (code && code !== subject.code) {
      const existingCode = await this.prisma.subject.findFirst({ where: { code, id: { not: id } } });
      if (existingCode) throw new BadRequestException('Kode mata pelajaran sudah terdaftar');
    }

    return this.prisma.subject.update({
      where: { id },
      data: {
        name: dto.name,
        code,
        description: dto.description,
        teachers: dto.teacherIds
          ? {
              set: [],
              connect: dto.teacherIds.map((teacherId) => ({ id: teacherId })),
            }
          : undefined,
      },
      include: {
        teachers: { select: { id: true, user: { select: { fullName: true } } } },
        _count: { select: { questionBanks: true, exams: true, teachers: true } },
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.subject.delete({ where: { id } });
    return { success: true, message: 'Mata pelajaran berhasil dihapus' };
  }
}
