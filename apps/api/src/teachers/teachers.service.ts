import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

@Injectable()
export class TeachersService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTeacherDto) {
    const tempPassword = crypto.randomBytes(12).toString('hex');
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    return this.prisma.user
      .create({
        data: {
          username: dto.username,
          email: dto.email,
          fullName: dto.fullName,
          password: hashedPassword,
          role: Role.GURU,
          teacher: {
            create: {
              nip: dto.nip,
            },
          },
        },
        include: {
          teacher: true,
        },
      })
      .then((user) => ({ ...user, temporaryPassword: tempPassword }));
  }

  async findAll(search?: string, skip?: number, take?: number) {
    let userIds: string[] | undefined;
    if (search) {
      const users = await this.prisma.user.findMany({
        where: {
          OR: [
            { fullName: { contains: search, mode: 'insensitive' } },
            { username: { contains: search, mode: 'insensitive' } },
          ],
        },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
    }

    const where: any = userIds ? { userId: { in: userIds } } : undefined;
    const [data, total] = await Promise.all([
      this.prisma.teacher.findMany({
        where,
        select: {
          id: true,
          nip: true,
          user: {
            select: {
              fullName: true,
              username: true,
            },
          },
        },
        orderBy: {
          user: {
            fullName: 'asc',
          },
        },
        ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
      }),
      this.prisma.teacher.count({ where }),
    ]);
    return { data, total };
  }

  async remove(id: string) {
    const teacher = await this.prisma.teacher.findUnique({ where: { id } });
    if (teacher) {
      return this.prisma.user.delete({ where: { id: teacher.userId } });
    }
  }
}
