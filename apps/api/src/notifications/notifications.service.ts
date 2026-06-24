import { Injectable, ForbiddenException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationTargetType } from './dto/create-notification.dto';
import { Role } from '@prisma/client';
import { NotificationPriority } from './dto/create-notification.dto';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(forwardRef(() => RealtimeGateway))
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateNotificationDto, createdBy?: string) {
    if (!dto.targets?.length) {
      throw new ForbiddenException('Minimal satu target notifikasi harus diisi');
    }

    const resolvedTargets = await Promise.all(dto.targets.map((target) => this.resolveUserIdsByTarget(target)));
    const recipientUserIds = Array.from(new Set(resolvedTargets.flat())).filter(Boolean);

    if (recipientUserIds.length === 0) {
      throw new NotFoundException('Tidak ada penerima notifikasi yang valid');
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
