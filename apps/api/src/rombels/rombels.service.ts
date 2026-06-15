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
}
