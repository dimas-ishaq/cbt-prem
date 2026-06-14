import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExamDto } from './dto/create-exam.dto';

@Injectable()
export class ExamsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateExamDto, teacherId: string) {
    const { questionIds, ...examData } = dto;
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
      },
    });
  }

  async findAll() {
    return this.prisma.exam.findMany({
      include: { 
        subject: true, 
        teacher: { include: { user: true } },
        _count: {
          select: { examSessions: true }
        }
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.exam.findUnique({
      where: { id },
      include: { 
        subject: true, 
        examQuestions: { 
          include: { 
            question: { 
              include: { options: true } 
            } 
          } 
        } 
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.exam.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.exam.delete({
      where: { id },
    });
  }

  async validateSeb(examId: string, sebConfigKey: string, sebBrowserKey: string) {
    const exam = await this.prisma.exam.findUnique({ where: { id: examId } });
    if (!exam) return false;
    
    // In production, we would compare hashes provided by SEB
    // SEB-Config-Key and SEB-Browser-Exam-Key headers
    if (exam.sebConfigKey && exam.sebConfigKey !== sebConfigKey) {
      return false;
    }
    return true;
  }
}
