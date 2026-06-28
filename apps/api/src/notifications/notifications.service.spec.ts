import { Test } from '@nestjs/testing';
import { ModuleRef } from '@nestjs/core';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationTargetType, NotificationPriority } from './dto/create-notification.dto';

describe('NotificationsService', () => {
  const prisma = {
    customRole: { findMany: jest.fn() },
    notificationRolePolicy: { upsert: jest.fn() },
    user: { findMany: jest.fn() },
    notificationPreference: { findUnique: jest.fn() },
    examSession: { findUnique: jest.fn(), findMany: jest.fn() },
    exam: { findUnique: jest.fn() },
    teacher: { findUnique: jest.fn() },
    student: { findMany: jest.fn() },
    notification: { create: jest.fn(), findUnique: jest.fn(), findMany: jest.fn() },
    notificationRecipient: { createMany: jest.fn(), findMany: jest.fn(), findUnique: jest.fn(), count: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    $transaction: jest.fn(async (fn) => fn(prisma)),
  } as any;
  const moduleRef = { get: jest.fn(() => ({ sendToUser: jest.fn() })) } as any;

  it('create reject empty targets', async () => {
    const mod = await Test.createTestingModule({ providers: [NotificationsService, { provide: PrismaService, useValue: prisma }, { provide: ModuleRef, useValue: moduleRef }] }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.create({ targets: [] } as any)).rejects.toThrow('Minimal satu target notifikasi harus diisi');
  });

  it('markRead returns recipient when already read', async () => {
    prisma.notificationRecipient.findUnique.mockResolvedValue({ isRead: true });
    const mod = await Test.createTestingModule({ providers: [NotificationsService, { provide: PrismaService, useValue: prisma }, { provide: ModuleRef, useValue: moduleRef }] }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.markRead('n1', 'u1')).resolves.toEqual({ isRead: true });
  });

  it('updateNotificationPolicy returns success', async () => {
    const mod = await Test.createTestingModule({ providers: [NotificationsService, { provide: PrismaService, useValue: prisma }, { provide: ModuleRef, useValue: moduleRef }] }).compile();
    const service = mod.get(NotificationsService);
    await expect(service.updateNotificationPolicy({ roleId: 'r1', policies: [{ type: NotificationType.EXAM_SUBMITTED, isEnabled: true }] } as any)).resolves.toEqual({ success: true });
  });
});