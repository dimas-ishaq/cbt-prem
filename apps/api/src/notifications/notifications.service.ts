import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateNotificationDto, NotificationTargetType } from './dto/create-notification.dto';
import { NotificationPriority, Role } from '@prisma/client';
import { RealtimeGateway } from '../realtime/realtime.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(dto: CreateNotificationDto, createdBy?: string) {
    const resolvedTargets = await Promise.all(dto.targets.map((target) => this.resolveUserIdsByTarget(target)));
    const recipientUserIds = Array.from(new Set(resolvedTargets.flat()));

    const notification = await this.prisma.notification.create({
      data: {
        type: dto.type,
        priority: dto.priority ?? 'NORMAL',
        title: dto.title,
        message: dto.message,
        referenceId: dto.referenceId ?? null,
        referenceType: dto.referenceType ?? null,
        createdBy,
      },
    });

    // Create recipients
    await this.prisma.notificationRecipient.createMany({
      data: recipientUserIds.map((userId) => ({ notificationId: notification.id, userId })),
    });

    // Fetch full notification with recipients for real-time emission
    const fullNotification = await this.prisma.notification.findUnique({
      where: { id: notification.id },
      include: { notificationRecipients: true },
    });

    for (const recipient of fullNotification.notificationRecipients) {
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
    return this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      where: {
        notificationRecipients: {
          some: { userId },
        },
      },
      include: {
        notificationRecipients: {
          where: { userId },
        },
      },
    });
  }

  async findUnreadCount(userId: string) {
    return this.prisma.notificationRecipient.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  async markRead(notificationId: string, userId: string) {
    const recipient = await this.prisma.notificationRecipient.findUnique({
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

    return this.prisma.notificationRecipient.update({
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
    await this.prisma.notificationRecipient.updateMany({
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
