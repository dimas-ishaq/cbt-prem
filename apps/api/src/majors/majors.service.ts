import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMajorDto } from './dto/create-major.dto';
import { UpdateMajorDto } from './dto/update-major.dto';

@Injectable()
export class MajorsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.major.findMany({
      include: {
        _count: {
          select: { students: true },
        },
      },
      orderBy: { code: 'asc' },
    });
  }

  async findOne(id: string) {
    const major = await this.prisma.major.findUnique({
      where: { id },
      include: {
        students: true,
      },
    });
    if (!major) {
      throw new NotFoundException('Jurusan tidak ditemukan');
    }
    return major;
  }

  async create(dto: CreateMajorDto) {
    const existing = await this.prisma.major.findFirst({
      where: {
        OR: [{ name: dto.name }, { code: dto.code.toUpperCase() }],
      },
    });
    if (existing) {
      throw new BadRequestException('Jurusan dengan Nama atau Kode tersebut sudah terdaftar');
    }

    return this.prisma.major.create({
      data: {
        name: dto.name,
        code: dto.code.toUpperCase(),
        description: dto.description,
      },
    });
  }

  async update(id: string, dto: UpdateMajorDto) {
    const major = await this.findOne(id);

    if (dto.name && dto.name !== major.name) {
      const existingName = await this.prisma.major.findFirst({
        where: { name: dto.name, id: { not: id } },
      });
      if (existingName) {
        throw new BadRequestException('Nama jurusan sudah terdaftar');
      }
    }

    if (dto.code && dto.code.toUpperCase() !== major.code) {
      const existingCode = await this.prisma.major.findFirst({
        where: { code: dto.code.toUpperCase(), id: { not: id } },
      });
      if (existingCode) {
        throw new BadRequestException('Kode jurusan sudah terdaftar');
      }
    }

    return this.prisma.major.update({
      where: { id },
      data: {
        name: dto.name,
        code: dto.code ? dto.code.toUpperCase() : undefined,
        description: dto.description,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.major.delete({
      where: { id },
    });
    return { success: true, message: 'Jurusan berhasil dihapus' };
  }
}
