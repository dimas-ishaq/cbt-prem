import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { username },
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({
      data: {
        ...data,
        password: hashedPassword,
      },
    });
  }

  async exportAllUsers(): Promise<string> {
    const users = await this.prisma.user.findMany({
      include: {
        student: true,
        teacher: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['username', 'email', 'fullName', 'role', 'nis', 'class', 'nip'];
    const escapeCsv = (str: string | null | undefined) => {
      if (str === null || str === undefined) return '';
      const stringified = String(str);
      if (stringified.includes(',') || stringified.includes('"') || stringified.includes('\n')) {
        return `"${stringified.replace(/"/g, '""')}"`;
      }
      return stringified;
    };

    const csvRows = [headers.join(',')];
    for (const u of users) {
      const row = [
        escapeCsv(u.username),
        escapeCsv(u.email),
        escapeCsv(u.fullName),
        escapeCsv(u.role),
        escapeCsv(u.student?.nis),
        escapeCsv(u.student?.class),
        escapeCsv(u.teacher?.nip),
      ];
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  async importUsers(users: any[]) {
    const defaultPassword = 'password123';
    const results = { created: 0, updated: 0, errors: [] as string[] };

    for (const u of users) {
      try {
        if (!u.username || !u.fullName || !u.role) {
          results.errors.push(`Username, Nama Lengkap, dan Role wajib diisi untuk data: ${JSON.stringify(u)}`);
          continue;
        }

        const roleValue = u.role.toUpperCase();
        const validRoles = ['SUPER_ADMIN', 'ADMIN_SEKOLAH', 'GURU', 'PENGAWAS', 'SISWA'];
        if (!validRoles.includes(roleValue)) {
          results.errors.push(`Role tidak valid '${u.role}' untuk user ${u.username}`);
          continue;
        }

        const existingUser = await this.prisma.user.findUnique({
          where: { username: u.username },
          include: { student: true, teacher: true },
        });

        const hashedPassword = u.password 
          ? await bcrypt.hash(u.password, 10) 
          : existingUser 
            ? undefined
            : await bcrypt.hash(defaultPassword, 10);

        if (existingUser) {
          await this.prisma.user.update({
            where: { id: existingUser.id },
            data: {
              email: u.email || existingUser.email,
              fullName: u.fullName,
              role: roleValue as any,
              ...(hashedPassword ? { password: hashedPassword } : {}),
            },
          });

          if (roleValue === 'SISWA') {
            if (existingUser.student) {
              await this.prisma.student.update({
                where: { id: existingUser.student.id },
                data: {
                  nis: u.nis || existingUser.student.nis,
                  class: u.class || existingUser.student.class,
                },
              });
            } else {
              await this.prisma.student.create({
                data: {
                  userId: existingUser.id,
                  nis: u.nis || `NIS-${Date.now()}`,
                  class: u.class || '',
                },
              });
            }
          } else {
            if (existingUser.teacher) {
              await this.prisma.teacher.update({
                where: { id: existingUser.teacher.id },
                data: {
                  nip: u.nip || existingUser.teacher.nip,
                },
              });
            } else {
              await this.prisma.teacher.create({
                data: {
                  userId: existingUser.id,
                  nip: u.nip || null,
                },
              });
            }
          }
          results.updated++;
        } else {
          const userCreateData: Prisma.UserCreateInput = {
            username: u.username,
            email: u.email || `${u.username}@cbt.enterprise`,
            fullName: u.fullName,
            password: hashedPassword!,
            role: roleValue as any,
          };

          if (roleValue === 'SISWA') {
            await this.prisma.user.create({
              data: {
                ...userCreateData,
                student: {
                  create: {
                    nis: u.nis || `NIS-${Date.now()}`,
                    class: u.class || '',
                  },
                },
              },
            });
          } else {
            await this.prisma.user.create({
              data: {
                ...userCreateData,
                teacher: {
                  create: {
                    nip: u.nip || null,
                  },
                },
              },
            });
          }
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Gagal memproses user ${u.username || 'unknown'}: ${err.message}`);
      }
    }

    return results;
  }
}
