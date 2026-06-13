import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    const hashedPassword = await bcrypt.hash('password123', 10); // Default password
    return this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        fullName: dto.fullName,
        password: hashedPassword,
        role: Role.SISWA,
        student: {
          create: {
            nis: dto.nis,
            class: dto.class,
          },
        },
      },
      include: {
        student: true,
      },
    });
  }

  async findAll() {
    return this.prisma.student.findMany({
      include: { user: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (student) {
      return this.prisma.user.delete({ where: { id: student.userId } });
    }
  }
}
