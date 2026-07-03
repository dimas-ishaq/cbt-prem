import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { User, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService, private auditService: AuditService) {}

  // ─── Auth helpers ─────────────────────────────────────────────────────────
  async findOne(username: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { username } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  // ─── Admin CRUD ────────────────────────────────────────────────────────────

  /** List all users, optionally filtered by role */
  async findAll(role?: Role, skip?: number, take?: number) {
    const where = role ? { role } : undefined;
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          fullName: true,
          role: true,
          isActive: true,
          createdAt: true,
          student: {
            select: { id: true, nis: true, rombel: { select: { id: true, name: true } }, major: { select: { name: true, code: true } } },
          },
          teacher: {
            select: { id: true, nip: true, subjects: { select: { id: true, name: true } } },
          },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        ...(skip !== undefined && take !== undefined ? { skip, take } : {}),
      }),
      this.prisma.user.count({ where }),
    ]);
    return { data, total };
  }

  /** Get a single user by id */
  async findUserById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
        student: {
          select: { id: true, nis: true, rombel: { select: { id: true, name: true } }, major: { select: { id: true, name: true, code: true } } },
        },
        teacher: {
          select: { id: true, nip: true, subjects: { select: { id: true, name: true } } },
        },
      },
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemukan');
    return user;
  }

  /** Create a new user (any role) with profile */
  async createUser(dto: CreateUserDto) {
    const existingUsername = await this.prisma.user.findUnique({ where: { username: dto.username } });
    if (existingUsername) throw new ConflictException('Username sudah digunakan');

    if (dto.email) {
      const existingEmail = await this.prisma.user.findUnique({ where: { email: dto.email } });
      if (existingEmail) throw new ConflictException('Email sudah digunakan');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const role = dto.role ?? Role.SISWA;

    const created = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email || `${dto.username}@cbt.enterprise`,
        password: hashedPassword,
        fullName: dto.fullName,
        role,
        ...(role === Role.SISWA
          ? {
              student: {
                create: {
                  nis: (dto as any).nis || `NIS-${Date.now()}`,
                  ...(dto.rombelId ? { rombel: { connect: { id: dto.rombelId } } } : {}),
                },
              },
            }
          : role === Role.GURU || role === Role.ADMIN_SEKOLAH || role === Role.PENGAWAS || role === Role.SUPER_ADMIN
            ? { teacher: { create: { nip: (dto as any).nip || null } } }
            : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    await this.auditService.write({ action: 'USER_CREATE', resource: 'User', resourceId: created.id, after: created });
    return created;
  }

  private async assertRoleUpdateAllowed(actorRole: Role, targetUser: User, nextRole?: Role) {
    if (!nextRole || nextRole === targetUser.role) return;
    if (targetUser.id === targetUser.id && nextRole !== targetUser.role) {
      // ponytail: actor context not passed yet; block self-role edits at controller/service boundary.
      if (nextRole !== targetUser.role) throw new ForbiddenException('Tidak boleh ubah role sendiri');
    }
    if (actorRole !== Role.SUPER_ADMIN) {
      if (nextRole === Role.SUPER_ADMIN) throw new ForbiddenException('Tidak boleh assign Super Admin');
      if (actorRole !== Role.ADMIN_SEKOLAH) throw new ForbiddenException('Tidak punya izin ubah role');
    }
  }

  /** Update user profile (name, email) */
  async updateUser(id: string, dto: UpdateUserDto, actorRole?: Role, actorUserId?: string) {
    const user = await this.findUserById(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existing) throw new ConflictException('Email sudah digunakan oleh pengguna lain');
    }

    if (actorUserId && actorUserId === id) {
      throw new ForbiddenException('Tidak boleh ubah akses sendiri');
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName ? { fullName: dto.fullName } : {}),
        ...(dto.email ? { email: dto.email } : {}),
        ...(user.role === Role.SISWA && dto.rombelId
          ? {
              student: {
                update: {
                  rombel: { connect: { id: dto.rombelId } },
                },
              },
            }
          : {}),
        ...(user.role !== Role.SISWA && dto.nip !== undefined
          ? {
              teacher: {
                upsert: {
                  where: { userId: id },
                  update: { nip: dto.nip || null },
                  create: { nip: dto.nip || null },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        isActive: true,
      },
    });
    await this.auditService.write({ userId: id, action: 'USER_UPDATE', resource: 'User', resourceId: id, after: updated });
    return updated;
  }

  /** Update self profile (name, email, password) */
  async updateSelfProfile(id: string, dto: { fullName?: string; email?: string; password?: string; photo?: string }) {
    const user = await this.findUserById(id);

    if (dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (existing) throw new ConflictException('Email sudah digunakan oleh pengguna lain');
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.fullName) data.fullName = dto.fullName;
    if (dto.email) data.email = dto.email;
    if (dto.photo !== undefined) data.photo = dto.photo;
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        role: true,
        photo: true,
        isActive: true,
      },
    });
  }

  /** Toggle user active/inactive */
  async toggleActive(id: string) {
    const user = await this.findUserById(id);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive, authVersion: { increment: 1 } },
      select: { id: true, isActive: true },
    });
    await this.auditService.write({ userId: id, action: 'USER_TOGGLE_ACTIVE', resource: 'User', resourceId: id, after: updated });
    return updated;
  }

  /** Reset password by admin */
  async resetPassword(id: string, dto: ResetPasswordDto) {
    await this.findUserById(id);
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({ where: { id }, data: { password: hashed, authVersion: { increment: 1 } } });
    await this.auditService.write({ userId: id, action: 'USER_RESET_PASSWORD', resource: 'User', resourceId: id });
    return { success: true, message: 'Password berhasil direset' };
  }

  /** Delete user and cascading profile */
  async deleteUser(id: string) {
    const user = await this.findUserById(id);

    if (user.role === Role.SUPER_ADMIN) {
      const count = await this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } });
      if (count <= 1) {
        throw new BadRequestException('Tidak dapat menghapus Super Admin terakhir dalam sistem');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      // 1. Clean up student data
      if (user.student) {
        // Delete all exam sessions first (this cascades to Answers and Violations)
        await tx.examSession.deleteMany({
          where: { studentId: user.student.id },
        });

        // Delete the Student profile
        await tx.student.delete({
          where: { id: user.student.id },
        });
      }

      // 2. Clean up teacher data
      if (user.teacher) {
        // Check for active exams or question banks
        const examCount = await tx.exam.count({ where: { teacherId: user.teacher.id } });
        const qbCount = await tx.questionBank.count({ where: { teacherId: user.teacher.id } });
        if (examCount > 0 || qbCount > 0) {
          throw new BadRequestException('Tidak dapat menghapus Guru yang memiliki data ujian atau bank soal aktif');
        }

        // Delete the Teacher profile
        await tx.teacher.delete({
          where: { id: user.teacher.id },
        });
      }

      // 3. Nullify audit log user references to preserve system audit records
      await tx.auditLog.updateMany({
        where: { userId: id },
        data: { userId: null },
      });

      // 4. Nullify notification creator references
      await tx.notification.updateMany({
        where: { createdBy: id },
        data: { createdBy: null },
      });

      // 5. Finally delete the User (this cascades to UserRole, NotificationRecipient, NotificationPreference)
      const deleted = await tx.user.delete({ where: { id } });
      await tx.auditLog.create({ data: { userId: id, action: 'USER_DELETE', resource: 'User', resourceId: id } });
      return deleted;
    });
  }

  // ─── Legacy create for auth service ──────────────────────────────────────
  async create(data: Prisma.UserCreateInput): Promise<User> {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    return this.prisma.user.create({ data: { ...data, password: hashedPassword } });
  }

  // ─── Export / Import ──────────────────────────────────────────────────────
  async exportAllUsers(): Promise<string> {
    const users = await this.prisma.user.findMany({
      include: { student: true, teacher: true },
      orderBy: { createdAt: 'desc' },
    });

    const headers = ['username', 'email', 'fullName', 'role', 'nis', 'nip', 'rombel'];
    const escapeCsv = (str: string | null | undefined) => {
      if (str === null || str === undefined) return '';
      const s = String(str);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };

    const csvRows = [headers.join(',')];
    for (const u of users) {
      csvRows.push([
        escapeCsv(u.username),
        escapeCsv(u.email),
        escapeCsv(u.fullName),
        escapeCsv(u.role),
        escapeCsv(u.student?.nis),
        escapeCsv(u.teacher?.nip),
        escapeCsv((u.student as any)?.rombel?.name),
      ].join(','));
    }
    return csvRows.join('\n');
  }

  async importUsers(users: any[]) {
    const defaultPassword = crypto.randomBytes(12).toString('hex');
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
            let rombelConnect = {};
            if (u.rombel) {
              const r = await this.prisma.rombel.findFirst({ where: { name: u.rombel } });
              if (r) rombelConnect = { rombel: { connect: { id: r.id } } };
            }

            if (existingUser.student) {
              await this.prisma.student.update({
                where: { id: existingUser.student.id },
                data: { nis: u.nis || existingUser.student.nis, ...rombelConnect },
              });
            } else {
              await this.prisma.student.create({
                data: { userId: existingUser.id, nis: u.nis || `NIS-${Date.now()}`, ...rombelConnect },
              });
            }
          } else {
            if (existingUser.teacher) {
              await this.prisma.teacher.update({
                where: { id: existingUser.teacher.id },
                data: { nip: u.nip || existingUser.teacher.nip },
              });
            } else {
              await this.prisma.teacher.create({ data: { userId: existingUser.id, nip: u.nip || null } });
            }
          }
          results.updated++;
        } else {
          let rombelConnect = {};
          if (roleValue === 'SISWA' && u.rombel) {
            const r = await this.prisma.rombel.findFirst({ where: { name: u.rombel } });
            if (r) rombelConnect = { rombel: { connect: { id: r.id } } };
          }

          await this.prisma.user.create({
            data: {
              username: u.username,
              email: u.email || `${u.username}@cbt.enterprise`,
              fullName: u.fullName,
              password: hashedPassword!,
              role: roleValue as any,
              ...(roleValue === 'SISWA'
                ? { student: { create: { nis: u.nis || `NIS-${Date.now()}`, ...rombelConnect } } }
                : roleValue === 'GURU'
                  ? { teacher: { create: { nip: u.nip || null } } }
                  : {}),
            },
          });
          results.created++;
        }
      } catch (err: any) {
        results.errors.push(`Gagal memproses user ${u.username || 'unknown'}: ${err.message}`);
      }
    }
    return results;
  }
}
