import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationTargetType, NotificationType } from './dto/create-notification.dto';
import { Role } from '@prisma/client';
import { NotificationPriority } from './dto/create-notification.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import { UpdateNotificationPolicyDto } from './dto/update-policy.dto';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  // Get all policies
  async getNotificationPolicies() {
    const roles = await this.prisma.customRole.findMany({
      include: {
        notificationPolicies: true,
      },
      orderBy: { name: 'asc' },
    });
    return roles;
  }

  // Update policy for a role
  async updateNotificationPolicy(dto: UpdateNotificationPolicyDto) {
    const { roleId, policies } = dto;
    await this.prisma.$transaction(async (tx) => {
      for (const policy of policies) {
        await tx.notificationRolePolicy.upsert({
          where: {
            roleId_type: {
              roleId,
              type: policy.type,
            },
          },
          update: {
            isEnabled: policy.isEnabled,
          },
          create: {
            roleId,
            type: policy.type,
            isEnabled: policy.isEnabled,
          },
        });
      }
    });
    return { success: true };
  }

  async create(dto: CreateNotificationDto, createdBy?: string) {
    if (!dto.targets?.length) {
      throw new ForbiddenException('Minimal satu target notifikasi harus diisi');
    }

    const resolvedTargets = await Promise.all(dto.targets.map((target) => this.resolveUserIdsByTarget(target)));
    let recipientUserIds = Array.from(new Set(resolvedTargets.flat())).filter(Boolean);

    if (recipientUserIds.length === 0) {
      throw new NotFoundException('Tidak ada penerima notifikasi yang valid');
    }

    // ── 1. POLICY-BASED & OWNERSHIP FILTERING ────────────────────
    // Ambil detail users penerima beserta role kustom mereka
    const usersWithRoles = await this.prisma.user.findMany({
      where: { id: { in: recipientUserIds } },
      include: {
        roles: {
          include: { role: { include: { notificationPolicies: true } } },
        },
      },
    });

    const filteredRecipients: string[] = [];

    // Tentukan context ujian jika tipe notifikasi berkaitan dengan ujian
    let examTeacherId: string | null = null;
    if (dto.type === NotificationType.EXAM_SUBMITTED || dto.type === NotificationType.VIOLATION_DETECTED) {
      if (dto.referenceId) {
        if (dto.referenceType === 'exam_session') {
          const session = await this.prisma.examSession.findUnique({
            where: { id: dto.referenceId },
            include: { exam: true },
          });
          if (session) {
            examTeacherId = session.exam.teacherId;
          }
        } else if (dto.referenceType === 'exam') {
          const exam = await this.prisma.exam.findUnique({
            where: { id: dto.referenceId },
          });
          if (exam) {
            examTeacherId = exam.teacherId;
          }
        }
      }
    }

    for (const u of usersWithRoles) {
      // Check Superadmin Policy
      let isAllowedByPolicy = true;
      
      // Kumpulkan semua custom role user
      const userCustomRoles = u.roles.map(r => r.role);
      
      if (userCustomRoles.length > 0) {
        // Cari apakah ada kebijakan yang menonaktifkan tipe ini untuk salah satu role user
        // (Sifat kebijakan mutlak: jika salah satu role user melarang tipe ini, maka dilarang)
        const isBlockedByAnyRole = userCustomRoles.some((role) => {
          const policy = role.notificationPolicies.find((p) => p.type === dto.type);
          return policy && policy.isEnabled === false;
        });

        if (isBlockedByAnyRole) {
          isAllowedByPolicy = false;
        }
      }

      if (!isAllowedByPolicy) {
        continue; // Lewati user jika diblokir oleh kebijakan Superadmin
      }

      // Check User Personal Preference (hanya jika diizinkan oleh kebijakan)
      const personalPref = await this.prisma.notificationPreference.findUnique({
        where: { userId_type: { userId: u.id, type: dto.type } },
      });
      if (personalPref && personalPref.enabled === false) {
        continue; // Lewati user jika dinonaktifkan di preferensi pribadinya
      }

      // Check Ownership Filter
      if (dto.type === NotificationType.EXAM_SUBMITTED || dto.type === NotificationType.VIOLATION_DETECTED) {
        // Jika user adalah GURU, pastikan dia adalah guru pengampu ujian tersebut
        if (u.role === 'GURU') {
          const teacherRecord = await this.prisma.teacher.findUnique({
            where: { userId: u.id },
          });
          if (!teacherRecord || teacherRecord.id !== examTeacherId) {
            continue; // Bukan guru pengampu ujian ini, lewati
          }
        }
      }

      filteredRecipients.push(u.id);
    }

    recipientUserIds = filteredRecipients;

    if (recipientUserIds.length === 0) {
      // Mengembalikan success: true (atau notifikasi kosong) alih-alih melempar error agar sistem pengerjaan ujian siswa tidak macet gara-gara notifikasi tidak dikirim
      return { success: true, message: 'Notifikasi tidak dikirim karena kebijakan pembatasan role / kepemilikan.' };
    }

    const notification = await (this.prisma as any).notification.create({
      data: {
        type: dto.type,
        priority: dto.priority ?? NotificationPriority.NORMAL,
        title: dto.title,
        message: dto.message,
        referenceId: dto.referenceId ?? null,
        referenceType: dto.referenceType ?? null,
        ...(createdBy
          ? { createdByUser: { connect: { id: createdBy } } }
          : {}),
      },
    });

    await (this.prisma as any).notificationRecipient.createMany({
      data: recipientUserIds.map((userId) => ({ notificationId: notification.id, userId })),
    });

    const fullNotification = await (this.prisma as any).notification.findUnique({
      where: { id: notification.id },
    });

    if (!fullNotification) {
      throw new NotFoundException('Notifikasi gagal dimuat ulang');
    }

    const recipients = await (this.prisma as any).notificationRecipient.findMany({
      where: { notificationId: notification.id },
    });

    for (const recipient of recipients) {
      this.realtimeGateway.sendToUser(recipient.userId, 'new_notification', {
        id: fullNotification.id,
        type: fullNotification.type,
        priority: fullNotification.priority,
        title: fullNotification.title,
        message: fullNotification.message,
        referenceId: fullNotification.referenceId,
        referenceType: fullNotification.referenceType,
        createdAt: fullNotification.createdAt,
      });
    }

    return fullNotification;
  }

  async findByUser(userId: string) {
    return (this.prisma as any).notification.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        recipients: {
          some: { userId },
        },
      },
      include: {
        recipients: {
          where: { userId },
        },
      },
    });
  }

  async findUnreadCount(userId: string) {
    return (this.prisma as any).notificationRecipient.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markRead(notificationId: string, userId: string) {
    const recipient = await (this.prisma as any).notificationRecipient.findUnique({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
    });

    if (!recipient) {
      throw new NotFoundException('Notification not found');
    }

    if (recipient.isRead) {
      return recipient;
    }

    return (this.prisma as any).notificationRecipient.update({
      where: {
        notificationId_userId: {
          notificationId,
          userId,
        },
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  async markAllRead(userId: string) {
    await (this.prisma as any).notificationRecipient.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { success: true };
  }

  private async resolveUserIdsByTarget(target: { type: NotificationTargetType; id: string }): Promise<string[]> {
    switch (target.type) {
      case NotificationTargetType.USER:
        return [target.id];
      case NotificationTargetType.ROLE:
        return this.getUserIdsByRole(target.id);
      case NotificationTargetType.CLASS:
        return this.getStudentUserIdsByRombel(target.id);
      case NotificationTargetType.MAJOR:
        return this.getStudentUserIdsByMajor(target.id);
      case NotificationTargetType.EXAM:
        return this.getParticipantUserIdsByExam(target.id);
      default:
        throw new ForbiddenException('Unsupported notification target type');
    }
  }

  private async getUserIdsByRole(role: string) {
    const users = await this.prisma.user.findMany({
      where: { role: role as Role, isActive: true },
      select: { id: true },
    });
    return users.map((u) => u.id);
  }

  private async getStudentUserIdsByRombel(rombelId: string) {
    const students = await this.prisma.student.findMany({
      where: { rombelId },
      include: { user: true },
    });
    return students.map((s) => s.user.id);
  }

  private async getStudentUserIdsByMajor(majorId: string) {
    const students = await this.prisma.student.findMany({
      where: { majorId },
      include: { user: true },
    });
    return students.map((s) => s.user.id);
  }

  private async getParticipantUserIdsByExam(examId: string) {
    const sessions = await this.prisma.examSession.findMany({
      where: { examId },
      include: { student: { include: { user: true } } },
    });
    return sessions.map((s) => s.student.user.id);
  }
}
