import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamGroupDto } from './dto/create-exam-group.dto';
import { UpdateExamGroupDto } from './dto/update-exam-group.dto';

@Injectable()
export class ExamGroupsService {
  constructor(private prisma: PrismaService) {}

  async create(createExamGroupDto: CreateExamGroupDto) {
    const data: any = { ...createExamGroupDto };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    return this.prisma.examGroup.create({
      data,
    });
  }

  async findAll(skip?: number, take?: number) {
    const [data, total] = await Promise.all([
      this.prisma.examGroup.findMany({
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { exams: true },
          },
        },
        ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
      }),
      this.prisma.examGroup.count(),
    ]);
    return { data, total };
  }

  async findOne(id: string) {
    const group = await this.prisma.examGroup.findUnique({
      where: { id },
      include: {
        exams: {
          include: {
            subject: true,
            _count: {
              select: { examSessions: true },
            },
          },
          orderBy: { startTime: 'asc' },
        },
      },
    });
    if (!group) throw new NotFoundException('Kelompok ujian tidak ditemukan');
    return group;
  }

  async update(id: string, updateExamGroupDto: UpdateExamGroupDto) {
    await this.findOne(id);
    const data: any = { ...updateExamGroupDto };
    if (data.startDate) data.startDate = new Date(data.startDate);
    if (data.endDate) data.endDate = new Date(data.endDate);
    return this.prisma.examGroup.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.examGroup.delete({
      where: { id },
    });
  }
}
