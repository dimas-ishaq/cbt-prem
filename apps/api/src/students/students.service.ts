import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateStudentDto) {
    // Generate strong random temporary password
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
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
            ...(dto.rombelId
              ? { rombel: { connect: { id: dto.rombelId } } }
              : {}),
          },
        },
      },
      include: { student: true },
    }).then(user => ({ ...user, temporaryPassword: tempPassword }));
  }

  async findAll(majorId?: string, rombelId?: string, grade?: string) {
    const where: any = {};
    if (majorId) where.majorId = majorId;
    if (rombelId) {
      where.rombelId = rombelId === 'no-class' ? null : rombelId;
    } else if (grade) {
      where.rombel = {
        name: { startsWith: grade, mode: 'insensitive' },
      };
    }
    return this.prisma.student.findMany({
      where,
      include: { user: true, rombel: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.student.findUnique({
      where: { id },
      include: { user: true },
    });
  }

  async getMyProfile(userId: string) {
    const student = await this.prisma.student.findUnique({
      where: { userId },
      include: { user: true, rombel: true, major: true },
    });
    if (!student) return null;
    return {
      id: student.id,
      nis: student.nis,
      fullName: student.user.fullName,
      photo: student.user.photo,
      username: student.user.username,
      email: student.user.email,
      role: student.user.role,
      majorId: student.majorId,
      major: student.major ?? null,
      rombelId: student.rombelId,
      rombel: student.rombel ?? null,
    };
  }

  async updatePhoto(userId: string, photoUrl: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { photo: photoUrl },
    });
  }

  async remove(id: string) {
    const student = await this.prisma.student.findUnique({ where: { id } });
    if (student) {
      return this.prisma.user.delete({ where: { id: student.userId } });
    }
    return null;
  }
}
