import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRombelDto } from './dto/create-rombel.dto';
import { UpdateRombelDto } from './dto/update-rombel.dto';

@Injectable()
export class RombelsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRombelDto) {
    const existing = await this.prisma.rombel.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new ConflictException('Rombel with this name already exists');
    }

    const majorExists = await this.prisma.major.findUnique({
      where: { id: dto.majorId },
    });

    if (!majorExists) {
      throw new NotFoundException('Major not found');
    }

    return this.prisma.rombel.create({
      data: dto,
      include: { major: true },
    });
  }

  async findAll() {
    return this.prisma.rombel.findMany({
      include: { major: true, _count: { select: { students: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const rombel = await this.prisma.rombel.findUnique({
      where: { id },
      include: { major: true, students: { include: { user: true } } },
    });

    if (!rombel) throw new NotFoundException('Rombel not found');
    return rombel;
  }

  async update(id: string, dto: UpdateRombelDto) {
    const rombel = await this.prisma.rombel.findUnique({ where: { id } });
    if (!rombel) throw new NotFoundException('Rombel not found');

    if (dto.name && dto.name !== rombel.name) {
      const existing = await this.prisma.rombel.findUnique({ where: { name: dto.name } });
      if (existing) throw new ConflictException('Rombel name already in use');
    }

    if (dto.majorId) {
      const majorExists = await this.prisma.major.findUnique({ where: { id: dto.majorId } });
      if (!majorExists) throw new NotFoundException('Major not found');
    }

    return this.prisma.rombel.update({
      where: { id },
      data: dto,
      include: { major: true },
    });
  }

  async remove(id: string) {
    const rombel = await this.prisma.rombel.findUnique({ where: { id } });
    if (!rombel) throw new NotFoundException('Rombel not found');

    return this.prisma.rombel.delete({ where: { id } });
  }

  async updateStudents(rombelId: string, studentIds: string[]) {
    const rombel = await this.prisma.rombel.findUnique({ where: { id: rombelId } });
    if (!rombel) throw new NotFoundException('Rombel not found');

    return this.prisma.$transaction(async (tx) => {
      // Disconnect all students currently in this rombel
      await tx.student.updateMany({
        where: { rombelId },
        data: { rombelId: null },
      });

      // Connect the selected students to this rombel
      if (studentIds.length > 0) {
        await tx.student.updateMany({
          where: { id: { in: studentIds } },
          data: { rombelId },
        });
      }
      return { success: true };
    });
  }

  async generateTemplate(): Promise<Buffer> {
    const csvContent = 'Nama Rombel,Kode Jurusan\n' +
      'X RPL 1,RPL\n' +
      'XI TKJ 2,TKJ\n' +
      'XII AKL 1,AKL\n';
    return Buffer.from(csvContent, 'utf-8');
  }

  async importRombels(fileBuffer: Buffer) {
    const csvString = fileBuffer.toString('utf-8');
    const lines = csvString.split(/\r?\n/);

    const imported: { name: string; majorId: string }[] = [];
    const warnings: { row: number; reason: string }[] = [];
    let totalParsed = 0;

    // Fetch all majors to cache them and make lookup super fast
    const majors = await this.prisma.major.findMany();
    const majorMap = new Map<string, string>(); // code (lowercase) -> id
    majors.forEach((m) => {
      majorMap.set(m.code.toLowerCase(), m.id);
    });

    // Start parsing from row 2 (index 1)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue; // Skip empty lines

      // Split by comma or semicolon
      const cols = line.includes(';') ? line.split(';') : line.split(',');
      const name = cols[0] ? cols[0].trim() : '';
      const majorCode = cols[1] ? cols[1].trim() : '';

      const rowNumber = i + 1;

      if (!name) {
        warnings.push({ row: rowNumber, reason: 'Nama Rombel kosong' });
        continue;
      }

      if (!majorCode) {
        warnings.push({ row: rowNumber, reason: `Kode Jurusan untuk rombel "${name}" kosong` });
        continue;
      }

      const majorId = majorMap.get(majorCode.toLowerCase());
      if (!majorId) {
        warnings.push({ row: rowNumber, reason: `Kode Jurusan "${majorCode}" untuk rombel "${name}" tidak ditemukan` });
        continue;
      }

      totalParsed++;
      imported.push({ name, majorId });
    }

    let successCount = 0;
    // Process insertions
    for (const item of imported) {
      try {
        await this.prisma.rombel.upsert({
          where: { name: item.name },
          update: { majorId: item.majorId },
          create: { name: item.name, majorId: item.majorId },
        });
        successCount++;
      } catch (err: any) {
        warnings.push({ row: 0, reason: `Gagal memproses rombel "${item.name}": ${err.message}` });
      }
    }

    return {
      totalParsed,
      imported: successCount,
      warnings,
    };
  }
}
